import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Button } from "@/components/ui/button";

/** Render locally rather than relying on a browser's embedded PDF plug-in. */
export default function PdfPreview({ url, title }: { url: string; title: string }) {
  const [document, setDocument] = useState<PDFDocumentProxy>();
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(300);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;
    setLoading(true);
    setError("");
    setPage(1);
    setDocument(undefined);
    void import("pdfjs-dist").then(async (pdf) => {
      if (cancelled) return;
      pdf.GlobalWorkerOptions.workerSrc = workerUrl;
      const task = pdf.getDocument(url);
      destroy = () => { void task.destroy(); };
      const loaded = await task.promise;
      if (!cancelled) setDocument(loaded);
    }).catch(() => { if (!cancelled) { setError("The preview could not load. Please download the PDF to read it."); setLoading(false); } });
    return () => { cancelled = true; destroy?.(); };
  }, [url]);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(100, entry.contentRect.width)));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!document) return;
    let cancelled = false;
    let cancelRender: (() => void) | undefined;
    setLoading(true);
    setText("");
    setError("");
    void document.getPage(page).then(async (pdfPage) => {
      if (cancelled || !canvas.current) return;
      const viewport = pdfPage.getViewport({ scale: width / pdfPage.getViewport({ scale: 1 }).width });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.current.width = Math.floor(viewport.width * ratio);
      canvas.current.height = Math.floor(viewport.height * ratio);
      const render = pdfPage.render({ canvas: canvas.current, viewport, transform: [ratio, 0, 0, ratio, 0, 0] });
      cancelRender = () => render.cancel();
      await render.promise;
      const content = await pdfPage.getTextContent();
      if (!cancelled) { setText(content.items.map(item => "str" in item ? item.str : "").join(" ")); setLoading(false); }
    }).catch(() => { if (!cancelled) { setError("This page could not be displayed. Please download the PDF."); setLoading(false); } });
    return () => { cancelled = true; cancelRender?.(); };
  }, [document, page, width]);
  return <div className="min-w-0 bg-slate-100 p-3 sm:p-5">
    <div className="mb-3 flex flex-wrap items-center justify-center gap-3" aria-label="Document page navigation">
      <Button type="button" variant="outline" disabled={!document || page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
      <span className="text-sm" aria-live="polite">Page {page}{document ? ` of ${document.numPages}` : ""}</span>
      <Button type="button" variant="outline" disabled={!document || page === document.numPages} onClick={() => setPage(p => p + 1)}>Next</Button>
    </div>
    {loading && <p role="status" className="mb-3 text-center text-sm">Loading document page…</p>}
    {error && <p role="alert" className="p-4 text-red-700">{error}</p>}
    <div ref={container} className="mx-auto w-full max-w-3xl"><canvas ref={canvas} role="img" aria-label={`${title}, page ${page}. Text version below.`} className="block h-auto w-full bg-white shadow-sm" /></div>
    {text && <details className="mx-auto mt-4 max-w-3xl rounded-lg bg-white p-4 text-sm"><summary className="cursor-pointer font-medium">Read page {page} as text</summary><p className="mt-3 whitespace-pre-wrap leading-relaxed">{text}</p></details>}
  </div>;
}

import { useEffect, useRef, useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import PdfPreview from "@/components/PdfPreview";
import welfareUrl from "@/assets/Mulembe_Welfare_Constitution 01.pdf?url";

export default function WelfareConstitution() {
  const [open, setOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (open) heading.current?.focus(); }, [open]);
  return <section aria-labelledby="welfare-document-title" className="mb-8 overflow-hidden rounded-xl border border-luhya-gold/40 bg-luhya-cream/30">
    <div className="p-5 sm:p-6">
      <h4 id="welfare-document-title" className="flex items-center gap-2 text-lg font-semibold text-luhya-navy"><FileText aria-hidden="true" /> Welfare constitution</h4>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Read the Mulembe Welfare Association NSW constitution before completing your membership declaration. You can read all 20 pages here or download a copy.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button ref={trigger} type="button" aria-expanded={open} aria-controls="welfare-document-preview" onClick={() => setOpen(!open)}>{open ? "Close preview" : "View welfare constitution"}</Button>
        <Button asChild variant="outline"><a href={welfareUrl} download="Mulembe-Welfare-Constitution.pdf"><Download className="mr-2 h-4 w-4" aria-hidden="true" />Download PDF</a></Button>
      </div>
    </div>
    {open && <div id="welfare-document-preview">
      <h5 ref={heading} tabIndex={-1} className="px-6 py-3 font-semibold">Welfare constitution preview</h5>
      <PdfPreview url={welfareUrl} title="Mulembe Welfare Constitution" />
      <div className="p-4"><Button type="button" variant="outline" onClick={() => { setOpen(false); trigger.current?.focus(); }}>Return to membership form</Button></div>
    </div>}
  </section>;
}

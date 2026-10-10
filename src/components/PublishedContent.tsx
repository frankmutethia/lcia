import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Calendar, MapPin, Quote } from "lucide-react";
import { cmsImage, usePublishedContent, type ContentItem, type ContentType } from "@/lib/cms";

export default function PublishedContent({ type }: { type: ContentType }) {
  const query = usePublishedContent();
  const [selected, setSelected] = useState<ContentItem>();
  const items = query.data?.items.filter(item => item.type === type) ?? [];
  if (!items.length) return null;
  return <div className="mb-12">
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map(item => <article key={item.id} className="min-w-0 overflow-hidden rounded-xl border bg-white shadow-sm">
      {item.data.image && (type === "gallery" ? <button type="button" onClick={() => setSelected(item)} className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luhya-green" aria-label={`View ${item.data.title}`}><img src={cmsImage(item.data.image)} alt={item.data.title} loading="lazy" className="aspect-[4/3] w-full object-cover" /></button> : <img src={cmsImage(item.data.image)} alt={item.data.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />)}
      <div className="p-5">{type === "testimonial" && <Quote className="mb-3 h-6 w-6 text-luhya-green" aria-hidden="true" />}<h3 className="break-words text-lg font-semibold text-luhya-navy">{item.data.title}</h3>{type === "testimonial" && <p className="mt-1 text-sm text-muted-foreground">{item.data.role}</p>}<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{item.data.description}</p>{type === "event" && <div className="mt-4 space-y-2 text-sm"><p className="flex items-center gap-2"><Calendar className="h-4 w-4 shrink-0" aria-hidden="true" /><span>{item.data.date} · {item.data.time}</span></p><p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="break-words">{item.data.location}</span></p><p className="text-xs text-luhya-green">{item.data.category}</p></div>}</div>
    </article>)}</div>
    <Dialog.Root open={!!selected} onOpenChange={open => { if (!open) setSelected(undefined); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[70] bg-black/80" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[71] max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-4"><Dialog.Title className="pr-12 font-semibold">{selected?.data.title}</Dialog.Title><Dialog.Description className="mb-3 text-sm text-muted-foreground">{selected?.data.description || "Community gallery image"}</Dialog.Description>{selected?.data.image && <img src={cmsImage(selected.data.image)} alt={selected.data.title} className="max-h-[70dvh] w-full object-contain" />}<Dialog.Close aria-label="Close image" className="absolute right-3 top-3 rounded p-2"><X className="h-5 w-5" /></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}

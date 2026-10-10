import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Upload, X, Pencil, Loader2, Search, Filter, Clock, MapPin, MessageSquareQuote, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CMS_MODE, cmsImage, cmsRequest, type ContentItem, type ContentType } from "@/lib/cms";

const copy: Record<ContentType, { eyebrow: string; title: string; text: string; add: string; dialog: string; search: string; empty: string }> = {
  event: { eyebrow: "Events & activities", title: "Bringing our community together", text: "Create gatherings, connections, and celebrations for the Mulembe community. Published events appear on the landing page.", add: "Create event", dialog: "Create an event or activity", search: "Search events", empty: "No events yet. Create your first event or activity." },
  gallery: { eyebrow: "Community gallery", title: "Moments that bring us closer", text: "Upload single images or a batch of up to 20. Published images appear in the landing page gallery.", add: "Add images", dialog: "Upload gallery images", search: "Search images", empty: "No images yet. Add a single photo or upload a batch." },
  testimonial: { eyebrow: "Testimonials", title: "Voices from our community", text: "Share stories and reflections from the people who make Mulembe feel like home.", add: "Add testimonial", dialog: "Add a community testimonial", search: "Search testimonials", empty: "No testimonials yet. Add the first community story." },
  category: { eyebrow: "Business categories", title: "Discover local businesses", text: "Organise the skills, services, and enterprises within our community.", add: "Add category", dialog: "Create a business category", search: "Search categories", empty: "No categories yet. Add your first business category." },
};
const field = "mt-2 block w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm";
const empty = { title: "", description: "", date: "", time: "", location: "", category: "", role: "Community member", consent: false };

function Status({ status }: { status: ContentItem["status"] }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${status === "published" ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200" : "bg-secondary text-secondary-foreground"}`}>{status}</span>;
}
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("");
}
function formatDate(date?: string) {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export default function ContentManager({ type }: { type: ContentType }) {
  const text = copy[type];
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ["cms-admin"], queryFn: () => cmsRequest<{ items: ContentItem[] }>("content"), retry: false });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContentItem>();
  const [values, setValues] = useState(empty);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const previews = useMemo(() => files.map(file => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews]);
  const ofType = (query.data?.items ?? []).filter(item => item.type === type);
  const eventCategories = [...new Set(ofType.map(item => item.data.category).filter(Boolean))] as string[];
  const items = ofType.filter(item =>
    (statusFilter === "all" || item.status === statusFilter) &&
    (categoryFilter === "all" || item.data.category === categoryFilter) &&
    `${item.data.title} ${item.data.description} ${item.data.location ?? ""}`.toLowerCase().includes(search.toLowerCase()));

  function show(item?: ContentItem) {
    setEditing(item); setValues({ ...empty, ...item?.data }); setStatus(item?.status ?? "draft"); setFiles([]); setError(""); setNotice(""); setOpen(true);
  }
  function chooseFiles(list: FileList | null) {
    const selected = Array.from(list ?? []);
    const max = type === "gallery" && !editing ? 20 : 1;
    // The preview store downsizes images before saving, so phone photos are fine there.
    const [each, total] = CMS_MODE === "local" ? [20, 400] : [5, 25];
    if (selected.length > max || selected.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > each * 1024 * 1024) || selected.reduce((sum, file) => sum + file.size, 0) > total * 1024 * 1024) {
      setError(`Choose up to ${max} JPEG, PNG or WebP image${max > 1 ? "s" : ""}, each under ${each} MB${max > 1 ? ` and ${total} MB total` : ""}.`); setFiles([]); return;
    }
    setError(""); setFiles(selected);
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (saving) return;
    if (type === "gallery" && !editing && !files.length) { setError("Choose at least one image."); return; }
    setSaving(true); setError("");
    try {
      const body = new FormData();
      body.append("item", JSON.stringify({ ...values, type, status, id: editing?.id, version: editing?.version }));
      files.forEach(file => body.append("images[]", file));
      await cmsRequest("save", body);
      await Promise.all([cache.invalidateQueries({ queryKey: ["cms-admin"] }), cache.invalidateQueries({ queryKey: ["cms-public"] })]);
      setOpen(false);
      const count = type === "gallery" && files.length > 1 ? `${files.length} images ` : "";
      setNotice(status === "published" ? `${count}Published successfully. It is now visible on the landing page.` : `${count}Saved as a draft. Drafts are visible only to staff.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save. Please try again."); }
    finally { setSaving(false); }
  }
  function textField(key: keyof typeof empty, label: string, fieldType = "text", placeholder?: string) {
    return <label className="block text-sm font-medium">{label}<input className={field} type={fieldType} required placeholder={placeholder} maxLength={key === "location" ? 300 : 200} value={String(values[key])} onChange={event => setValues({ ...values, [key]: event.target.value })} /></label>;
  }
  const editButton = (item: ContentItem, label = "Edit") => <Button size="sm" variant="outline" onClick={() => show(item)} aria-label={`Edit ${item.data.title}`}><Pencil className="mr-1.5 h-3.5 w-3.5" />{label}</Button>;

  let list: ReactNode = null;
  if (type === "event") list = <div className="overflow-hidden rounded-md border border-border bg-card">
    <div className="hidden grid-cols-[2fr_1fr_1fr_100px_90px] gap-4 border-b border-border bg-secondary/40 px-6 py-4 text-[11px] font-bold uppercase text-muted-foreground md:grid"><span>Event</span><span>Date</span><span>Location</span><span>Status</span><span className="sr-only">Actions</span></div>
    {items.map(item => <div key={item.id} className="grid gap-2 border-b border-border px-6 py-5 last:border-0 md:grid-cols-[2fr_1fr_1fr_100px_90px] md:items-center md:gap-4">
      <div className="min-w-0"><div className="break-words text-sm font-semibold">{item.data.title}</div><div className="mt-1 text-xs text-muted-foreground">{item.data.category}</div></div>
      <span className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5 md:hidden" aria-hidden="true" />{formatDate(item.data.date)}{item.data.time && <span className="md:block">· {item.data.time}</span>}</span>
      <span className="flex items-center gap-2 break-words text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0 md:hidden" aria-hidden="true" />{item.data.location}</span>
      <div><Status status={item.status} /></div>
      <div>{editButton(item)}</div>
    </div>)}
  </div>;
  if (type === "gallery") list = <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map(item => <article key={item.id} className="group min-w-0 overflow-hidden rounded-md border border-border bg-card">
    <div className="relative aspect-[4/3] overflow-hidden bg-secondary">{item.data.image && <img src={cmsImage(item.data.image)} alt={item.data.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}<span className="absolute left-3 top-3"><Status status={item.status} /></span></div>
    <div className="flex items-start justify-between gap-3 p-4"><div className="min-w-0"><div className="break-words text-sm font-semibold">{item.data.title}</div><div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.data.description || "Mulembe Community NSW"}</div></div>{editButton(item)}</div>
  </article>)}</div>;
  if (type === "testimonial") list = <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">{items.map(item => <article key={item.id} className="flex min-h-64 min-w-0 flex-col rounded-md border border-border bg-card p-6">
    <div className="flex items-start justify-between gap-3"><MessageSquareQuote className="h-6 w-6 text-primary" strokeWidth={1.5} aria-hidden="true" /><Status status={item.status} /></div>
    <blockquote className="mt-5 flex-1 whitespace-pre-wrap break-words text-sm leading-7 text-card-foreground">“{item.data.description}”</blockquote>
    <div className="mt-7 flex items-center gap-3 border-t border-border pt-5">
      {item.data.image ? <img src={cmsImage(item.data.image)} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">{initials(item.data.title)}</span>}
      <span className="min-w-0 flex-1"><strong className="block break-words text-xs">{item.data.title}</strong><span className="text-[11px] text-muted-foreground">{item.data.role}</span></span>
      {editButton(item)}
    </div>
  </article>)}</div>;
  if (type === "category") list = <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(item => <article key={item.id} className="min-w-0 rounded-md border border-border bg-card p-6">
    <div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">{String(ofType.indexOf(item) + 1).padStart(2, "0")}</span><Status status={item.status} /></div>
    <h3 className="mt-6 break-words text-base font-semibold">{item.data.title}</h3>
    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{item.data.description}</p>
    <div className="mt-6 border-t border-border pt-4">{editButton(item, "Edit category")}</div>
  </article>)}</div>;

  return <section>
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><div className="mb-3 text-[11px] font-bold uppercase text-primary">{text.eyebrow}</div><h2 className="text-2xl font-bold sm:text-[30px]">{text.title}</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{text.text}</p></div>
      <Button onClick={() => show()} className="h-10 gap-2">{type === "gallery" ? <ImagePlus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{text.add}</Button>
    </div>
    {notice && <p role="status" className="mb-5 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900">{notice}</p>}
    <div className="mb-5 flex flex-wrap gap-3">
      <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input className="h-10 pl-10" value={search} onChange={event => setSearch(event.target.value)} placeholder={text.search} aria-label={text.search} /></div>
      {type === "event" && eventCategories.length > 0 && <div className="relative"><Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><select aria-label="Filter by category" className="h-10 rounded-md border border-input bg-background pl-9 pr-7 text-sm" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}><option value="all">All categories</option>{eventCategories.map(category => <option key={category}>{category}</option>)}</select></div>}
      <select aria-label="Filter by publication status" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="draft">Drafts</option><option value="published">Published</option></select>
    </div>
    {query.isPending && <p role="status" className="py-10 text-center text-sm text-muted-foreground">Loading content…</p>}
    {query.isError && <div role="alert" className="rounded-md border border-border bg-card p-5 text-sm"><p>{query.error.message}</p><Button variant="outline" className="mt-3" onClick={() => query.refetch()}>Retry</Button></div>}
    {!query.isPending && !query.isError && (items.length ? list : <div className="rounded-md border border-dashed border-border bg-card p-10 text-center"><p className="font-semibold">{ofType.length ? "Nothing matches your search" : text.empty}</p>{!ofType.length && <Button className="mt-4 gap-2" onClick={() => show()}><Plus className="h-4 w-4" />{text.add}</Button>}</div>)}

    <Dialog.Root open={open} onOpenChange={value => { if (!saving) setOpen(value); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50" /><Dialog.Content className="admin-ui fixed left-1/2 top-1/2 z-[71] max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-background p-5 text-foreground shadow-xl sm:p-7">
      <Dialog.Title className="pr-8 text-xl font-bold">{editing ? `Edit ${text.eyebrow.toLowerCase().replace(/s$/, "")}` : text.dialog}</Dialog.Title>
      <Dialog.Description className="mt-2 text-sm text-muted-foreground">Drafts stay private to staff. Published content appears on the landing page.</Dialog.Description>
      <Dialog.Close disabled={saving} aria-label="Close dialog" className="absolute right-4 top-4 rounded p-2 hover:bg-secondary"><X className="h-5 w-5" /></Dialog.Close>
      <form onSubmit={save} className="mt-6 space-y-5" aria-busy={saving}>
        {textField("title", type === "testimonial" ? "Person’s name" : type === "gallery" ? "Caption / album title" : type === "category" ? "Category name" : "Event / activity title", "text", type === "category" ? "e.g. Food & catering" : undefined)}
        <label className="block text-sm font-medium">{type === "testimonial" ? "Testimonial" : "Description"}{type === "gallery" && <span className="font-normal text-muted-foreground"> (optional)</span>}<textarea className={field} required={type !== "gallery"} maxLength={5000} rows={4} value={values.description} onChange={event => setValues({ ...values, description: event.target.value })} /></label>
        {type === "event" && <><div className="grid gap-4 sm:grid-cols-2">{textField("date", "Event date", "date")}{textField("time", "Time (Sydney)", "text", "e.g. 6:00 pm – 11:00 pm")}</div>{textField("location", "Venue / location", "text", "e.g. Parramatta, NSW")}{textField("category", "Event category", "text", "e.g. Culture, Networking")}</>}
        {type === "testimonial" && <>{textField("role", "Role / affiliation")}<label className="flex items-start gap-3 text-sm"><input type="checkbox" required checked={values.consent} onChange={event => setValues({ ...values, consent: event.target.checked })} className="mt-1 h-4 w-4" />I have permission to publish this person’s testimonial and any supplied photo.</label></>}
        {type !== "category" && <div className="rounded-md border border-dashed border-border p-4">
          <label className="block text-sm font-medium"><Upload className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />{type === "gallery" ? (editing ? "Replace image (optional)" : "Select one or more images") : type === "testimonial" ? "Portrait photo (optional)" : "Cover image (optional)"}<input type="file" required={type === "gallery" && !editing} accept="image/jpeg,image/png,image/webp" multiple={type === "gallery" && !editing} onChange={event => chooseFiles(event.target.files)} className="mt-3 block w-full min-w-0 text-sm file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-2" /></label>
          <p className="mt-2 text-xs text-muted-foreground">JPEG, PNG or WebP, up to {CMS_MODE === "local" ? 20 : 5} MB each.{type === "gallery" && !editing && " Bulk upload up to 20 images at once; they share this caption with numbered suffixes and can be edited individually afterwards."}</p>
          {editing?.data.image && !files.length && <img src={cmsImage(editing.data.image)} alt="Current image" className="mt-3 h-24 rounded object-cover" />}
          {files.length > 0 && <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">{files.map((file, index) => <li key={`${file.name}-${index}`} className="min-w-0"><img src={previews[index]} alt={file.name} className="aspect-square w-full rounded object-cover" /><span className="mt-1 block truncate text-[10px] text-muted-foreground">{file.name}</span></li>)}</ul>}
        </div>}
        <label className="block text-sm font-medium">Publication status<select className={field} value={status} onChange={event => setStatus(event.target.value as typeof status)}><option value="draft">Draft — staff only</option><option value="published">Published — landing page</option></select></label>
        {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4"><Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancel</Button><Button disabled={saving} type="submit">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{saving ? "Saving…" : status === "published" ? "Save and publish" : "Save draft"}</Button></div>
      </form>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </section>;
}

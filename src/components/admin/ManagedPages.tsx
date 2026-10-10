import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ContentManager from "./ContentManager";
import { cmsRequest, type ContentItem } from "@/lib/cms";
import { usePreview } from "./preview-context";

export function EventsPage() { return <ContentManager type="event" />; }
export function GalleryPage() { return <ContentManager type="gallery" />; }
export function TestimonialsPage() { return <ContentManager type="testimonial" />; }
export function CategoriesPage() { return <ContentManager type="category" />; }
export function Dashboard() {
  const { user } = usePreview();
  const query = useQuery({ queryKey: ["cms-admin"], queryFn: () => cmsRequest<{ items: ContentItem[] }>("content"), retry: false });
  return <section><h2 className="text-2xl font-bold">Welcome, {user?.name}</h2><p className="mt-2 text-muted-foreground">Manage community content and review what is published.</p>{query.isError && <p role="alert" className="mt-5">{query.error.message}</p>}<div className="mt-8 grid gap-4 sm:grid-cols-2">{([['event','Events & activities','events'],['gallery','Community gallery','gallery'],['testimonial','Testimonials','testimonials'],['category','Business categories','business-categories']] as const).map(([type,title,path]) => <Link to={`/admin/${path}`} key={type} className="rounded-xl border bg-card p-6 hover:border-primary"><h3 className="font-semibold">{title}</h3><p className="my-3 text-3xl font-bold">{query.isPending ? "…" : query.data?.items.filter(item => item.type === type).length ?? "—"}</p><p className="text-sm text-muted-foreground">{query.data?.items.filter(item => item.type === type && item.status === 'published').length ?? 0} published</p></Link>)}</div>{user?.role === 'administrator' && <Link to="/admin/users" className="mt-6 inline-block font-medium underline">Manage members and staff roles</Link>}</section>;
}

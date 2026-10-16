import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ContentManager from "./ContentManager";
import { api, eventDate, type ApiDocument } from "@/lib/api";
import { ErrorMessage } from "@/components/api/Controls";
import { usePreview } from "./preview-context";
export function EventsPage() {
  return <ContentManager resource="events" />;
}
export function GalleryPage() {
  return <ContentManager resource="albums" />;
}
export function TestimonialsPage() {
  return <ContentManager resource="testimonials" />;
}
export function CategoriesPage() {
  return <ContentManager resource="business-categories" />;
}
export function BusinessesPage() {
  return <ContentManager resource="businesses" />;
}
type Count = { _id: string; count: number; name?: string };
type DashboardData = {
  eventsByStatus: Count[];
  eventsByTemporal: Count[];
  albums: number;
  galleryImages: number;
  testimonials: Count[];
  businessesByStatus: Count[];
  businessesByCategory: Count[];
  activeServices: number;
  recentUpdates: (ApiDocument & { resource: string })[];
  nextUpcomingEvents: ApiDocument[];
};
export function Dashboard() {
  const { user } = usePreview();
  const query = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => api<DashboardData>("/admin/dashboard"),
    retry: false,
  });
  const data = query.data?.data;
  const sum = (items?: Count[]) =>
    items?.reduce((total, item) => total + item.count, 0) ?? 0;
  return (
    <section>
      <h2 className="text-2xl font-bold">Welcome, {user?.name}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Your community website at a glance.
      </p>
      <ErrorMessage error={query.error} />
      {query.isPending && <p role="status">Loading dashboard…</p>}
      {data && (
        <>
          <div className="my-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Events & activities", sum(data.eventsByStatus), "events"],
              ["Albums", data.albums, "gallery"],
              ["Gallery images", data.galleryImages, "gallery"],
              ["Testimonials", sum(data.testimonials), "testimonials"],
              ["Businesses", sum(data.businessesByStatus), "businesses"],
              ["Active services", data.activeServices, "businesses"],
            ].map(([title, count, path]) => (
              <Link
                key={title}
                to={`/admin/${path}`}
                className="rounded-xl border bg-card p-5"
              >
                <h3 className="font-medium">{title}</h3>
                <p className="mt-3 text-3xl font-bold">{count}</p>
              </Link>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border p-5">
              <h3 className="mb-4 text-lg font-semibold">Recent updates</h3>
              {data.recentUpdates.map((item) => (
                <div
                  key={`${item.resource}-${item._id}`}
                  className="border-t py-3"
                >
                  <p className="font-medium">{item.title || item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.resource} · {item.status} ·{" "}
                    {item.updatedAt
                      ? new Date(item.updatedAt).toLocaleDateString("en-AU")
                      : ""}
                  </p>
                </div>
              ))}
            </section>
            <section className="rounded-xl border p-5">
              <h3 className="mb-4 text-lg font-semibold">Next events</h3>
              {data.nextUpcomingEvents.map((item) => (
                <p className="border-t py-3" key={item._id}>
                  {item.title}
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {eventDate(item)}
                  </span>
                </p>
              ))}
            </section>
          </div>
        </>
      )}
    </section>
  );
}

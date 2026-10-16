import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  api,
  eventDate,
  eventTime,
  mediaUrl,
  type ApiDocument,
} from "@/lib/api";
import { ErrorMessage } from "@/components/api/Controls";
import { usePublicHome } from "@/lib/public-content";
export function PublicCards({
  items,
  resource,
}: {
  items: ApiDocument[];
  resource: string;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const image = mediaUrl(
          item.media || item.cover || item.photo || item.image,
        );
        const link =
          item.slug && ["events", "albums", "businesses"].includes(resource)
            ? `/${resource}/${encodeURIComponent(item.slug)}`
            : undefined;
        return (
          <article
            key={item._id}
            className="min-w-0 overflow-hidden rounded-xl border bg-white shadow-sm"
          >
            {image && (
              <img
                src={image}
                alt={item.alt || item.title || item.name || ""}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            )}
            <div className="p-5">
              <h3 className="break-words text-xl font-semibold text-luhya-navy">
                {link ? (
                  <Link className="hover:underline" to={link}>
                    {item.title || item.name}
                  </Link>
                ) : (
                  item.title || item.name
                )}
              </h3>
              {resource === "events" && (
                <p className="mt-2 text-sm text-luhya-green">
                  {eventDate(item)} · {eventTime(item)}
                  <span className="block">
                    {item.venueLabel || item.venueName}
                  </span>
                </p>
              )}
              {resource === "testimonials" && (
                <p
                  className="mt-2 text-sm"
                  aria-label={`${item.rating} out of 5 stars`}
                >
                  {"★".repeat(Math.max(0, Math.min(5, item.rating || 0)))} ·{" "}
                  {item.memberTitle}
                </p>
              )}
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                {item.summary ||
                  item.comment ||
                  item.caption ||
                  item.description}
              </p>
              {resource === "albums" && (
                <p className="mt-2 text-sm">{item.photoCount ?? 0} photos</p>
              )}
              {resource === "business-categories" && (
                <p className="mt-2 text-sm">
                  {item.businessCount ?? 0} businesses
                </p>
              )}
              {item.services?.length ? (
                <ul className="mt-3 list-inside list-disc text-sm">
                  {item.services.map((service) => (
                    <li key={service._id}>{service.title}</li>
                  ))}
                </ul>
              ) : null}
              {link && (
                <Link
                  className="mt-4 inline-block text-sm font-semibold text-luhya-green underline"
                  to={link}
                >
                  View details
                </Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
export default function PublishedContent({
  type,
}: {
  type: "event" | "gallery" | "testimonial" | "category" | "business";
}) {
  const query = usePublicHome();
  const categories = useQuery({
    queryKey: ["public", "home-categories"],
    queryFn: () =>
      api<ApiDocument[]>("/business-categories", { params: { limit: 6 } }),
    enabled: type === "category",
    staleTime: 30000,
    retry: false,
  });
  const home = query.data?.data;
  const resource = {
    event: "events",
    gallery: "albums",
    testimonial: "testimonials",
    category: "business-categories",
    business: "businesses",
  }[type];
  const items =
    type === "category"
      ? categories.data?.data
      : home
        ? type === "event"
          ? [
              ...new Map(
                [...home.upcomingEvents, ...home.featuredEvents].map((item) => [
                  item._id,
                  item,
                ]),
              ).values(),
            ]
          : type === "gallery"
            ? home.albums
            : type === "testimonial"
              ? home.testimonials
              : home.businesses
        : [];
  const target = type === "category" ? "/businesses" : `/${resource}`;
  const current = type === "category" ? categories : query;
  return (
    <div className="mb-10">
      {current.isPending && (
        <p role="status" className="py-6">
          Loading community updates…
        </p>
      )}
      <ErrorMessage error={current.error} />
      {current.isError && (
        <button
          className="mb-4 text-sm underline"
          onClick={() => current.refetch()}
        >
          Try again
        </button>
      )}
      {items?.length ? (
        <PublicCards items={items} resource={resource} />
      ) : !current.isPending && !current.isError ? (
        <p className="py-6 text-muted-foreground">
          New community updates will appear here when published.
        </p>
      ) : null}
      <Link
        to={target}
        className="mt-5 inline-block font-medium text-luhya-green underline"
      >
        {type === "testimonial" ? "Read more / share your story" : "Browse all"}
      </Link>
    </div>
  );
}

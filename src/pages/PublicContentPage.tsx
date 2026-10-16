import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  api,
  mediaUrl,
  eventDate,
  eventTime,
  type ApiDocument,
} from "@/lib/api";
import {
  ErrorMessage,
  FieldErrors,
  Pagination,
  fieldClass,
} from "@/components/api/Controls";
import { PublicCards } from "@/components/PublishedContent";
import { Button } from "@/components/ui/button";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-luhya-cream/20 text-luhya-navy">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <Link to="/" className="font-bold">
            Mulembe Community NSW
          </Link>
          <nav
            aria-label="Community pages"
            className="flex flex-wrap items-center gap-4 text-base"
          >
            <Link to="/events">Events</Link>
            <Link to="/albums">Gallery</Link>
            <Link to="/testimonials">Testimonials</Link>
            <Link to="/businesses">Businesses</Link>
            <Link to="/login">Member Login</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
export default function PublicContentPage({
  resource,
}: {
  resource:
    "events" | "albums" | "gallery/images" | "testimonials" | "businesses";
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [temporal, setTemporal] = useState("upcoming");
  const [location, setLocation] = useState("");
  const [params] = useSearchParams();
  const [category, setCategory] = useState(params.get("category") || "");
  const [categoryPage, setCategoryPage] = useState(1);
  const [selected, setSelected] = useState<ApiDocument>();
  const query = useQuery({
    queryKey: ["public", resource, page, search, temporal, location, category],
    queryFn: () =>
      api<ApiDocument[]>(`/${resource}`, {
        params: {
          page,
          limit: 12,
          search: search || undefined,
          ...(resource === "events" ? { temporal } : {}),
          ...(resource === "businesses"
            ? {
                category: category || undefined,
                location: location || undefined,
              }
            : {}),
        },
      }),
    staleTime: 30000,
    retry: false,
  });
  const categories = useQuery({
    queryKey: ["public", "business-categories", categoryPage],
    queryFn: () =>
      api<ApiDocument[]>("/business-categories", {
        params: { page: categoryPage, limit: 100 },
      }),
    enabled: resource === "businesses",
    staleTime: 30000,
    retry: false,
  });
  const heading = {
    events: "Events & activities",
    albums: "Community gallery",
    "gallery/images": "All community images",
    testimonials: "Community testimonials",
    businesses: "Business directory",
  }[resource];
  return (
    <PublicLayout>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl sm:text-4xl">{heading}</h1>
        {resource === "testimonials" && <TestimonialForm />}
        {resource === "albums" && (
          <Link to="/gallery" className="underline">
            Browse all photos
          </Link>
        )}
      </div>
      {resource === "events" && (
        <div
          className="mb-5 flex flex-wrap gap-2"
          role="group"
          aria-label="Event dates"
        >
          {["upcoming", "ongoing", "past", "unscheduled"].map((value) => (
            <Button
              key={value}
              variant={value === temporal ? "default" : "outline"}
              aria-pressed={value === temporal}
              onClick={() => {
                setTemporal(value);
                setPage(1);
              }}
              className="capitalize"
            >
              {value}
            </Button>
          ))}
        </div>
      )}
      <div className="mb-6 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">
          Search
          <input
            maxLength={100}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className={fieldClass}
          />
        </label>
        {resource === "businesses" && (
          <>
            <label className="text-sm">
              Category
              <select
                className={fieldClass}
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All categories</option>
                {category &&
                  !categories.data?.data.some(
                    (item) => item._id === category,
                  ) && <option value={category}>Selected category</option>}
                {categories.data?.data.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <ErrorMessage error={categories.error} />
              {(categories.data?.pagination?.pages ?? 0) > 1 && (
                <Pagination
                  page={categoryPage}
                  onPage={setCategoryPage}
                  pagination={categories.data?.pagination}
                />
              )}
            </label>
            <label className="text-sm">
              Suburb / location
              <input
                value={location}
                onChange={(event) => {
                  setLocation(event.target.value);
                  setPage(1);
                }}
                className={fieldClass}
              />
            </label>
          </>
        )}
      </div>
      <ErrorMessage error={query.error} />
      {query.isError && (
        <Button variant="outline" onClick={() => query.refetch()}>
          Retry
        </Button>
      )}
      {query.isPending && <p role="status">Loading…</p>}
      {query.data?.data.length === 0 && (
        <p className="rounded-xl border p-8 text-center">
          No results match these filters.
        </p>
      )}
      {resource === "gallery/images" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {query.data?.data.map((item) => (
            <button
              key={item._id}
              onClick={() => setSelected(item)}
              className="min-w-0 overflow-hidden rounded-xl border bg-white text-left"
            >
              <img
                src={mediaUrl(item.media)}
                alt={item.alt || item.title || "Community image"}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
              <span className="block break-words p-4">
                {item.title || item.caption}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <PublicCards items={query.data?.data ?? []} resource={resource} />
      )}
      <Pagination
        pagination={query.data?.pagination}
        page={page}
        onPage={setPage}
      />
      {selected && (
        <PhotoDialog image={selected} close={() => setSelected(undefined)} />
      )}
    </PublicLayout>
  );
}
function PhotoDialog({
  image,
  close,
}: {
  image: ApiDocument;
  close: () => void;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/80" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-5">
          <Dialog.Title className="pr-10 font-semibold">
            {image.title || "Community photo"}
          </Dialog.Title>
          <Dialog.Description className="my-2 text-sm">
            {image.caption || "Mulembe community gallery"}
          </Dialog.Description>
          <img
            src={mediaUrl(image.media)}
            alt={image.alt || image.title || "Community photo"}
            className="max-h-[70dvh] w-full object-contain"
          />
          <Dialog.Close
            aria-label="Close photo"
            className="absolute right-3 top-3 p-2"
          >
            <X className="h-5 w-5" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function PublicDetailPage({
  resource,
}: {
  resource: "events" | "albums" | "businesses";
}) {
  const { slug } = useParams();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ApiDocument>();
  const path = `/${resource}/slug/${encodeURIComponent(slug || "")}`;
  const query = useQuery({
    queryKey: ["public", resource, slug],
    queryFn: () => api<ApiDocument>(path),
    retry: false,
    staleTime: 30000,
  });
  const children = useQuery({
    queryKey: ["public", resource, slug, "children", page],
    queryFn: () =>
      api<ApiDocument[]>(
        path + (resource === "albums" ? "/images" : "/services"),
        { params: { page, limit: 12 } },
      ),
    enabled: resource !== "events" && !!query.data,
    staleTime: 30000,
    retry: false,
  });
  const item = query.data?.data;
  const image = mediaUrl(item?.cover);
  return (
    <PublicLayout>
      <Link className="mb-6 inline-block underline" to={`/${resource}`}>
        Back to {resource}
      </Link>
      <ErrorMessage error={query.error} />
      {query.isPending && <p role="status">Loading…</p>}
      {item && (
        <article>
          <h1 className="font-display text-3xl sm:text-5xl">{item.title}</h1>
          {image && (
            <img
              src={image}
              alt={item.title || ""}
              className="my-6 max-h-[500px] w-full rounded-xl object-contain"
            />
          )}
          {resource === "events" && (
            <div className="my-5 rounded-xl border bg-white p-5">
              <p>
                {eventDate(item)} · {eventTime(item)}
              </p>
              <p className="mt-2">{item.venueLabel || item.venueName}</p>
              <p>{item.venueAddress}</p>
              <p className="mt-2">{item.audience}</p>
            </div>
          )}
          <p className="my-5 whitespace-pre-wrap break-words leading-relaxed">
            {item.content || item.description || item.summary}
          </p>
          {resource === "events" &&
            item.registrationLinks?.map((link, index) => (
              <a
                key={index}
                className="mr-4 inline-block rounded-lg bg-luhya-green px-4 py-3 text-white"
                href={/^https?:\/\//i.test(link.url) ? link.url : undefined}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
          {resource === "businesses" && (
            <div className="my-6 space-y-2 rounded-xl border bg-white p-5">
              <p>
                {typeof item.category === "object" ? item.category.name : ""}
              </p>
              <p>{item.ownerName}</p>
              <p>
                {[
                  item.location?.address,
                  item.location?.suburb,
                  item.location?.state,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {item.phone && (
                <a
                  className="block underline"
                  href={`tel:${item.phone.replace(/[^+\d]/g, "")}`}
                >
                  {item.phone}
                </a>
              )}
              {item.email && (
                <a
                  className="block break-all underline"
                  href={`mailto:${item.email}`}
                >
                  {item.email}
                </a>
              )}
              {item.website && /^https?:\/\//i.test(item.website) && (
                <a
                  className="block break-all underline"
                  href={item.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit website
                </a>
              )}
              {Object.entries(item.social ?? {}).map(([name, url]) =>
                url && /^https?:\/\//i.test(url) ? (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mr-4 inline-block capitalize underline"
                  >
                    {name}
                  </a>
                ) : null,
              )}
            </div>
          )}
          {resource !== "events" && (
            <section className="mt-8">
              <h2 className="mb-5 text-2xl font-bold">
                {resource === "albums" ? "Album photos" : "Services"}
              </h2>
              <ErrorMessage error={children.error} />
              {children.isPending && <p role="status">Loading…</p>}
              {resource === "albums" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {children.data?.data.map((photo) => (
                    <button
                      key={photo._id}
                      onClick={() => setSelected(photo)}
                      className="overflow-hidden rounded-xl border text-left"
                    >
                      <img
                        src={mediaUrl(photo.media)}
                        alt={photo.alt || photo.title || "Community photo"}
                        className="aspect-[4/3] w-full object-cover"
                        loading="lazy"
                      />
                      <span className="block p-3">
                        {photo.title || photo.caption}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <PublicCards
                  items={children.data?.data ?? []}
                  resource="services"
                />
              )}
              <Pagination
                page={page}
                onPage={setPage}
                pagination={children.data?.pagination}
              />
            </section>
          )}
        </article>
      )}
      {selected && (
        <PhotoDialog image={selected} close={() => setSelected(undefined)} />
      )}
    </PublicLayout>
  );
}
function TestimonialForm() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const memberTitle = String(values.get("memberTitle") || "").trim();
    setBusy(true);
    setError(undefined);
    try {
      const result = await api<{ id: string; status: string; message: string }>(
        "/testimonials/submit",
        {
          method: "POST",
          body: {
            name: values.get("name"),
            ...(memberTitle ? { memberTitle } : {}),
            comment: values.get("comment"),
            rating: Number(values.get("rating")),
            website: "",
          },
        },
      );
      setMessage(result.data.message);
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!busy) setOpen(value);
      }}
    >
      <Dialog.Trigger asChild>
        <Button>Share your testimonial</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6">
          <Dialog.Title className="pr-8 text-xl font-bold">
            Share your story
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Your testimonial will appear after review by the community team.
          </Dialog.Description>
          <Dialog.Close
            aria-label="Close testimonial form"
            className="absolute right-3 top-3 p-2"
          >
            <X className="h-5 w-5" />
          </Dialog.Close>
          {message ? (
            <p role="status" className="my-6">
              {message}
            </p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <input name="website" type="hidden" value="" readOnly />
              <label className="block text-sm">
                Full name
                <input
                  name="name"
                  required
                  maxLength={120}
                  className={fieldClass}
                />
                <FieldErrors error={error} name="name" />
              </label>
              <label className="block text-sm">
                Member title (optional)
                <input
                  name="memberTitle"
                  maxLength={120}
                  className={fieldClass}
                />
                <FieldErrors error={error} name="memberTitle" />
              </label>
              <label className="block text-sm">
                Your testimonial
                <textarea
                  name="comment"
                  rows={5}
                  required
                  maxLength={5000}
                  className={fieldClass}
                />
                <FieldErrors error={error} name="comment" />
              </label>
              <label className="block text-sm">
                Rating
                <select name="rating" defaultValue="5" className={fieldClass}>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} out of 5
                    </option>
                  ))}
                </select>
                <FieldErrors error={error} name="rating" />
              </label>
              <ErrorMessage error={error} />
              <Button disabled={busy} type="submit">
                {busy ? "Submitting…" : "Submit for review"}
              </Button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

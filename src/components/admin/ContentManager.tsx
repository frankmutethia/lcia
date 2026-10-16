import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, mediaUrl, eventDate, type ApiDocument } from "@/lib/api";
import {
  resourceLabels,
  createLabels,
  statuses,
  type FormResource,
} from "@/lib/content-schema";
import {
  ErrorMessage,
  Pagination,
  fieldClass,
} from "@/components/api/Controls";
import ApiEditor from "./ApiEditor";
import AlbumImages from "./AlbumImages";
import { usePreview } from "./preview-context";

export default function ContentManager({
  resource,
  parent,
}: {
  resource: FormResource;
  parent?: ApiDocument;
}) {
  const { user } = usePreview();
  const cache = useQueryClient();
  const path = parent
    ? `/admin/businesses/${parent._id}/services`
    : `/admin/${resource}`;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<ApiDocument | null | undefined>();
  const [album, setAlbum] = useState<ApiDocument>();
  const [business, setBusiness] = useState<ApiDocument>();
  const allowed = resource !== "users" || user?.role === "super_admin";
  const query = useQuery({
    queryKey: ["admin", path, page, search, status],
    queryFn: () =>
      api<ApiDocument[]>(path, {
        params: {
          page,
          limit: 20,
          search: search || undefined,
          ...(resource === "users" ||
          resource === "business-categories" ||
          resource === "services"
            ? { active: status || undefined }
            : { status: status || undefined }),
        },
      }),
    enabled: allowed,
    retry: false,
  });
  if (!allowed)
    return (
      <p role="alert">Only super administrators can manage staff accounts.</p>
    );
  if (album)
    return <AlbumImages album={album} onBack={() => setAlbum(undefined)} />;
  if (business)
    return (
      <>
        <Button
          variant="outline"
          className="mb-5"
          onClick={() => setBusiness(undefined)}
        >
          Back to businesses
        </Button>
        <ContentManager resource="services" parent={business} />
      </>
    );
  async function remove(item: ApiDocument) {
    const warning =
      resource === "albums"
        ? " This also deletes every image in this album."
        : resource === "businesses"
          ? " This also deletes its services."
          : "";
    if (
      !window.confirm(
        `Delete ${item.title || item.name || "this record"}?${warning}`,
      )
    )
      return;
    setBusy(true);
    setError(undefined);
    try {
      await api(`${path}/${item._id}`, { method: "DELETE" });
      await cache.invalidateQueries({ queryKey: ["admin"] });
      await cache.invalidateQueries({ queryKey: ["public"] });
      setNotice("Deleted successfully.");
      if (query.data?.data.length === 1 && page > 1) setPage(page - 1);
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <div className="mb-7 flex flex-wrap justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-primary">
            Community administration
          </p>
          <h2 className="text-2xl font-bold">
            {parent ? `${parent.title} — services` : resourceLabels[resource]}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {resource === "users"
              ? "Invite staff and manage editor or super administrator access."
              : resource === "albums"
                ? "Create albums, then add individual images or upload a batch."
                : "Create, edit and publish updates for your community website."}
          </p>
        </div>
        <Button onClick={() => setEditing(null)}>
          <Plus className="mr-2 h-4 w-4" />
          {createLabels[resource]}
        </Button>
      </div>
      {resource === "users" && (
        <p className="mb-5 text-sm text-muted-foreground">
          Editors manage content. Super administrators also manage accounts and
          deletions. Community membership onboarding is separate from staff
          access.
        </p>
      )}
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          aria-label="Search records"
          placeholder="Search"
          maxLength={100}
          className={`${fieldClass} !mt-0 max-w-sm`}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Filter status"
          className={`${fieldClass} !mt-0 !w-auto`}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All</option>
          {statuses[resource]?.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          )) ?? (
            <>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </>
          )}
        </select>
        {resource === "testimonials" && (
          <Button
            variant="outline"
            onClick={() => {
              setStatus("pending");
              setPage(1);
            }}
          >
            Moderation queue
          </Button>
        )}
      </div>
      {notice && (
        <p role="status" className="mb-4 rounded border p-3 text-sm">
          {notice}
        </p>
      )}
      <ErrorMessage error={error || query.error} />
      {query.isError && (
        <Button variant="outline" onClick={() => query.refetch()}>
          Retry
        </Button>
      )}
      {query.isPending && <p role="status">Loading…</p>}
      {!query.isPending && !query.isError && !query.data?.data.length && (
        <p className="rounded-xl border border-dashed p-8 text-center">
          No records match these filters. Add an item to get started.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {query.data?.data.map((item) => (
          <article
            key={item._id}
            className="min-w-0 overflow-hidden rounded-xl border bg-card"
          >
            {mediaUrl(item.cover || item.photo || item.image) && (
              <img
                src={mediaUrl(item.cover || item.photo || item.image)}
                alt={item.title || item.name || ""}
                className="aspect-[4/3] w-full object-cover"
              />
            )}
            <div className="p-5">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs capitalize">
                {item.status ?? (item.active ? "Active" : "Inactive")}
              </span>
              <h3 className="mt-3 break-words font-semibold">
                {item.title || item.name}
              </h3>
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {item.summary || item.comment || item.description || item.email}
              </p>
              {resource === "users" && (
                <p className="mt-2 text-sm">
                  {item.role?.replaceAll("_", " ")}
                </p>
              )}
              {resource === "events" && (
                <p className="mt-2 text-sm">{eventDate(item)}</p>
              )}
              {resource === "albums" && (
                <p className="mt-2 text-sm">{item.photoCount ?? 0} images</p>
              )}
              {resource === "business-categories" && (
                <p className="mt-2 text-sm">
                  {item.businessCount ?? 0} businesses
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setEditing(item)}>
                  Edit
                </Button>
                {resource === "albums" && (
                  <Button onClick={() => setAlbum(item)}>
                    Manage / upload images
                  </Button>
                )}
                {resource === "businesses" && (
                  <Button onClick={() => setBusiness(item)}>
                    Manage services
                  </Button>
                )}
                {user?.role === "super_admin" && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => remove(item)}
                  >
                    Delete
                  </Button>
                )}
              </div>
              {resource === "users" && (
                <Button
                  variant="link"
                  className="mt-2 px-0"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError(undefined);
                    try {
                      const result = await api<{ message: string }>(
                        "/auth/forgot-password",
                        { method: "POST", body: { email: item.email } },
                      );
                      setNotice(result.data.message);
                    } catch (caught) {
                      setError(caught);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Send password setup / reset link
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
      <Pagination
        pagination={query.data?.pagination}
        page={page}
        onPage={setPage}
      />
      {editing !== undefined && (
        <ApiEditor
          key={editing?._id || "new"}
          resource={resource}
          path={path}
          document={editing ?? undefined}
          onClose={() => setEditing(undefined)}
          onSaved={setNotice}
        />
      )}
      <Link className="mt-8 inline-block text-sm underline" to="/">
        View website
      </Link>
    </section>
  );
}

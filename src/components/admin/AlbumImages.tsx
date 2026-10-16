import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { api, ApiError, mediaUrl, type ApiDocument } from "@/lib/api";
import {
  ErrorMessage,
  FieldErrors,
  Pagination,
  fieldClass,
} from "@/components/api/Controls";
import { usePreview } from "./preview-context";

type Queued = {
  key: string;
  file: File;
  title: string;
  caption: string;
  alt: string;
  status: "draft" | "published";
  state: "ready" | "uploading" | "done" | "failed";
  error?: string;
};
type UploadResult = {
  results: {
    index: number;
    key: string;
    success: boolean;
    reused?: boolean;
    image?: ApiDocument;
    status?: number;
    error?: { message?: string } | string;
  }[];
};
function FilePreview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const value = URL.createObjectURL(file);
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [file]);
  return url ? (
    <img
      src={url}
      alt="Upload preview"
      className="h-20 w-24 rounded object-cover"
    />
  ) : null;
}
export default function AlbumImages({
  album,
  onBack,
}: {
  album: ApiDocument;
  onBack: () => void;
}) {
  const path = `/admin/albums/${album._id}`;
  const cache = useQueryClient();
  const { user } = usePreview();
  const [page, setPage] = useState(1);
  const [queue, setQueue] = useState<Queued[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");
  const [dragged, setDragged] = useState<string>();
  const [editing, setEditing] = useState<ApiDocument>();
  const [coverImage, setCoverImage] = useState(album.coverImage);
  async function updateCover(imageId: string | null) {
    await api(`${path}/cover`, { method: "PATCH", body: { imageId } });
    setCoverImage(imageId ?? undefined);
  }
  const query = useQuery({
    queryKey: ["admin", "album-images", album._id, page],
    queryFn: () =>
      api<ApiDocument[]>(`${path}/images`, {
        params: { page, limit: 100, sort: "displayOrder", direction: "asc" },
      }),
  });
  async function refresh() {
    await cache.invalidateQueries({ queryKey: ["admin"] });
    await cache.invalidateQueries({ queryKey: ["public"] });
  }
  function choose(files: FileList | null) {
    const selected = Array.from(files ?? []);
    if (
      selected.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 5 * 1024 * 1024,
      )
    ) {
      setError(
        new Error("Select static JPEG, PNG or WebP images up to 5 MB each."),
      );
      return;
    }
    setError(undefined);
    setQueue((current) => [
      ...current,
      ...selected.map((file) => ({
        key: crypto.randomUUID(),
        file,
        title: file.name.replace(/\.[^.]+$/, "").slice(0, 200),
        caption: "",
        alt: "",
        status: "draft" as const,
        state: "ready" as const,
      })),
    ]);
  }
  function update(key: string, patch: Partial<Queued>) {
    setQueue((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }
  async function upload() {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    const pending = queue.filter(
      (item) => item.state === "ready" || item.state === "failed",
    );
    try {
      for (let offset = 0; offset < pending.length; offset += 10) {
        const batch = pending.slice(offset, offset + 10);
        const body = new FormData();
        batch.forEach((item) => {
          update(item.key, { state: "uploading", error: undefined });
          body.append("images", item.file);
        });
        body.append(
          "metadata",
          JSON.stringify(
            batch.map(({ key, title, caption, alt, status }) => ({
              key,
              title,
              caption,
              alt,
              status,
            })),
          ),
        );
        try {
          const result = await api<UploadResult>(`${path}/images`, {
            method: "POST",
            body,
          });
          const results = result.data.results;
          if (!Array.isArray(results))
            throw new Error(
              "Unexpected upload response. Retry with the same files to check their saved state.",
            );
          for (const item of batch) {
            const outcome = results.find((entry) => entry.key === item.key);
            update(item.key, {
              state: outcome?.success ? "done" : "failed",
              error: outcome?.success
                ? undefined
                : typeof outcome?.error === "string"
                  ? outcome.error
                  : (outcome?.error?.message ??
                    "Image was not confirmed. Retry this file."),
            });
          }
        } catch (caught) {
          batch.forEach((item) =>
            update(item.key, {
              state: "failed",
              error: caught instanceof Error ? caught.message : "Upload failed",
            }),
          );
          if (
            caught instanceof ApiError &&
            [401, 403, 429].includes(caught.status)
          ) {
            setError(caught);
            break;
          }
        }
      }
      await refresh();
      setNotice(
        "Upload results are shown per file. Only published images in a published album appear on the website.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function action(task: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError(undefined);
    try {
      await task();
      await refresh();
      setNotice(message);
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }
  async function reorder(source: string, target: string) {
    if (busy || (query.data?.pagination?.total ?? 0) > 100) return;
    const ids = query.data?.data.map((item) => item._id) ?? [];
    const from = ids.indexOf(source),
      to = ids.indexOf(target);
    if (from < 0 || to < 0 || from === to) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    await action(
      () =>
        api(`${path}/images/order`, {
          method: "PATCH",
          body: { imageIds: ids },
        }),
      "Image order saved.",
    );
  }
  return (
    <section>
      <Button variant="outline" onClick={onBack} disabled={busy}>
        Back to albums
      </Button>
      <h2 className="mt-5 text-2xl font-bold">{album.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload images, edit captions and choose the album cover. Album status:{" "}
        {album.status}.
      </p>
      <div className="my-6 rounded-xl border bg-card p-5">
        <label className="block font-medium">
          Add images / bulk upload
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            className="mt-3 block w-full min-w-0 text-sm"
            onChange={(event) => {
              choose(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          Up to 5 MB per image. Files are sent in batches of 10. Retry keeps
          each file’s upload key to avoid duplicates.
        </p>
        <div className="mt-5 space-y-4">
          {queue.map((item) => (
            <div key={item.key} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start gap-3">
                <FilePreview file={item.file} />
                <div className="min-w-0 flex-1">
                  <p className="break-all text-sm font-semibold">
                    {item.file.name}
                  </p>
                  <p className="mt-1 text-xs capitalize" role="status">
                    {item.state === "done" ? "Uploaded" : item.state}
                  </p>
                </div>
                {item.state !== "uploading" && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      setQueue((current) =>
                        current.filter((value) => value.key !== item.key),
                      )
                    }
                  >
                    {item.state === "done" ? "Dismiss" : "Remove"}
                  </Button>
                )}
              </div>
              {item.state !== "done" && (
                <fieldset
                  disabled={busy || item.state === "failed"}
                  className="mt-3 grid gap-3 sm:grid-cols-2"
                >
                  <label className="text-sm">
                    Title
                    <input
                      maxLength={200}
                      value={item.title}
                      className={fieldClass}
                      onChange={(event) =>
                        update(item.key, { title: event.target.value })
                      }
                    />
                  </label>
                  <label className="text-sm">
                    Alternative text
                    <input
                      maxLength={500}
                      value={item.alt}
                      className={fieldClass}
                      onChange={(event) =>
                        update(item.key, { alt: event.target.value })
                      }
                    />
                  </label>
                  <label className="text-sm">
                    Caption
                    <textarea
                      maxLength={5000}
                      value={item.caption}
                      className={fieldClass}
                      onChange={(event) =>
                        update(item.key, { caption: event.target.value })
                      }
                    />
                  </label>
                  <label className="text-sm">
                    Image status
                    <select
                      value={item.status}
                      className={fieldClass}
                      onChange={(event) =>
                        update(item.key, {
                          status: event.target.value as "draft" | "published",
                        })
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </label>
                </fieldset>
              )}
              {item.error && (
                <p role="alert" className="mt-2 text-sm text-red-700">
                  {item.error}
                </p>
              )}
            </div>
          ))}
        </div>
        {queue.some((item) => ["ready", "failed"].includes(item.state)) && (
          <Button className="mt-4" onClick={upload} disabled={busy}>
            {busy
              ? "Uploading…"
              : queue.some((item) => item.state === "failed")
                ? "Upload / retry failed files"
                : "Upload selected images"}
          </Button>
        )}
      </div>
      <ErrorMessage error={error || query.error} />
      {notice && (
        <p role="status" className="mb-4 rounded border p-3 text-sm">
          {notice}
        </p>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <p className="text-sm text-muted-foreground">
          Drag cards to reorder, or use the move buttons.
        </p>
        <Button
          disabled={busy}
          variant="outline"
          onClick={() =>
            action(
              () => updateCover(null),
              "Album cover cleared.",
            )
          }
        >
          Clear album cover
        </Button>
      </div>
      {(query.data?.pagination?.total ?? 0) > 100 && (
        <p className="mb-4 text-sm">
          Reordering is available for albums with up to 100 images in this
          editor.
        </p>
      )}
      {query.isPending && <p role="status">Loading images…</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {query.data?.data.map((item, index) => (
          <article
            key={item._id}
            draggable={!busy && (query.data?.pagination?.total ?? 0) <= 100}
            onDragStart={() => setDragged(item._id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (dragged) void reorder(dragged, item._id);
              setDragged(undefined);
            }}
            className="min-w-0 overflow-hidden rounded-xl border bg-card"
          >
            <img
              src={mediaUrl(item.media)}
              alt={item.alt || item.title || "Gallery image"}
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="space-y-3 p-4">
              <h3 className="break-words font-semibold">
                {item.title || "Untitled image"}
              </h3>
              <p className="text-xs capitalize">
                {item.status}
                {coverImage === item._id ? " · Album cover" : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() => setEditing(item)}
                >
                  Edit details
                </Button>
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() =>
                    action(
                      () => updateCover(item._id),
                      "Album cover updated.",
                    )
                  }
                >
                  Set cover
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={
                    busy ||
                    index === 0 ||
                    (query.data?.pagination?.total ?? 0) > 100
                  }
                  onClick={() =>
                    reorder(item._id, query.data!.data[index - 1]._id)
                  }
                >
                  Move earlier
                </Button>
                <Button
                  variant="outline"
                  disabled={
                    busy ||
                    index === query.data!.data.length - 1 ||
                    (query.data?.pagination?.total ?? 0) > 100
                  }
                  onClick={() =>
                    reorder(item._id, query.data!.data[index + 1]._id)
                  }
                >
                  Move later
                </Button>
              </div>
              {user?.role === "super_admin" && (
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("Delete this gallery image?"))
                      void action(
                        () =>
                          api(`${path}/images/${item._id}`, {
                            method: "DELETE",
                          }),
                        "Image deleted.",
                      );
                  }}
                >
                  Delete image
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
      {editing && (
        <ImageEditor
          image={editing}
          path={`${path}/images/${editing._id}`}
          onClose={() => setEditing(undefined)}
          onSave={async () => {
            await refresh();
            setEditing(undefined);
          }}
        />
      )}
    </section>
  );
}

import * as Dialog from "@radix-ui/react-dialog";
function ImageEditor({
  image,
  path,
  onClose,
  onSave,
}: {
  image: ApiDocument;
  path: string;
  onClose: () => void;
  onSave: () => Promise<void>;
}) {
  const [values, setValues] = useState({
    title: image.title || "",
    caption: image.caption || "",
    alt: image.alt || "",
    displayOrder: image.displayOrder ?? 0,
    status: image.status || "draft",
  });
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50" />
        <Dialog.Content className="admin-ui fixed left-1/2 top-1/2 z-[71] max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-background p-6">
          <Dialog.Title className="text-xl font-bold">
            Edit gallery image
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm">
            Update the image text, order and publication status.
          </Dialog.Description>
          <form
            className="mt-5 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError(undefined);
              try {
                const body = Object.fromEntries(
                  Object.entries(values).filter(
                    ([key, value]) => value !== image[key as keyof ApiDocument],
                  ),
                );
                await api(path, { method: "PATCH", body });
                await onSave();
              } catch (caught) {
                setError(caught);
              } finally {
                setBusy(false);
              }
            }}
          >
            {(["title", "caption", "alt"] as const).map((key) => (
              <label key={key} className="block text-sm capitalize">
                {key}
                <textarea
                  className={fieldClass}
                  maxLength={key === "title" ? 200 : key === "alt" ? 500 : 5000}
                  value={values[key]}
                  onChange={(event) =>
                    setValues({ ...values, [key]: event.target.value })
                  }
                />
                <FieldErrors error={error} name={key} />
              </label>
            ))}
            <label className="block text-sm">
              Display order
              <input
                type="number"
                min={0}
                max={100000}
                step={1}
                required
                className={fieldClass}
                value={values.displayOrder}
                onChange={(event) =>
                  setValues({
                    ...values,
                    displayOrder: Number(event.target.value),
                  })
                }
              />
              <FieldErrors error={error} name="displayOrder" />
            </label>
            <label className="block text-sm">
              Status
              <select
                className={fieldClass}
                value={values.status}
                onChange={(event) =>
                  setValues({ ...values, status: event.target.value })
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <FieldErrors error={error} name="status" />
            </label>
            <ErrorMessage error={error} />
            <div className="flex gap-3">
              <Button
                type="button"
                disabled={busy}
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save image"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

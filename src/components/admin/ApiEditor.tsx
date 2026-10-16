import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { api, ApiError, mediaUrl, type ApiDocument } from "@/lib/api";
import {
  fields,
  statuses,
  mediaFields,
  createLabels,
  type FormResource,
} from "@/lib/content-schema";
import {
  ErrorMessage,
  FieldErrors,
  Pagination,
  fieldClass,
} from "@/components/api/Controls";
import { usePreview } from "./preview-context";

export function ReferenceSelect({
  resource,
  value,
  onChange,
  required,
  id,
}: {
  resource: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  id?: string;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["admin", "reference", resource, page, search],
    queryFn: () =>
      api<ApiDocument[]>(`/admin/${resource}`, {
        params: { page, limit: 100, search: search || undefined },
      }),
  });
  return (
    <div>
      <input
        aria-label={`Search ${resource}`}
        className={fieldClass}
        placeholder="Search choices"
        maxLength={100}
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
      />
      <select
        id={id}
        required={required}
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{required ? "Choose…" : "No linked event"}</option>
        {value && !query.data?.data.some((item) => item._id === value) && (
          <option value={value}>Current selection</option>
        )}
        {query.data?.data.map((item) => (
          <option key={item._id} value={item._id}>
            {item.title || item.name}
          </option>
        ))}
      </select>
      <ErrorMessage error={query.error} />
      <Pagination
        pagination={query.data?.pagination}
        page={page}
        onPage={setPage}
      />
    </div>
  );
}
function initialValues(resource: FormResource, document?: ApiDocument) {
  const result: Record<string, unknown> = {
    featured: false,
    displayOrder: 0,
    status: statuses[resource]?.[0] ?? "",
    active: true,
    role: "editor",
    rating: 5,
    memberTitle: "Community Member",
    timezone: "Australia/Sydney",
    type: "event",
    datePrecision: "tba",
    ...document,
  };
  for (const key of ["category", "event"]) {
    const value = result[key];
    if (value && typeof value === "object" && "_id" in value)
      result[key] = value._id;
  }
  return result;
}
function localDate(value: unknown, zone: string) {
  try {
    return value
      ? formatInTimeZone(String(value), zone, "yyyy-MM-dd'T'HH:mm")
      : "";
  } catch {
    return "";
  }
}
function toOffset(value: string, zone: string) {
  const date = fromZonedTime(value, zone);
  if (
    Number.isNaN(date.getTime()) ||
    formatInTimeZone(date, zone, "yyyy-MM-dd'T'HH:mm") !== value
  )
    throw new Error(
      "That local time does not exist in the selected timezone. Check daylight saving and choose another time.",
    );
  return formatInTimeZone(date, zone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}
export default function ApiEditor({
  resource,
  path,
  document,
  onClose,
  onSaved,
}: {
  resource: FormResource;
  path: string;
  document?: ApiDocument;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const cache = useQueryClient();
  const { user } = usePreview();
  const [saved, setSaved] = useState(document);
  const [values, setValues] = useState(() => initialValues(resource, document));
  const [start, setStart] = useState(() =>
    localDate(document?.startsAt, document?.timezone || "Australia/Sydney"),
  );
  const [end, setEnd] = useState(() =>
    localDate(document?.endsAt, document?.timezone || "Australia/Sydney"),
  );
  const [file, setFile] = useState<File>();
  const [fileError, setFileError] = useState("");
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [partial, setPartial] = useState("");
  const [invitation, setInvitation] = useState<boolean>();
  const [links, setLinks] = useState(document?.registrationLinks ?? []);
  const [location, setLocation] = useState(document?.location ?? {});
  const [social, setSocial] = useState(document?.social ?? {});
  const mediaKey = mediaFields[resource];
  const currentMedia =
    saved && mediaKey
      ? saved[mediaKey as "cover" | "image" | "photo"]
      : undefined;
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function set(name: string, value: unknown) {
    setValues((current) => ({ ...current, [name]: value }));
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || fileError) return;
    setError(undefined);
    const body: Record<string, unknown> = {};
    try {
      for (const field of fields[resource]) {
        const value = values[field.name];
        if (
          field.required &&
          (value === undefined || String(value).trim() === "")
        )
          throw new ApiError(400, "Complete the required fields.", [
            { path: field.name, message: "This field is required." },
          ]);
        if (field.kind === "number") {
          if (value !== "" && value !== undefined)
            body[field.name] = Number(value);
        } else if (field.kind === "checkbox") body[field.name] = !!value;
        else if (value !== undefined && value !== "")
          body[field.name] = typeof value === "string" ? value.trim() : value;
        else if (
          saved &&
          field.name !== "event" &&
          field.kind !== "select" &&
          field.kind !== "email" &&
          field.kind !== "url"
        )
          body[field.name] = "";
      }
      if (resource === "albums") {
        if (saved || values.event) body.event = values.event || null;
        if (saved || values.eventDate)
          body.eventDate = values.eventDate || null;
      }
      if (resource === "users" && saved) body.active = !!values.active;
      if (resource === "events") {
        const precision = String(values.datePrecision);
        body.datePrecision = precision;
        const zone = String(values.timezone);
        try {
          new Intl.DateTimeFormat("en", { timeZone: zone });
        } catch {
          throw new ApiError(400, "Enter a valid IANA timezone.", [
            { path: "timezone", message: "For example: Australia/Sydney" },
          ]);
        }
        if (precision === "exact") {
          if (!start) throw new Error("Choose the event start date and time.");
          body.startsAt = toOffset(start, zone);
          if (end) body.endsAt = toOffset(end, zone);
          else if (saved) body.endsAt = null;
          if (
            end &&
            Date.parse(String(body.endsAt)) < Date.parse(String(body.startsAt))
          )
            throw new Error("End time must be after the start time.");
          if (saved) {
            body.year = null;
            body.month = null;
          }
        } else if (precision === "month") {
          if (!values.year || !values.month)
            throw new Error("Choose a year and month.");
          body.year = Number(values.year);
          body.month = Number(values.month);
          if (saved) {
            body.startsAt = null;
            body.endsAt = null;
          }
        } else if (saved) {
          body.startsAt = null;
          body.endsAt = null;
          body.year = null;
          body.month = null;
        }
        body.registrationLinks = links;
      }
      if (resource === "businesses") {
        body.location = location;
        body.social = social;
      }
      if (!saved && statuses[resource]) body.status = values.status;
      if (saved) {
        const previous = initialValues(resource, saved);
        for (const key of Object.keys(body))
          if (
            JSON.stringify(body[key]) === JSON.stringify(previous[key]) ||
            (body[key] === null && previous[key] == null)
          )
            delete body[key];
      }
      setBusy(true);
      let current = saved;
      if (!current || Object.keys(body).length) {
        const response = await api<ApiDocument>(
          current ? `${path}/${current._id}` : path,
          { method: current ? "PATCH" : "POST", body },
        );
        current = response.data;
        if (!current?._id)
          throw new Error(
            "The saved record response did not contain its _id. Refresh the list before trying again.",
          );
        setSaved(current);
        setPartial("Record saved.");
        if (resource === "users") setInvitation(response.data.invitationSent);
      }
      if (statuses[resource] && current.status !== values.status) {
        const result = await api<ApiDocument>(`${path}/${current._id}/status`, {
          method: "PATCH",
          body: { status: values.status },
        });
        current = result.data;
        setSaved(current);
      }
      if (file && mediaKey) {
        const form = new FormData();
        form.append("images", file);
        const result = await api<ApiDocument>(
          `${path}/${current._id}/${mediaKey}`,
          { method: "POST", body: form },
        );
        setSaved(result.data);
        setFile(undefined);
      }
      await cache.invalidateQueries({ queryKey: ["admin"] });
      await cache.invalidateQueries({ queryKey: ["public"] });
      if (
        resource === "users" &&
        !document &&
        current.invitationSent === false
      ) {
        setInvitation(false);
        setPartial(
          "Account created, but the invitation email was not sent. You can resend it below.",
        );
        return;
      }
      onSaved(
        resource === "users"
          ? "Administrator saved. Changes to an existing account revoke its sessions."
          : "Saved successfully. Published changes can take up to 30 seconds to appear on the website.",
      );
      onClose();
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }
  async function removeMedia() {
    if (!saved || !mediaKey || !window.confirm("Remove this image?")) return;
    setBusy(true);
    setError(undefined);
    try {
      await api(`${path}/${saved._id}/${mediaKey}`, { method: "DELETE" });
      const { data } = await api<ApiDocument>(`${path}/${saved._id}`);
      setSaved(data);
      await cache.invalidateQueries({ queryKey: ["admin"] });
      await cache.invalidateQueries({ queryKey: ["public"] });
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50" />
        <Dialog.Content className="admin-ui fixed left-1/2 top-1/2 z-[71] max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-background p-5 shadow-xl sm:p-7">
          <Dialog.Title className="pr-10 text-xl font-bold">
            {saved
              ? "Edit " + (saved.title || saved.name || "record")
              : createLabels[resource]}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            {resource === "users"
              ? "Invite a staff administrator. They will receive a link to set their password."
              : "Complete the details and choose when this content should be visible."}
          </Dialog.Description>
          <Dialog.Close
            disabled={busy}
            aria-label="Close editor"
            className="absolute right-3 top-3 p-2"
          >
            <X className="h-5 w-5" />
          </Dialog.Close>
          <form onSubmit={save} className="mt-6 space-y-5" aria-busy={busy}>
            {fields[resource].map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={`edit-${field.name}`}
                  className="block text-sm font-medium"
                >
                  {field.label}
                  {field.required ? " *" : ""}
                </label>
                {field.kind === "select" &&
                ["category", "event"].includes(field.name) ? (
                  <ReferenceSelect
                    id={`edit-${field.name}`}
                    resource={
                      field.name === "category"
                        ? "business-categories"
                        : "events"
                    }
                    value={String(values[field.name] ?? "")}
                    required={field.required}
                    onChange={(value) => set(field.name, value)}
                  />
                ) : field.kind === "textarea" ? (
                  <textarea
                    id={`edit-${field.name}`}
                    required={field.required}
                    maxLength={field.max}
                    rows={4}
                    value={String(values[field.name] ?? "")}
                    onChange={(event) => set(field.name, event.target.value)}
                    className={fieldClass}
                  />
                ) : field.kind === "select" ? (
                  <select
                    id={`edit-${field.name}`}
                    value={String(
                      values[field.name] ?? field.options?.[0] ?? "",
                    )}
                    onChange={(event) => set(field.name, event.target.value)}
                    className={fieldClass}
                  >
                    {field.options?.map((value) => (
                      <option key={value} value={value}>
                        {value.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                ) : field.kind === "checkbox" ? (
                  <input
                    id={`edit-${field.name}`}
                    type="checkbox"
                    checked={!!values[field.name]}
                    onChange={(event) => set(field.name, event.target.checked)}
                    className="mt-2 h-5 w-5"
                  />
                ) : (
                  <input
                    id={`edit-${field.name}`}
                    type={field.kind || "text"}
                    required={field.required}
                    min={field.kind === "number" ? field.min : undefined}
                    minLength={field.kind !== "number" ? field.min : undefined}
                    max={field.kind === "number" ? field.max : undefined}
                    maxLength={field.kind !== "number" ? field.max : undefined}
                    step={field.kind === "number" ? 1 : undefined}
                    value={String(values[field.name] ?? "")}
                    onChange={(event) => set(field.name, event.target.value)}
                    className={fieldClass}
                  />
                )}
                <FieldErrors error={error} name={field.name} />
              </div>
            ))}
            {resource === "events" && (
              <fieldset className="space-y-4 rounded-xl border p-4">
                <legend className="px-2 font-semibold">Event schedule</legend>
                <label className="block text-sm">
                  Date precision
                  <select
                    className={fieldClass}
                    value={String(values.datePrecision)}
                    onChange={(event) =>
                      set("datePrecision", event.target.value)
                    }
                  >
                    <option value="tba">To be announced</option>
                    <option value="month">Month only</option>
                    <option value="exact">Exact date and time</option>
                  </select>
                </label>
                <FieldErrors error={error} name="datePrecision" />
                {values.datePrecision === "exact" && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Times use {String(values.timezone)}. The UTC offset is
                      calculated for the selected date.
                    </p>
                    <label className="block text-sm">
                      Starts at
                      <input
                        required
                        type="datetime-local"
                        className={fieldClass}
                        value={start}
                        onChange={(event) => setStart(event.target.value)}
                      />
                    </label>
                    <FieldErrors error={error} name="startsAt" />
                    <label className="block text-sm">
                      Ends at (optional)
                      <input
                        type="datetime-local"
                        className={fieldClass}
                        value={end}
                        onChange={(event) => setEnd(event.target.value)}
                      />
                    </label>
                    <FieldErrors error={error} name="endsAt" />
                  </>
                )}
                {values.datePrecision === "month" && (
                  <div className="grid grid-cols-2 gap-4">
                    <label className="text-sm">
                      Year
                      <input
                        type="number"
                        required
                        step={1}
                        className={fieldClass}
                        value={String(values.year ?? "")}
                        onChange={(event) => set("year", event.target.value)}
                      />
                      <FieldErrors error={error} name="year" />
                    </label>
                    <label className="text-sm">
                      Month
                      <input
                        type="number"
                        required
                        min={1}
                        max={12}
                        step={1}
                        className={fieldClass}
                        value={String(values.month ?? "")}
                        onChange={(event) => set("month", event.target.value)}
                      />
                      <FieldErrors error={error} name="month" />
                    </label>
                  </div>
                )}
              </fieldset>
            )}
            {resource === "events" && (
              <fieldset className="space-y-3 rounded-xl border p-4">
                <legend className="px-2 font-semibold">
                  Registration links
                </legend>
                {links.map((link, index) => (
                  <div key={index} className="space-y-2">
                    <label className="block text-sm">
                      Link label
                      <input
                        required
                        maxLength={100}
                        value={link.label}
                        className={fieldClass}
                        onChange={(event) =>
                          setLinks(
                            links.map((item, i) =>
                              i === index
                                ? { ...item, label: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="block text-sm">
                      Link URL
                      <input
                        required
                        type="url"
                        pattern="https?://.*"
                        value={link.url}
                        className={fieldClass}
                        onChange={(event) =>
                          setLinks(
                            links.map((item, i) =>
                              i === index
                                ? { ...item, url: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setLinks(links.filter((_, i) => i !== index))
                      }
                    >
                      Remove link
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  disabled={links.length >= 10}
                  onClick={() => setLinks([...links, { label: "", url: "" }])}
                >
                  Add registration link
                </Button>
                <FieldErrors error={error} name="registrationLinks" />
              </fieldset>
            )}
            {resource === "businesses" && (
              <fieldset className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                <legend className="px-2 font-semibold">
                  Location & social links
                </legend>
                {(["suburb", "state", "address"] as const).map((key) => (
                  <label className="text-sm capitalize" key={key}>
                    {key}
                    <input
                      value={location[key] || ""}
                      className={fieldClass}
                      onChange={(event) =>
                        setLocation({ ...location, [key]: event.target.value })
                      }
                    />
                    <FieldErrors error={error} name={`location.${key}`} />
                  </label>
                ))}
                {(["facebook", "instagram", "linkedin"] as const).map((key) => (
                  <label className="text-sm capitalize" key={key}>
                    {key}
                    <input
                      type="url"
                      value={social[key] || ""}
                      className={fieldClass}
                      onChange={(event) =>
                        setSocial({ ...social, [key]: event.target.value })
                      }
                    />
                    <FieldErrors error={error} name={`social.${key}`} />
                  </label>
                ))}
              </fieldset>
            )}
            {resource === "users" && saved && (
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={!!values.active}
                  onChange={(event) => set("active", event.target.checked)}
                />
                Account active
                <FieldErrors error={error} name="active" />
              </label>
            )}
            {statuses[resource] && (
              <label className="block text-sm">
                Status
                <select
                  aria-label="Status"
                  className={fieldClass}
                  value={String(values.status)}
                  onChange={(event) => set("status", event.target.value)}
                >
                  {statuses[resource]?.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <FieldErrors error={error} name="status" />
              </label>
            )}
            {mediaKey && (
              <div className="rounded-xl border border-dashed p-4">
                <label className="block text-sm font-medium">
                  {mediaKey === "photo" ? "Portrait photo" : "Cover image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="mt-3 block w-full min-w-0 text-sm"
                    onChange={(event) => {
                      const selected = event.target.files?.[0];
                      if (
                        selected &&
                        (!["image/jpeg", "image/png", "image/webp"].includes(
                          selected.type,
                        ) ||
                          selected.size > 5 * 1024 * 1024)
                      ) {
                        setFile(undefined);
                        setFileError(
                          "Use a static JPEG, PNG or WebP up to 5 MB.",
                        );
                      } else {
                        setFileError("");
                        setFile(selected);
                      }
                    }}
                  />
                </label>
                <p className="mt-2 text-xs text-muted-foreground">
                  Static JPEG, PNG or WebP, up to 5 MB. Saved separately after
                  the content record.
                </p>
                {(preview || mediaUrl(currentMedia)) && (
                  <img
                    alt="Selected cover"
                    src={preview || mediaUrl(currentMedia)}
                    className="mt-3 h-36 max-w-full rounded object-contain"
                  />
                )}
                {user?.role === "super_admin" && currentMedia && (
                  <Button
                    type="button"
                    disabled={busy}
                    variant="outline"
                    className="mt-3"
                    onClick={removeMedia}
                  >
                    Remove image
                  </Button>
                )}
                {fileError && (
                  <p role="alert" className="mt-2 text-sm text-red-700">
                    {fileError}
                  </p>
                )}
                <FieldErrors error={error} name="images" />
              </div>
            )}
            {partial && (
              <p role="status" className="rounded border p-3 text-sm">
                {partial}
              </p>
            )}
            <ErrorMessage error={error} />
            {invitation === false && (
              <Button
                type="button"
                disabled={busy}
                variant="outline"
                onClick={async () => {
                  setBusy(true);
                  try {
                    const result = await api<{ message: string }>(
                      "/auth/forgot-password",
                      { method: "POST", body: { email: values.email } },
                    );
                    setPartial(result.data.message);
                    setInvitation(undefined);
                  } catch (caught) {
                    setError(caught);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Resend invitation
              </Button>
            )}
            <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy || !!fileError}>
                {busy
                  ? "Saving…"
                  : resource === "users" && !saved
                    ? "Send invitation"
                    : "Save changes"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

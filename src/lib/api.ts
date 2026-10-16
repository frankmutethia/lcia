export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};
export type ApiResult<T> = { data: T; pagination?: Pagination; status: number };
export type FieldError = { path: string; message: string };
export class ApiError extends Error {
  status: number;
  details: FieldError[];
  retryAfter: number;
  constructor(
    status: number,
    message: string,
    details: FieldError[] = [],
    retryAfter = 0,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.retryAfter = retryAfter;
  }
}
export type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: "editor" | "super_admin";
  active: boolean;
};
export type AuthData = { user: StaffUser; csrfToken: string };
export type Media = {
  publicId: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
};
export type Resource =
  "events" | "albums" | "testimonials" | "business-categories" | "businesses";
export type ApiDocument = {
  _id: string;
  title?: string;
  name?: string;
  slug?: string;
  summary?: string;
  content?: string;
  description?: string;
  status?: string;
  active?: boolean;
  featured?: boolean;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  cover?: Media | ApiDocument | null;
  photo?: Media;
  image?: Media;
  media?: Media;
  caption?: string;
  alt?: string;
  datePrecision?: "exact" | "month" | "tba";
  startsAt?: string | null;
  endsAt?: string | null;
  year?: number | null;
  month?: number | null;
  timezone?: string;
  displayDate?: string;
  displayTime?: string;
  venueName?: string;
  venueAddress?: string;
  venueLabel?: string;
  type?: string;
  temporal?: string;
  audience?: string;
  attendanceCount?: number;
  registrationLinks?: { label: string; url: string }[];
  event?: string | ApiDocument | null;
  eventDate?: string | null;
  photoCount?: number;
  coverImage?: string | null;
  memberTitle?: string;
  comment?: string;
  rating?: number;
  source?: string;
  businessCount?: number;
  category?: string | ApiDocument;
  ownerName?: string;
  phone?: string;
  email?: string;
  website?: string;
  social?: { facebook?: string; instagram?: string; linkedin?: string };
  location?: { suburb?: string; state?: string; address?: string };
  services?: ApiDocument[];
  role?: "editor" | "super_admin";
  invitationSent?: boolean;
};
let csrfToken = "";
let onUnauthorized: () => void = () => {};
const cooldowns = new Map<string, number>();
export function setApiSession(token: string) {
  csrfToken = token;
}
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}
export function apiUrl(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
) {
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (!base) throw new ApiError(0, "Set VITE_API_URL to your backend API URL.");
  const url = new URL(base + path);
  for (const [key, value] of Object.entries(params))
    if (value !== undefined && value !== "")
      url.searchParams.set(key, String(value));
  return url;
}
export async function api<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
    signal?: AbortSignal;
  } = {},
): Promise<ApiResult<T>> {
  const remaining = Math.ceil(((cooldowns.get(path) ?? 0) - Date.now()) / 1000);
  if (remaining > 0)
    throw new ApiError(
      429,
      `Please wait ${remaining} seconds before trying again.`,
      [],
      remaining,
    );
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {};
  const multipart = options.body instanceof FormData;
  if (options.body !== undefined && !multipart)
    headers["Content-Type"] = "application/json";
  if (method !== "GET" && csrfToken) headers["X-CSRF-Token"] = csrfToken;
  let response: Response;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  const timeout = window.setTimeout(abort, multipart ? 120000 : 30000);
  try {
    response = await fetch(apiUrl(path, options.params), {
      method,
      credentials: "include",
      headers,
      body:
        options.body === undefined
          ? undefined
          : multipart
            ? (options.body as FormData)
            : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof ApiError || options.signal?.aborted) throw error;
    if (error instanceof DOMException && error.name === "AbortError")
      throw new ApiError(
        0,
        method === "GET"
          ? "The request timed out. Please try again."
          : "The request timed out. Refresh the list to check whether it was saved before retrying.",
      );
    throw new ApiError(
      0,
      "Cannot reach the API. Check the connection and that this website origin is allowed by the backend.",
    );
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
  const payload = await response.json().catch(() => null);
  if (response.status === 401) {
    csrfToken = "";
    onUnauthorized();
  }
  if (!response.ok || payload?.success === false) {
    const retry = response.headers.get("Retry-After");
    const seconds =
      response.status === 429
        ? Math.max(
            1,
            retry
              ? /^\d+$/.test(retry)
                ? Number(retry)
                : Math.ceil((Date.parse(retry) - Date.now()) / 1000) || 60
              : 60,
          )
        : 0;
    if (seconds) cooldowns.set(path, Date.now() + seconds * 1000);
    throw new ApiError(
      response.status,
      (payload?.error?.message ?? "The request could not be completed.") +
        (seconds ? ` Try again in ${seconds} seconds.` : ""),
      payload?.error?.details ?? [],
      seconds,
    );
  }
  if (!payload || !("data" in payload))
    throw new ApiError(
      response.status,
      "The API returned an unexpected response.",
    );
  return {
    data: payload.data as T,
    pagination: payload.pagination,
    status: response.status,
  };
}
export function passwordError(value: string) {
  return value.length < 12 ||
    value.length > 72 ||
    new TextEncoder().encode(value).length > 72
    ? "Use 12–72 characters and no more than 72 UTF-8 bytes."
    : "";
}
export function mediaUrl(
  value?: Media | ApiDocument | null,
): string | undefined {
  if (!value) return undefined;
  const url = "url" in value ? value.url : value.media?.url;
  return url && /^https?:\/\//i.test(url) ? url : undefined;
}
export function eventDate(item: ApiDocument) {
  if (item.displayDate) return item.displayDate;
  if (item.datePrecision === "tba") return "Date to be announced";
  if (item.datePrecision === "month" && item.year && item.month)
    return new Intl.DateTimeFormat("en-AU", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(item.year, item.month - 1, 1)));
  if (item.startsAt) {
    try {
      return new Intl.DateTimeFormat("en-AU", {
        dateStyle: "long",
        timeZone: item.timezone || "Australia/Sydney",
      }).format(new Date(item.startsAt));
    } catch {
      return "Date to be confirmed";
    }
  }
  return "Date to be announced";
}
export function eventTime(item: ApiDocument) {
  if (item.displayTime) return item.displayTime;
  if (!item.startsAt || item.datePrecision !== "exact") return "";
  try {
    return new Intl.DateTimeFormat("en-AU", {
      timeStyle: "short",
      timeZone: item.timezone || "Australia/Sydney",
    }).format(new Date(item.startsAt));
  } catch {
    return "";
  }
}

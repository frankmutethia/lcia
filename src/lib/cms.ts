import { useQuery } from "@tanstack/react-query";
import { localCmsRequest } from "./cms-local";

/** "php" uses public/cms.php; anything else uses the browser-only preview store. */
export const CMS_MODE: "php" | "local" = import.meta.env.VITE_CMS_API === "php" ? "php" : "local";

export type ContentType = "event" | "gallery" | "testimonial" | "category";
export type ContentItem = { id: string; type: ContentType; status: "draft" | "published"; version: number; created: string; data: { title: string; description: string; image?: string; date?: string; time?: string; location?: string; category?: string; role?: string; consent?: boolean } };
export type StaffUser = { id: string; name: string; email: string; role: "administrator" | "editor" | "member"; active: boolean; version: number };
export type Session = { user: StaffUser | null; csrf: string };
let csrf = "";
export function cmsUrl(action: string) {
  const url = new URL("cms.php", document.baseURI);
  url.hash = "";
  url.search = new URLSearchParams({ action }).toString();
  return url;
}
export function cmsImage(id: string) {
  // Preview images are stored as data URLs or bundled asset paths.
  if (CMS_MODE === "local" || /^(data:|blob:|https?:|\/)/.test(id)) return id;
  const url = cmsUrl("image"); url.searchParams.set("id", id); return url.href;
}
export async function cmsRequest<T>(action: string, body?: object | FormData): Promise<T> {
  if (CMS_MODE === "local") return localCmsRequest<T>(action, body);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), body instanceof FormData ? 120000 : 15000);
  try {
    const response = await fetch(cmsUrl(action), {
      method: body ? "POST" : "GET", credentials: "same-origin", signal: controller.signal,
      headers: body ? { "X-CSRF-Token": csrf, ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }) } : {},
      body: body ? body instanceof FormData ? body : JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => { throw new Error("The content service is unavailable. Run the PHP service locally or complete the VentraIP CMS setup."); });
    if (!response.ok || !data.ok) throw new Error(data.message || "The request could not be completed.");
    if (typeof data.csrf === "string") csrf = data.csrf;
    return data as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("The request timed out. Refresh the list before retrying to check whether it was saved.");
    throw error;
  } finally { window.clearTimeout(timeout); }
}
export function usePublishedContent() {
  return useQuery({ queryKey: ["cms-public"], queryFn: () => cmsRequest<{ items: ContentItem[] }>("public"), staleTime: 30000, retry: false });
}

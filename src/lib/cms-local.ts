// Browser-only stand-in for the CMS API while the backend endpoints are not built.
// It answers the same actions as public/cms.php, so switching to the real API is a
// configuration change (VITE_CMS_API=php). Data lives in this browser's IndexedDB:
// it is not shared with other devices or visitors, and sign-in is not verified.
import type { ContentItem, ContentType, StaffUser } from "./cms";
import photo1 from "@/assets/photos/IMG_6463-Enhanced-NR.jpeg";
import photo2 from "@/assets/photos/IMG_6473-Enhanced-NR.jpeg";
import photo3 from "@/assets/photos/IMG_6412-Enhanced-NR.jpeg";
import photo4 from "@/assets/photos/IMG_6353-Enhanced-NR.jpeg";
import photo5 from "@/assets/photos/IMG_6201-Enhanced-NR.jpeg";
import photo6 from "@/assets/photos/IMG_6002-Enhanced-NR.jpeg";

type Store = { items: ContentItem[]; users: (StaffUser & { password?: string })[] };
const SESSION_KEY = "mulembe-admin-session";
const TYPES: ContentType[] = ["event", "gallery", "testimonial", "category"];

class LocalError extends Error {}
const fail = (message: string): never => { throw new LocalError(message); };
const id = () => crypto.randomUUID().replace(/-/g, "");
const now = () => new Date().toISOString();

function seed(): Store {
  // Samples start as drafts so they never appear on the public landing page unprompted.
  const item = (type: ContentType, data: ContentItem["data"], offset: number): ContentItem =>
    ({ id: id(), type, status: "draft", version: 1, created: new Date(Date.now() - offset * 60000).toISOString(), data });
  const items: ContentItem[] = [
    item("event", { title: "Community cultural gathering", description: "An afternoon of music, food and Luhya heritage.", date: "2026-03-14", time: "2:00 pm", location: "Sydney, NSW", category: "Culture" }, 1),
    item("event", { title: "Members networking evening", description: "Meet fellow members and local business owners.", date: "2026-02-22", time: "6:00 pm", location: "Parramatta, NSW", category: "Networking" }, 2),
    item("event", { title: "Family picnic in the park", description: "Bring the family for games and a shared lunch.", date: "2026-02-08", time: "11:00 am", location: "Western Sydney, NSW", category: "Community" }, 3),
    item("event", { title: "Heritage and storytelling day", description: "Stories, proverbs and language passed between generations.", date: "2026-01-18", time: "1:00 pm", location: "Sydney, NSW", category: "Culture" }, 4),
    ...[["Cultural gathering", photo1], ["Friends and family", photo2], ["Our shared heritage", photo3], ["Coming together", photo4], ["Community connections", photo5], ["A place to belong", photo6]]
      .map(([title, image], index) => item("gallery", { title, description: "Mulembe Community NSW", image }, 10 + index)),
    item("testimonial", { title: "Grace W.", role: "Community member", consent: true, description: "Mulembe has given me a real sense of belonging. It feels wonderful to stay connected to our roots while building a life here in Australia." }, 20),
    item("testimonial", { title: "Daniel M.", role: "Community member", consent: true, description: "The events bring our families together in a way that feels genuine. Our children get to grow up knowing where they come from." }, 21),
    item("testimonial", { title: "Anne N.", role: "Community member", consent: true, description: "Through the community, I’ve met friends and fellow business owners who inspire and support one another." }, 22),
    ...[["Food & catering", "Flavours and hospitality from our community"], ["Health & wellness", "Care for individuals and families"], ["Professional services", "Expertise you can count on"], ["Retail & lifestyle", "Locally owned shops and services"], ["Education & learning", "Supporting the next generation"]]
      .map(([title, description], index) => item("category", { title, description }, 30 + index)),
  ];
  return { items, users: [] };
}

// Minimal IndexedDB key-value store; falls back to memory when storage is unavailable.
let memory: Store | undefined;
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("mulembe-admin-preview", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("kv");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function load(): Promise<Store> {
  if (memory) return memory;
  try {
    const db = await openDb();
    const stored = await new Promise<Store | undefined>((resolve, reject) => {
      const request = db.transaction("kv").objectStore("kv").get("store");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    memory = stored ?? seed();
  } catch {
    memory = seed();
  }
  return memory;
}
async function persist(store: Store) {
  memory = store;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put(store, "store");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") throw error;
    /* Otherwise changes remain for this visit when browser storage is unavailable. */
  }
}

function sessionUserId(): string | null {
  try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; }
}
function setSession(userId: string | null) {
  try {
    if (userId) sessionStorage.setItem(SESSION_KEY, userId);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch { /* Session lasts for this page view only. */ }
}
const publicUser = (user: Store["users"][number]): StaffUser => {
  const { id, name, email, role, active, version } = user;
  return { id, name, email, role, active, version };
};
function currentUser(store: Store) {
  const user = store.users.find(candidate => candidate.id === sessionUserId());
  return user && user.active && user.role !== "member" ? user : null;
}
function text(data: Record<string, unknown>, key: string, max = 200, required = true): string {
  const value = data[key] ?? "";
  if (typeof value !== "string" || value.trim().length > max || (required && !value.trim())) fail(`Please check ${key}.`);
  return (value as string).trim();
}

// Downscale uploads so a batch of photos fits comfortably in browser storage.
async function toDataUrl(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new LocalError("Could not read that image."));
      reader.readAsDataURL(file);
    });
  }
}

async function handle(action: string, body?: object | FormData): Promise<Record<string, unknown>> {
  const store = await load();
  if (action === "public") return { items: store.items.filter(item => item.status === "published") };
  if (action === "session" && !body) { const user = currentUser(store); return { user: user ? publicUser(user) : null, csrf: "" }; }
  const data = (body && !(body instanceof FormData) ? body : {}) as Record<string, unknown>;
  if (action === "login") {
    const email = text(data, "email", 254).toLowerCase();
    text(data, "password", 1024);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Enter a valid email address.");
    let user = store.users.find(candidate => candidate.email === email);
    if (user && (!user.active || user.role === "member")) fail("This account does not have staff access.");
    if (!user) {
      // Preview: the first sign-in with a new email becomes an administrator.
      const name = email.split("@")[0].split(/[._-]+/).filter(Boolean).map(part => part[0].toUpperCase() + part.slice(1)).join(" ");
      user = { id: id(), name: name || "Administrator", email, role: "administrator", active: true, version: 1 };
      store.users.push(user);
      await persist(store);
    }
    setSession(user.id);
    return { user: publicUser(user), csrf: "" };
  }
  const user = currentUser(store);
  if (!user) fail("Please sign in with a staff account.");
  if (action === "logout") { setSession(null); return {}; }
  if (action === "content") return { items: [...store.items].sort((a, b) => b.created.localeCompare(a.created)) };
  if (action === "users") {
    if (user!.role !== "administrator") fail("Only administrators can manage members and roles.");
    if (!body) return { users: store.users.map(publicUser).sort((a, b) => a.name.localeCompare(b.name)) };
    const name = text(data, "name");
    const email = text(data, "email", 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Enter a valid email address.");
    const role = text(data, "role") as StaffUser["role"];
    if (!["administrator", "editor", "member"].includes(role)) fail("Choose a valid role.");
    const active = data.active !== false;
    const password = text(data, "password", 1024, false);
    const existing = data.id ? store.users.find(candidate => candidate.id === data.id) : undefined;
    if (data.id && !existing) fail("Member not found.");
    if (store.users.some(candidate => candidate.email === email && candidate.id !== existing?.id)) fail("That email is already registered.");
    if (existing?.id === user!.id && (!active || role !== "administrator")) fail("You cannot remove your own administrator access.");
    if (role !== "member" && !existing?.password && existing?.id !== user!.id && !password) fail("A password is required for new staff access.");
    if (password && password.length < 12) fail("Use at least 12 characters for the staff password.");
    if (existing) Object.assign(existing, { name, email, role, active, password: password || existing.password, version: existing.version + 1 });
    else store.users.push({ id: id(), name, email, role, active, password: password || undefined, version: 1 });
    await persist(store);
    return {};
  }
  if (action !== "save" || !(body instanceof FormData)) fail("Unknown request.");
  const form = body as FormData;
  let raw: Record<string, unknown>;
  try { raw = JSON.parse(String(form.get("item"))); } catch { return fail("Invalid content."); }
  const type = raw.type as ContentType;
  if (!TYPES.includes(type)) fail("Invalid content type.");
  const status = raw.status === "published" ? "published" : "draft";
  const entry: ContentItem["data"] = { title: text(raw, "title"), description: text(raw, "description", 5000, type !== "gallery") };
  if (type === "event") Object.assign(entry, { date: text(raw, "date"), time: text(raw, "time", 100), location: text(raw, "location", 300), category: text(raw, "category", 100) });
  if (type === "testimonial") {
    if (raw.consent !== true) fail("Confirm permission to publish this testimonial.");
    Object.assign(entry, { role: text(raw, "role", 100), consent: true });
  }
  const files = form.getAll("images[]").filter((file): file is File => file instanceof File);
  const images = await Promise.all(files.map(toDataUrl));
  const existing = raw.id ? store.items.find(item => item.id === raw.id && item.type === type) : undefined;
  if (raw.id && !existing) fail("Content not found.");
  if (existing) {
    if (existing.version !== raw.version) fail("This content changed. Refresh before saving.");
    Object.assign(existing, { status, version: existing.version + 1, data: { ...entry, image: images[0] ?? existing.data.image } });
  } else if (type === "gallery") {
    if (!images.length) fail("Select at least one gallery image.");
    images.forEach((image, index) => store.items.push({ id: id(), type, status, version: 1, created: now(), data: { ...entry, title: images.length > 1 ? `${entry.title} — ${index + 1}` : entry.title, image } }));
  } else {
    store.items.push({ id: id(), type, status, version: 1, created: now(), data: { ...entry, image: images[0] } });
  }
  await persist(store);
  return {};
}

export async function localCmsRequest<T>(action: string, body?: object | FormData): Promise<T> {
  try {
    return { ok: true, ...(await handle(action, body)) } as T;
  } catch (error) {
    if (error instanceof LocalError) throw error;
    if (error instanceof DOMException && error.name === "QuotaExceededError") throw new Error("Browser storage is full. Remove some images or use smaller files.");
    throw new Error("The request could not be completed.");
  }
}

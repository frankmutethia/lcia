import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { Pencil, Search, ShieldCheck, UserPlus, UserRound, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cmsRequest, type StaffUser } from "@/lib/cms";
import { usePreview } from "./preview-context";

const initial = { name: "", email: "", role: "member", active: true, password: "" };
const field = "mt-2 block w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm";
const roles = [
  { id: "administrator", label: "Administrator", detail: "Manages content, members and staff roles.", icon: ShieldCheck },
  { id: "editor", label: "Editor", detail: "Creates and publishes website content.", icon: Pencil },
  { id: "member", label: "Member", detail: "Community member record; cannot sign in.", icon: UserRound },
] as const;

export default function UsersPage() {
  const { user: me } = usePreview();
  const query = useQuery({ queryKey: ["cms-users"], queryFn: () => cmsRequest<{ users: StaffUser[] }>("users"), retry: false });
  const cache = useQueryClient();
  const [values, setValues] = useState(initial);
  const [editing, setEditing] = useState<StaffUser>();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const users = query.data?.users ?? [];
  const filtered = users.filter(user => (roleFilter === "all" || user.role === roleFilter) && `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(search.toLowerCase()));
  function show(user?: StaffUser) { setEditing(user); setValues({ ...initial, ...user, password: "" }); setError(""); setNotice(""); setOpen(true); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (saving) return;
    setSaving(true); setError("");
    try {
      await cmsRequest("users", { ...values, id: editing?.id, version: editing?.version });
      await cache.invalidateQueries({ queryKey: ["cms-users"] });
      await cache.invalidateQueries({ queryKey: ["cms-session"] });
      setOpen(false);
      setNotice(`${values.name} ${editing ? "updated" : "onboarded"} as ${values.role}.${values.role !== "member" ? " Share their sign-in details privately; no invitation email is sent." : ""}`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save member."); }
    finally { setSaving(false); }
  }
  return <section>
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><div className="mb-3 text-[11px] font-bold uppercase text-primary">User management</div><h2 className="text-2xl font-bold sm:text-[30px]">People & access</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Onboard community members, assign staff roles and control who can sign in to this workspace.</p></div>
      <Button onClick={() => show()} className="h-10 gap-2"><UserPlus className="h-4 w-4" />Onboard member</Button>
    </div>
    <div className="mb-8 grid gap-4 sm:grid-cols-3">{roles.map(({ id, label, detail, icon: Icon }) => <button type="button" key={id} onClick={() => setRoleFilter(roleFilter === id ? "all" : id)} aria-pressed={roleFilter === id} className={`rounded-md border bg-card p-5 text-left transition-colors hover:border-primary/40 ${roleFilter === id ? "border-primary" : "border-border"}`}>
      <div className="flex items-start justify-between"><span className="text-[13px] text-muted-foreground">{label}s</span><span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-[18px] w-[18px]" /></span></div>
      <div className="mt-3 text-[28px] font-bold leading-none">{query.isPending ? "…" : users.filter(user => user.role === id).length}</div>
      <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
    </button>)}</div>
    {notice && <p role="status" className="mb-5 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900">{notice}</p>}
    <div className="mb-5 flex flex-wrap gap-3">
      <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input className="h-10 pl-10" placeholder="Search name, email or role" aria-label="Search members" value={search} onChange={event => setSearch(event.target.value)} /></div>
      <select aria-label="Filter by role" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={roleFilter} onChange={event => setRoleFilter(event.target.value)}><option value="all">All roles</option>{roles.map(role => <option key={role.id} value={role.id}>{role.label}s</option>)}</select>
    </div>
    {query.isPending && <p role="status" className="py-10 text-center text-sm text-muted-foreground">Loading members…</p>}
    {query.isError && <div role="alert" className="rounded-md border border-border bg-card p-5 text-sm">{query.error.message}<Button variant="outline" onClick={() => query.refetch()} className="ml-3">Retry</Button></div>}
    {query.isSuccess && (filtered.length ? <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="hidden grid-cols-[2fr_2fr_1fr_1fr_90px] gap-4 border-b border-border bg-secondary/40 px-6 py-4 text-[11px] font-bold uppercase text-muted-foreground md:grid"><span>Name</span><span>Email</span><span>Role</span><span>Access</span><span className="sr-only">Actions</span></div>
      {filtered.map(user => <div key={user.id} className="grid gap-2 border-b border-border px-6 py-4 last:border-0 md:grid-cols-[2fr_2fr_1fr_1fr_90px] md:items-center md:gap-4">
        <div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">{user.name.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("")}</span><span className="break-words text-sm font-semibold">{user.name}{user.id === me?.id && <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>}</span></div>
        <span className="break-all text-xs text-muted-foreground">{user.email}</span>
        <span className="text-xs capitalize">{user.role}</span>
        <span><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${user.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200" : "bg-secondary text-secondary-foreground"}`}>{user.active ? "Active" : "Inactive"}</span></span>
        <div><Button size="sm" variant="outline" onClick={() => show(user)} aria-label={`Edit ${user.name}`}><Pencil className="mr-1.5 h-3.5 w-3.5" />Edit</Button></div>
      </div>)}
    </div> : <div className="rounded-md border border-dashed border-border bg-card p-10 text-center"><Users className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" /><p className="mt-3 font-semibold">{users.length ? "No members match your filters" : "No members yet"}</p></div>)}

    <Dialog.Root open={open} onOpenChange={value => { if (!saving) setOpen(value); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50" /><Dialog.Content className="admin-ui fixed left-1/2 top-1/2 z-[71] max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-background p-5 text-foreground shadow-xl sm:p-7">
      <Dialog.Title className="pr-8 text-xl font-bold">{editing ? "Edit member" : "Onboard a member"}</Dialog.Title>
      <Dialog.Description className="mt-2 text-sm text-muted-foreground">Choose the access this person needs. Only administrators and editors can sign in.</Dialog.Description>
      <Dialog.Close disabled={saving} aria-label="Close dialog" className="absolute right-4 top-4 rounded p-2 hover:bg-secondary"><X className="h-5 w-5" /></Dialog.Close>
      <form onSubmit={save} className="mt-6 space-y-5" aria-busy={saving}>
        <label className="block text-sm font-medium">Full name<input required maxLength={200} className={field} value={values.name} onChange={event => setValues({ ...values, name: event.target.value })} /></label>
        <label className="block text-sm font-medium">Email address<input required type="email" maxLength={254} className={field} value={values.email} onChange={event => setValues({ ...values, email: event.target.value })} /></label>
        <fieldset><legend className="text-sm font-medium">Role</legend><div className="mt-2 grid gap-2">{roles.map(({ id, label, detail }) => <label key={id} className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm ${values.role === id ? "border-primary bg-primary/5" : "border-border"}`}><input type="radio" name="role" value={id} checked={values.role === id} onChange={() => setValues({ ...values, role: id })} className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" /><span><span className="block font-medium">{label}</span><span className="text-xs text-muted-foreground">{detail}</span></span></label>)}</div></fieldset>
        {values.role !== "member" && <label className="block text-sm font-medium">{editing && editing.role !== "member" ? "New password (leave blank to keep current)" : "Initial staff password"}<input type="password" autoComplete="new-password" minLength={12} maxLength={1024} required={!editing || editing.role === "member"} className={field} value={values.password} onChange={event => setValues({ ...values, password: event.target.value })} /><span className="mt-2 block text-xs font-normal text-muted-foreground">At least 12 characters. Share it privately with this person.</span></label>}
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={values.active} onChange={event => setValues({ ...values, active: event.target.checked })} className="h-4 w-4" />Account active</label>
        {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4"><Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Onboard member"}</Button></div>
      </form>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </section>;
}

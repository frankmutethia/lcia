import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, ShieldCheck, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LEADERSHIP_ROLES } from "@/constants/leadership-interest";

const emptyDetails = { fullName: "", dob: "", email: "", phone: "", address: "" };
const inputClass = "mt-2 block w-full min-w-0 rounded-lg border border-slate-300 bg-white p-3 text-base outline-none focus:border-luhya-green focus:ring-2 focus:ring-luhya-green/20";

export default function VotingPage({ embedded = false }: { embedded?: boolean }) {
  const Title = embedded ? "h2" : "h1";
  const [details, setDetails] = useState(emptyDetails);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [review, setReview] = useState(false);
  const [finished, setFinished] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
  const shareUrl = new URL(document.baseURI);
  shareUrl.search = "";
  shareUrl.hash = "/vote";
  useEffect(() => {
    if (embedded) return;
    const previous = document.title;
    document.title = "Voting preview | Mulembe Community NSW";
    window.scrollTo(0, 0);
    return () => { document.title = previous; };
  }, [embedded]);
  useEffect(() => { if (review || finished) heading.current?.focus(); }, [review, finished]);
  async function share() {
    try { await navigator.clipboard.writeText(shareUrl.href); setShareMessage("Preview link copied."); }
    catch { setShareMessage("Copy the preview link below."); }
  }
  return <section id={embedded ? "voting" : undefined} aria-label="Community voting" className="scroll-mt-28 bg-[#faf9f6] text-luhya-navy">
    {!embedded && <header className="border-b bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <Link to="/" className="flex items-center gap-3 font-bold"><img src={`${import.meta.env.BASE_URL}lcia-logo.jpg`} alt="" className="h-12 w-12 object-contain" /><span>Mulembe Community<span className="block text-xs font-medium text-luhya-gold">NSW · Australia</span></span></Link>
      <nav aria-label="Voting navigation" className="flex flex-wrap gap-5 text-sm"><Link to="/">Home</Link><Link to="/leadership-interest">Express interest</Link><Link to="/welfare">Welfare</Link></nav>
    </div></header>}
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-r-xl border-l-4 border-luhya-gold bg-amber-50 p-4 text-sm leading-relaxed"><strong className="mr-2 uppercase tracking-wider">Design preview</strong>Sample candidates only. No information is submitted and no votes are recorded. Please use sample details.</div>
      <div className="my-8 flex flex-wrap items-end justify-between gap-6 border-b-2 border-luhya-gold/60 pb-8">
        <div className="max-w-2xl"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-luhya-green">Mulembe Community NSW</p><Title className="font-display text-3xl leading-tight sm:text-5xl">Choose your next leadership team.</Title><p className="mt-4 text-muted-foreground">Enter voter details, explore the sample candidates, then review your ballot.</p></div>
        <div className="max-w-xs rounded-xl bg-white p-4 text-sm"><ShieldCheck className="mb-2 text-luhya-green" aria-hidden="true" /><p className="font-semibold">Preparing for community elections</p><p className="mt-1 text-muted-foreground">Approved nominees, eligibility checks and election rules are required before live voting opens.</p></div>
      </div>
      {finished ? <section className="rounded-2xl border bg-white p-6 sm:p-10"><h2 ref={heading} tabIndex={-1} className="text-2xl font-semibold">Preview complete — no vote recorded</h2><p className="my-4">Your sample details and selections have been cleared. Live voting is not open.</p><Button onClick={() => { setFinished(false); setReview(false); }}>Explore the preview again</Button></section>
      : review ? <section className="rounded-2xl border bg-white p-6 sm:p-10"><h2 ref={heading} tabIndex={-1} className="font-display text-3xl">Review your sample ballot</h2><p className="mt-2 text-muted-foreground">Check your details and choices. This preview does not submit a vote.</p>
        <dl className="my-6 grid gap-4 rounded-xl bg-slate-50 p-5 sm:grid-cols-2">{Object.entries(details).map(([key, value]) => <div key={key} className="min-w-0"><dt className="text-xs uppercase tracking-wide text-muted-foreground">{{ fullName: "Full name", dob: "Date of birth", email: "Email", phone: "Phone number", address: "Address" }[key]}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{value}</dd></div>)}</dl>
        <ul className="divide-y">{LEADERSHIP_ROLES.map(role => <li key={role.id} className="flex flex-wrap justify-between gap-2 py-4"><span className="font-medium">{role.title}</span><span>Sample Candidate {choices[role.id]}</span></li>)}</ul>
        <div className="mt-6 flex flex-wrap gap-3"><Button variant="outline" onClick={() => setReview(false)}><ArrowLeft className="mr-2 h-4 w-4" />Edit ballot</Button><Button onClick={() => { setDetails(emptyDetails); setChoices({}); setFinished(true); }}>Finish preview · no vote submitted</Button></div>
      </section> : <form onSubmit={event => { event.preventDefault(); setReview(true); }}>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <section className="min-w-0 overflow-hidden rounded-2xl border bg-white">
            <div className="bg-luhya-navy p-5 text-white"><h2 className="text-lg font-semibold">1 · Your voter details</h2><p className="mt-1 text-sm text-white/75">All fields are required. Use sample details.</p></div>
            <div className="space-y-5 p-5">
              {([{ key: "fullName", label: "Full name", type: "text" }, { key: "dob", label: "Date of birth", type: "date" }, { key: "email", label: "Email address", type: "email" }, { key: "phone", label: "Phone number", type: "tel" }] as const).map(field => <label key={field.key} className="block text-sm font-medium" htmlFor={`voter-${field.key}`}>{field.label} <span aria-hidden="true">*</span><input id={`voter-${field.key}`} name={field.key} type={field.type} required max={field.type === "date" ? today : undefined} min={field.type === "date" ? "1900-01-01" : undefined} maxLength={field.key === "phone" ? 30 : 254} pattern={field.type === "text" ? ".*\\S.*" : field.type === "tel" ? "[+0-9 ()-]{7,30}" : undefined} autoComplete="off" className={inputClass} value={details[field.key]} onChange={event => setDetails({ ...details, [field.key]: event.target.value })} /></label>)}
              <label htmlFor="voter-address" className="block text-sm font-medium">Residential address <span aria-hidden="true">*</span><textarea id="voter-address" required rows={4} maxLength={500} className={inputClass} value={details.address} onChange={event => { event.target.setCustomValidity(event.target.value.trim() ? "" : "Please enter an address."); setDetails({ ...details, address: event.target.value }); }} /><span className="mt-2 block text-xs font-normal text-muted-foreground">Street, suburb/city, state, postcode and country.</span></label>
              <p className="text-xs leading-relaxed text-muted-foreground">Details remain only in this page’s memory and are cleared when you finish the preview or leave this page. No membership verification takes place in this preview.</p>
            </div>
          </section>
          <section className="min-w-0" aria-labelledby="candidate-heading"><div className="rounded-xl border-l-4 border-luhya-gold bg-amber-50 p-5"><h2 id="candidate-heading" className="text-lg font-semibold">2 · Your candidate choices</h2><p className="mt-1 text-sm text-muted-foreground">Choose one sample candidate per position. These placeholders are not approved nominees.</p></div>
            <div className="mt-6 space-y-7">{LEADERSHIP_ROLES.map((role, index) => <fieldset key={role.id}><legend className="text-lg font-semibold"><span className="mr-3 text-sm text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>{role.title}</legend><p className="mb-3 mt-2 text-sm text-muted-foreground">{role.description}</p><div className="grid gap-3 sm:grid-cols-2">{["1", "2"].map(candidate => <label key={candidate} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 bg-white p-5 transition focus-within:ring-2 focus-within:ring-luhya-gold ${choices[role.id] === candidate ? "border-luhya-green bg-green-50" : "border-slate-200 hover:border-luhya-green/50"}`}><input type="radio" name={role.id} value={candidate} required checked={choices[role.id] === candidate} onChange={() => setChoices({ ...choices, [role.id]: candidate })} className="mt-1 h-5 w-5 shrink-0 accent-luhya-green" /><span><span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Sample nominee</span><span className="mt-2 block font-semibold">Sample Candidate {candidate}</span><span className="mt-2 block text-sm text-muted-foreground">Approved candidate statements will appear here.</span><span className="mt-4 flex items-center gap-1 text-sm font-medium text-luhya-green">{choices[role.id] === candidate && <Check className="h-4 w-4" />}{choices[role.id] === candidate ? "Selected" : "Select candidate"}</span></span></label>)}</div></fieldset>)}</div>
          </section>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-5"><p className="text-sm" aria-live="polite">{Object.keys(choices).length} of {LEADERSHIP_ROLES.length} positions selected</p><Button type="submit"><Vote className="mr-2 h-4 w-4" />Review sample ballot</Button></div>
      </form>}
      <section className="mt-8 border-t pt-6 text-sm"><div className="flex flex-wrap items-center gap-4"><Button variant="outline" onClick={share}>Copy voting preview link</Button><Link to="/leadership-interest" className="underline">Want to serve? Express your interest</Link></div><p role="status" className="mt-3">{shareMessage}</p>{shareMessage && <input aria-label="Voting preview link" readOnly value={shareUrl.href} onFocus={event => event.target.select()} className={`${inputClass} max-w-xl`} />}</section>
    </div>
  </section>;
}

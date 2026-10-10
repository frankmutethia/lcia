import { useEffect, useId, useRef, useState } from "react";
import { opensPdfExternally } from "@/lib/utils";
import PhoneInput from "@/components/PhoneInput";
import type { FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Download, FileText, Loader2, Send, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EMAIL } from "@/constants/contact";
import { CONSTITUTION_VERSION, LEADERSHIP_ROLES } from "@/constants/leadership-interest";
import type { LeadershipRoleId } from "@/constants/leadership-interest";
import constitutionUrl from "@/assets/OFFICIAL MULEMBE COMMUNITY NSW INC CONSTITUTION. 2026.pdf?url";

const STEPS = ["Constitution", "Positions", "Your details"];
const INITIAL_DETAILS = { fullName: "", dateOfBirth: "", address: "", email: "", phone: "", motivation: "" };
type Details = typeof INITIAL_DETAILS;
type FieldErrors = Partial<Record<keyof Details | "positions" | "constitutionConsent", string>>;
const INPUT_CLASS = "mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-luhya-navy shadow-sm outline-none transition focus:border-luhya-green focus:ring-2 focus:ring-luhya-green/20 aria-[invalid=true]:border-red-600";

function todayInSydney() {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  return ["year", "month", "day"].map((part) => parts.find(({ type }) => type === part)?.value).join("-");
}

function validBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value && value <= todayInSydney();
}

const LeadershipInterestForm = () => {
  const id = useId();
  const [step, setStep] = useState(0);
  const [constitutionOpened, setConstitutionOpened] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const previewRef = useRef<HTMLElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const [constitutionConsent, setConstitutionConsent] = useState(false);
  const [positions, setPositions] = useState<LeadershipRoleId[]>([]);
  const [details, setDetails] = useState<Details>(INITIAL_DETAILS);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [errorFocus, setErrorFocus] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const focusStepRef = useRef(false);

  useEffect(() => {
    if (focusStepRef.current || submitted) headingRef.current?.focus();
    focusStepRef.current = false;
  }, [step, submitted]);

  useEffect(() => {
    if (errorFocus > 0) errorRef.current?.focus();
  }, [errorFocus]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  useEffect(() => {
    if (previewVisible) {
      previewRef.current?.focus({ preventScroll: true });
      previewRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [previewVisible]);

  function closePreview() {
    setPreviewVisible(false);
    consentRef.current?.focus({ preventScroll: true });
    consentRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function openPreview() {
    setConstitutionOpened(true);
    if (opensPdfExternally()) {
      window.open(constitutionUrl, "_blank", "noopener");
      return;
    }
    setPreviewVisible(true);
    if (previewVisible) {
      previewRef.current?.focus({ preventScroll: true });
      previewRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  function goToStep(next: number) {
    setErrors({});
    setSubmitError("");
    focusStepRef.current = true;
    setStep(next);
  }

  function reportErrors(nextErrors: FieldErrors, message = "") {
    setErrors(nextErrors);
    setSubmitError(message);
    setErrorFocus((value) => value + 1);
  }

  function togglePosition(role: LeadershipRoleId) {
    setPositions((current) => current.includes(role) ? current.filter((value) => value !== role) : [...current, role]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendingRef.current || submitted) return;
    if (!constitutionOpened || !constitutionConsent) {
      if (step !== 0) goToStep(0);
      reportErrors({ constitutionConsent: "Open the constitution, read it, then tick the acknowledgement to continue." });
      return;
    }
    if (step === 0) {
      goToStep(1);
      return;
    }
    if (positions.length === 0) {
      if (step !== 1) goToStep(1);
      reportErrors({ positions: "Choose at least one leadership position." });
      return;
    }
    if (step === 1) {
      goToStep(2);
      return;
    }

    const values: Details = {
      fullName: details.fullName.trim(), dateOfBirth: details.dateOfBirth.trim(),
      address: details.address.trim(), email: details.email.trim(), phone: details.phone.trim(),
      motivation: details.motivation.trim(),
    };
    const validation: FieldErrors = {};
    if (!values.fullName) validation.fullName = "Enter your full name.";
    if (!validBirthDate(values.dateOfBirth)) validation.dateOfBirth = "Enter a valid date of birth that is not in the future.";
    if (!values.address) validation.address = "Enter your address.";
    if (!values.motivation) validation.motivation = "Tell us why you would like to serve in your selected role or roles.";
    else if (values.motivation.length > 2000) validation.motivation = "Please keep your statement to 2,000 characters or fewer.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) validation.email = "Enter a valid email address.";
    const digits = values.phone.replace(/\D/g, "");
    if (!/^\+?[0-9 ().-]+$/.test(values.phone) || digits.length < 7 || digits.length > 15) {
      validation.phone = "Enter a valid phone number with 7–15 digits, including a country code if needed.";
    }
    if (Object.keys(validation).length > 0) {
      reportErrors(validation);
      return;
    }

    sendingRef.current = true;
    setSubmitting(true);
    setErrors({});
    setSubmitError("");
    const controller = new AbortController();
    controllerRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(new URL("leadership-interest.php", document.baseURI).href, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ ...values, positions, constitutionConsent: true, constitutionVersion: CONSTITUTION_VERSION }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (response.ok && result && typeof result === "object" && "ok" in result && result.ok === true) {
        setSubmitted(true);
        setDetails(INITIAL_DETAILS);
        return;
      }
      let message = "Your expression of interest could not be submitted. Please try again or contact the Mulembe team using the email below.";
      const serverErrors: FieldErrors = {};
      if (result && typeof result === "object") {
        if ("message" in result && typeof result.message === "string") message = result.message;
        if ("errors" in result && result.errors && typeof result.errors === "object") {
          for (const key of ["fullName", "dateOfBirth", "address", "email", "phone", "motivation", "positions", "constitutionConsent"] as const) {
            if (key in result.errors) {
              const value = (result.errors as Record<string, unknown>)[key];
              if (typeof value === "string") serverErrors[key] = value;
            }
          }
        }
      }
      if (serverErrors.constitutionConsent) goToStep(0);
      else if (serverErrors.positions) goToStep(1);
      reportErrors(serverErrors, message);
    } catch {
      reportErrors({}, "We could not confirm your submission. Check your connection, or contact the Mulembe team before trying again if you are unsure whether it was received.");
    } finally {
      window.clearTimeout(timeout);
      controllerRef.current = null;
      sendingRef.current = false;
      setSubmitting(false);
    }
  }

  function fieldError(field: keyof Details) {
    return errors[field] ? <p id={`${id}-${field}-error`} className="mt-2 text-sm text-red-700">{errors[field]}</p> : null;
  }

  if (submitted) {
    return (
      <div className="rounded-3xl border border-luhya-green/20 bg-white px-6 py-12 text-center shadow-xl sm:px-12">
        <CheckCircle2 aria-hidden="true" className="mx-auto mb-5 h-14 w-14 text-luhya-green" />
        <h3 ref={headingRef} tabIndex={-1} className="font-display text-3xl text-luhya-navy focus:outline-none">Your interest has been submitted</h3>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-slate-600">
          Thank you for offering to serve our community. Your expression of interest will be reviewed by the Mulembe team, who will contact you about next steps.
        </p>
        <p className="mt-5 text-sm text-slate-500">Formal nominations follow the process in the constitution.</p>
        <a className="mt-6 inline-block break-all font-medium text-luhya-green underline underline-offset-4" href={`mailto:${EMAIL}`}>{EMAIL}</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Leadership expression of interest" aria-busy={submitting} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <ol aria-label="Application progress" className="grid grid-cols-3 gap-2 bg-luhya-navy px-4 py-6 sm:gap-6 sm:px-8">
        {STEPS.map((label, index) => (
          <li key={label} aria-current={step === index ? "step" : undefined} className={`flex flex-col items-center gap-2 text-center text-xs font-medium sm:flex-row sm:text-left sm:text-sm ${step === index ? "text-white" : "text-white/65"}`}>
            <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${index <= step ? "border-luhya-gold bg-luhya-gold text-luhya-navy" : "border-white/30"}`}>
              {index < step ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span>{label}<span className="sr-only">{index < step ? ", completed" : ""}</span></span>
          </li>
        ))}
      </ol>

      <div className="p-5 sm:p-8 lg:p-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-luhya-green">Step {step + 1} of 3</p>
        <h3 ref={headingRef} tabIndex={-1} className="font-display text-2xl text-luhya-navy focus:outline-none sm:text-3xl">
          {step === 0 ? "Start with our constitution" : step === 1 ? "Where would you like to contribute?" : "Tell us about yourself"}
        </h3>

        {(submitError || Object.keys(errors).length > 0) && (
          <div ref={errorRef} tabIndex={-1} role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500">
            <p className="font-semibold">{submitError || "Please check the following before continuing:"}</p>
            {Object.keys(errors).length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">{Object.entries(errors).map(([key, message]) => <li key={key}>{message}</li>)}</ul>}
          </div>
        )}

        <fieldset disabled={submitting} className="min-w-0">
          <legend className="sr-only">{STEPS[step]}</legend>

          {step === 0 && (
            <div className="mt-5 space-y-6">
              <p className="leading-relaxed text-slate-600">Please read the Mulembe Community NSW Inc Constitution (2026) before expressing your interest in a leadership position.</p>
              <div className="rounded-2xl border border-luhya-gold/40 bg-luhya-cream p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <FileText aria-hidden="true" className="mt-1 h-7 w-7 shrink-0 text-luhya-green" />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-luhya-navy">MULEMBE COMMUNITY NSW INC CONSTITUTION (2026)</h4>
                    <p className="mt-1 text-sm text-slate-600">2026 edition · PDF · Read here or download a copy</p>
                  </div>
                </div>
                <Button type="button" variant="outline" aria-expanded={previewVisible} aria-controls={`${id}-constitution-preview`} onClick={openPreview} className="mt-5 h-auto min-h-11 w-full whitespace-normal border-luhya-green bg-white py-3 text-luhya-green sm:w-auto">
                  <Eye aria-hidden="true" />View the constitution
                </Button>
              </div>
              {previewVisible && (
                <section ref={previewRef} id={`${id}-constitution-preview`} tabIndex={-1} aria-labelledby={`${id}-preview-title`} className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-luhya-green">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white p-4 sm:p-5">
                    <div>
                      <h4 id={`${id}-preview-title`} className="font-semibold text-luhya-navy">Constitution preview</h4>
                      <p className="mt-1 text-xs text-slate-500">Mulembe Community NSW Inc · 2026</p>
                    </div>
                    <Button asChild variant="outline" className="min-h-11 border-luhya-navy/20 text-luhya-navy">
                      <a href={constitutionUrl} download="MULEMBE COMMUNITY NSW INC CONSTITUTION (2026).pdf"><Download aria-hidden="true" />Download PDF</a>
                    </Button>
                  </div>
                  <iframe src={`${constitutionUrl}#navpanes=0&view=FitH&zoom=page-width`} title="MULEMBE COMMUNITY NSW INC CONSTITUTION (2026)" className="block h-[70vh] min-h-[420px] max-h-[800px] w-full border-0 bg-slate-100" />
                  <div className="space-y-4 border-t border-slate-200 bg-white p-4 sm:p-5">
                    <p className="text-sm leading-relaxed text-slate-600">Read through the document, then return to the acknowledgement below. If your browser cannot display the preview, use Download PDF to read a copy.</p>
                    <Button type="button" variant="outline" onClick={closePreview} className="h-auto min-h-11 whitespace-normal text-luhya-navy"><ArrowLeft aria-hidden="true" />Back to acknowledgement</Button>
                  </div>
                </section>
              )}
              <label htmlFor={`${id}-constitutionConsent`} className={`flex items-start gap-3 rounded-xl border p-4 ${constitutionConsent ? "border-luhya-green bg-luhya-green/5" : "border-slate-200"}`}>
                <input ref={consentRef} id={`${id}-constitutionConsent`} type="checkbox" required disabled={!constitutionOpened} checked={constitutionConsent} onChange={(event) => setConstitutionConsent(event.target.checked)} aria-describedby={`${id}-constitution-help`} aria-invalid={Boolean(errors.constitutionConsent)} className="mt-1 h-5 w-5 shrink-0 accent-luhya-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-luhya-green" />
                <span className="text-sm leading-relaxed text-luhya-navy">I confirm that I have read the Mulembe Community NSW Inc Constitution (2026) before submitting my expression of interest.</span>
              </label>
              <p id={`${id}-constitution-help`} className="text-sm text-slate-500">{constitutionOpened ? "After reading the document, tick the acknowledgement above to continue." : "Open the constitution first to enable the acknowledgement."}</p>
              <p className="text-sm text-slate-500">Formal nominations follow the process in the constitution.</p>
            </div>
          )}

          {step === 1 && (
            <fieldset className="mt-5 min-w-0" aria-describedby={`${id}-positions-help`}>
              <legend className="sr-only">Leadership positions (required)</legend>
              <p id={`${id}-positions-help`} className="mb-5 leading-relaxed text-slate-600">Select one or more positions that interest you. Read each role below to choose how you would like to support the community.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {LEADERSHIP_ROLES.map((role) => (
                  <label key={role.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors hover:border-luhya-green/70 ${positions.includes(role.id) ? "border-luhya-green bg-luhya-green/5" : "border-slate-200 bg-white"}`}>
                    <input type="checkbox" name="positions" value={role.id} checked={positions.includes(role.id)} onChange={() => togglePosition(role.id)} aria-describedby={`${id}-${role.id}-description`} className="mt-1 h-5 w-5 shrink-0 accent-luhya-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-luhya-green" />
                    <span>
                      <span className="block font-semibold text-luhya-navy">{role.title}</span>
                      <span id={`${id}-${role.id}-description`} className="mt-1 block text-sm leading-relaxed text-slate-600">{role.description}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p aria-live="polite" className="mt-4 text-sm font-medium text-luhya-green">{positions.length === 0 ? "Choose at least one position to continue." : `${positions.length} ${positions.length === 1 ? "position" : "positions"} selected`}</p>
            </fieldset>
          )}

          {step === 2 && (
            <div className="mt-5 space-y-6">
              <p className="text-slate-600">All fields are required. Please check your details so the team can contact you.</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor={`${id}-fullName`} className="text-sm font-semibold text-luhya-navy">Full name</label>
                  <input id={`${id}-fullName`} name="fullName" type="text" autoComplete="name" required maxLength={160} value={details.fullName} onChange={(event) => setDetails((current) => ({ ...current, fullName: event.target.value }))} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? `${id}-fullName-error` : undefined} className={INPUT_CLASS} />
                  {fieldError("fullName")}
                </div>
                <div>
                  <label htmlFor={`${id}-dateOfBirth`} className="text-sm font-semibold text-luhya-navy">Date of birth</label>
                  <input id={`${id}-dateOfBirth`} name="dateOfBirth" type="date" autoComplete="bday" required max={todayInSydney()} value={details.dateOfBirth} onChange={(event) => setDetails((current) => ({ ...current, dateOfBirth: event.target.value }))} aria-invalid={Boolean(errors.dateOfBirth)} aria-describedby={errors.dateOfBirth ? `${id}-dateOfBirth-error` : undefined} className={`${INPUT_CLASS} min-w-0`} />
                  {fieldError("dateOfBirth")}
                </div>
                <div>
                  <label htmlFor={`${id}-phone`} className="text-sm font-semibold text-luhya-navy">Phone number</label>
                  <PhoneInput id={`${id}-phone`} name="phone" required value={details.phone} onChange={(phone) => setDetails((current) => ({ ...current, phone }))} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? `${id}-phone-error` : undefined} className="mt-2" fieldClassName={INPUT_CLASS.replace("mt-2 block w-full ", "")} />
                  {fieldError("phone")}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`${id}-email`} className="text-sm font-semibold text-luhya-navy">Email address</label>
                  <input id={`${id}-email`} name="email" type="email" autoComplete="email" required maxLength={254} value={details.email} onChange={(event) => setDetails((current) => ({ ...current, email: event.target.value }))} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? `${id}-email-error` : undefined} className={INPUT_CLASS} />
                  {fieldError("email")}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`${id}-address`} className="text-sm font-semibold text-luhya-navy">Address</label>
                  <textarea id={`${id}-address`} name="address" autoComplete="street-address" required maxLength={1000} rows={3} value={details.address} onChange={(event) => setDetails((current) => ({ ...current, address: event.target.value }))} aria-invalid={Boolean(errors.address)} aria-describedby={`${id}-address-help${errors.address ? ` ${id}-address-error` : ""}`} className={`${INPUT_CLASS} resize-y`} />
                  <p id={`${id}-address-help`} className="mt-2 text-xs text-slate-500">Include your street, suburb/city, state, postcode and country.</p>
                  {fieldError("address")}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-luhya-navy">Your selected positions</p>
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="Selected positions">
                  {LEADERSHIP_ROLES.filter((role) => positions.includes(role.id)).map((role) => <li key={role.id} className="rounded-full border border-luhya-green/20 bg-white px-3 py-1.5 text-sm text-luhya-green">{role.title}</li>)}
                </ul>
                <p className="mt-4 flex items-start gap-2 text-sm text-slate-600"><Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-luhya-green" />You have confirmed reading the 2026 constitution.</p>
              </div>
              <div>
                <label htmlFor={`${id}-motivation`} className="text-sm font-semibold text-luhya-navy">
                  {positions.length > 1 ? "Why would you like to serve in these roles?" : "Why would you like to serve in this role?"} <span aria-hidden="true">*</span>
                </label>
                <textarea id={`${id}-motivation`} name="motivation" required maxLength={2000} rows={6} value={details.motivation} onChange={(event) => setDetails((current) => ({ ...current, motivation: event.target.value }))} placeholder="Share your experience, ideas and what you can bring to the community." aria-invalid={Boolean(errors.motivation)} aria-describedby={`${id}-motivation-help${errors.motivation ? ` ${id}-motivation-error` : ""}`} className={`${INPUT_CLASS} resize-y`} />
                <div id={`${id}-motivation-help`} className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                  <span>{positions.length > 1 ? "Please cover each of your selected roles in your statement." : "Tell us what motivates you and how you would contribute."}</span>
                  <span>{details.motivation.length.toLocaleString()} / 2,000 characters</span>
                </div>
                {fieldError("motivation")}
              </div>
              <p className="text-sm leading-relaxed text-slate-600">Your details, selected positions and statement will be emailed to <a className="break-all font-medium text-luhya-green underline underline-offset-4" href={`mailto:${EMAIL}`}>{EMAIL}</a> for the Mulembe team to review and contact you about next steps.</p>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            {step > 0 ? <Button type="button" variant="outline" className="h-12 px-6" onClick={() => goToStep(step - 1)}><ArrowLeft aria-hidden="true" />Back</Button> : <span className="hidden sm:block" />}
            <Button type="submit" disabled={submitting || (step === 0 && (!constitutionOpened || !constitutionConsent))} className="h-auto min-h-12 whitespace-normal bg-luhya-green px-6 py-3 text-white hover:bg-luhya-green/90">
              {submitting ? <><Loader2 aria-hidden="true" className="animate-spin" />Submitting…</> : step === 2 ? <>Submit expression of interest<Send aria-hidden="true" /></> : <>Continue<ArrowRight aria-hidden="true" /></>}
            </Button>
          </div>
        </fieldset>
        <p role="status" className="sr-only">{submitting ? "Submitting your expression of interest. Please wait." : ""}</p>
        {submitError && <p className="mt-5 text-sm text-slate-600">Need help? Email <a className="break-all text-luhya-green underline underline-offset-4" href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p>}
      </div>
    </form>
  );
};

export default LeadershipInterestForm;

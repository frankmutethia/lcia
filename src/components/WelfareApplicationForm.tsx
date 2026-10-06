import { Input } from "@/components/ui/input";
import PhoneInput from "@/components/PhoneInput";
import { opensPdfExternally } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle2, ArrowRight, Lock, FileText, Eye, Download, ArrowLeft } from "lucide-react";
import welfareConstitutionUrl from "@/assets/MULEMBE WELFARE CONSTITUTION.pdf?url";
import { COMMUNITY_REGISTRATION_FEE, WELFARE_CONTRIBUTION, JOINING_TOTAL, WELFARE_JOINING_PAYMENT_URL } from "@/constants/welfare";
import { useState, useRef, useEffect } from "react";
import type React from "react";

// Eligible beneficiaries under Article 9 of the Welfare Constitution. Values are sent as-is in the email.
const BENEFICIARY_RELATIONSHIPS = [
  "Father (biological)",
  "Mother (biological)",
  "Stepparent / Legal guardian",
  "Spouse",
  "Child",
  "Sibling (same biological mother)",
] as const;

const BENEFICIARY_COUNT = 5;

// Matches the form's other inputs.
const PHONE_FIELD_CLASS = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-luhya-gold/30 focus:border-luhya-gold";

const createEmptyBeneficiary = () => ({
  firstName: "",
  middleName: "",
  surname: "",
  phone: "",
  relationship: "",
});

const createEmptyNextOfKin = () => ({
  firstName: "",
  middleName: "",
  surname: "",
  phone: "",
});

const createEmptyForm = () => ({
  // Applicant Details
  firstName: '',
  middleName: '',
  surname: '',
  email: '',
  street: '',
  suburb: '',
  state: '',
  postcode: '',
  country: 'Australia',
  phone: '',
  nextOfKin: createEmptyNextOfKin(),
  beneficiaries: Array(BENEFICIARY_COUNT).fill(null).map(() => createEmptyBeneficiary()),
  // Signature and declarations
  signature: '',
  constitutionConsent: false,
  privacyConsent: false,
});

const WelfareApplicationForm = () => {
  const FORM_ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT || '/form-submit.php';
  const [formData, setFormData] = useState(createEmptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Like the leadership form: the constitution must be opened before it can be acknowledged.
  const [constitutionOpened, setConstitutionOpened] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const previewRef = useRef<HTMLElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!previewVisible) return;
    previewRef.current?.focus({ preventScroll: true });
    previewRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [previewVisible]);

  const openConstitution = () => {
    setConstitutionOpened(true);
    if (opensPdfExternally()) {
      window.open(welfareConstitutionUrl, "_blank", "noopener");
      return;
    }
    if (previewVisible) previewRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    setPreviewVisible(true);
  };

  const closeConstitution = () => {
    setPreviewVisible(false);
    consentRef.current?.focus({ preventScroll: true });
    consentRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const signatureRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Ensure crisp drawing on high-DPI screens and when resizing
  const resizeCanvasForDPR = () => {
    const canvas = signatureRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
  };

  // Initialize once and on resize
  useEffect(() => {
    resizeCanvasForDPR();
    const onResize = () => {
      // Preserve last drawing on resize by restoring top of history if present
      const last = history[history.length - 1];
      resizeCanvasForDPR();
      if (last) {
        const canvas = signatureRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = last;
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextOfKinChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      nextOfKin: { ...prev.nextOfKin, [field]: value },
    }));
  };

  const handleBeneficiaryChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      beneficiaries: prev.beneficiaries.map((beneficiary, i) =>
        i === index ? { ...beneficiary, [field]: value } : beneficiary
      )
    }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  // Signature pad functionality
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = signatureRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save snapshot for undo before a new stroke
    try {
      const snap = canvas.toDataURL('image/png');
      setHistory(prev => [...prev, snap].slice(-20));
    } catch {
      // Ignore errors when saving snapshot
    }

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = signatureRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = signatureRef.current;
    if (!canvas) return;

    const signatureDataUrl = canvas.toDataURL();
    setFormData(prev => ({ ...prev, signature: signatureDataUrl }));
  };

  // Touch support (mobile) with scroll prevention
  const getTouchPos = (touch: React.Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = signatureRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save snapshot for undo
    try {
      const snap = canvas.toDataURL('image/png');
      setHistory(prev => [...prev, snap].slice(-20));
    } catch {
      // Ignore errors when saving snapshot
    }

    const t = e.touches[0];
    const { x, y } = getTouchPos(t, canvas);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = signatureRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const t = e.touches[0];
    const { x, y } = getTouchPos(t, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
    const canvas = signatureRef.current;
    if (!canvas) return;
    const signatureDataUrl = canvas.toDataURL();
    setFormData(prev => ({ ...prev, signature: signatureDataUrl }));
  };

  const clearSignature = () => {
    const canvas = signatureRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFormData(prev => ({ ...prev, signature: '' }));
  };

  const undoSignature = () => {
    const canvas = signatureRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const prev = history[history.length - 1];
    if (!prev) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setHistory(h => h.slice(0, -1));
      setFormData(f => ({ ...f, signature: canvas.toDataURL() }));
    };
    img.src = prev;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.constitutionConsent || !formData.privacyConsent) {
      alert('Please check both consent boxes to submit the form.');
      return;
    }

    const payload = {
      applicant: {
        firstName: formData.firstName,
        middleName: formData.middleName,
        surname: formData.surname,
        email: formData.email,
        street: formData.street,
        suburb: formData.suburb,
        state: formData.state,
        postcode: formData.postcode,
        country: formData.country,
        phone: formData.phone,
      },
      beneficiaries: formData.beneficiaries.filter(ben =>
        ben.firstName && ben.surname
      ),
      nextOfKin: formData.nextOfKin,
      signature: formData.signature,
      constitutionConsent: formData.constitutionConsent,
      privacyConsent: formData.privacyConsent,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({})) as { message?: string };
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setFormData(createEmptyForm());
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(`There was a problem submitting your application. Please try again.\n${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div id="welfare-form" className="bg-white p-6 sm:p-10 rounded-xl sm:rounded-2xl border border-luhya-gold/20 shadow-[var(--shadow-clean)] text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-luhya-green" />
        <h3 className="mt-4 text-xl sm:text-2xl font-bold text-luhya-navy">Application received</h3>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Thank you. Your application has been sent to the Mulembe Community NSW team. One last step: pay your joining
          contribution. Your membership starts once your payment is received.
        </p>
        <div className="mx-auto mt-6 max-w-sm rounded-lg border border-luhya-gold/30 bg-luhya-gold/10 p-4 text-left text-sm sm:text-base">
          <div className="flex justify-between py-1 text-luhya-navy"><span>Community registration fee</span><span>${COMMUNITY_REGISTRATION_FEE}</span></div>
          <div className="flex justify-between py-1 text-luhya-navy"><span>Welfare contribution</span><span>${WELFARE_CONTRIBUTION}</span></div>
          <div className="mt-2 flex justify-between border-t border-luhya-gold/40 pt-2 font-bold text-luhya-navy"><span>Total (AUD)</span><span>${JOINING_TOTAL}</span></div>
        </div>
        {WELFARE_JOINING_PAYMENT_URL ? (
          <>
            <Button asChild variant="community" size="lg" className="group mt-6">
              <a href={WELFARE_JOINING_PAYMENT_URL} target="_blank" rel="noopener noreferrer">
                Pay ${JOINING_TOTAL} now
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-muted-foreground"><Lock className="w-3.5 h-3.5" /> Secure checkout powered by Stripe</p>
          </>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">The committee will send you a secure payment link shortly.</p>
        )}
      </div>
    );
  }

  return (
        <div id="welfare-form" className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-luhya-gold/20 shadow-[var(--shadow-clean)]">
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-luhya-navy">Mulembe Community NSW<br />Welfare Membership Form</h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
                Complete this form to join our community and access welfare benefits. All information will be kept confidential.
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                {/* Applicant Details Section */}
                <div className="bg-gradient-to-r from-luhya-navy to-luhya-gold p-3 sm:p-4 rounded-t-lg">
                  <h4 className="text-lg sm:text-xl font-bold text-white">Applicant Details</h4>
                </div>
                <div className="bg-white border border-luhya-gold/30 rounded-b-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                      <div className="space-y-2">
                      <Label className="text-luhya-navy font-medium">First/Given Name *</Label>
                        <Input
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                        required
                          className="border-luhya-gold/30 focus:border-luhya-gold"
                        />
                      </div>
                      <div className="space-y-2">
                      <Label className="text-luhya-navy font-medium">Middle Name</Label>
                        <Input
                        name="middleName"
                        value={formData.middleName}
                          onChange={handleInputChange}
                          className="border-luhya-gold/30 focus:border-luhya-gold"
                        />
                    </div>
                      <div className="space-y-2">
                      <Label className="text-luhya-navy font-medium">Surname/Family Name *</Label>
                        <Input
                        name="surname"
                        value={formData.surname}
                        onChange={handleInputChange}
                          required
                          className="border-luhya-gold/30 focus:border-luhya-gold"
                        />
                      </div>
                      <div className="space-y-2">
                      <Label className="text-luhya-navy font-medium">Email *</Label>
                        <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                          required
                          className="border-luhya-gold/30 focus:border-luhya-gold"
                        />
                      </div>
                    </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-luhya-navy font-medium text-sm sm:text-base">Street Address *</Label>
                      <Input
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        required
                        className="border-luhya-gold/30 focus:border-luhya-gold text-sm sm:text-base"
                      />
                    </div>
                      <div className="space-y-2">
                      <Label className="text-luhya-navy font-medium text-sm sm:text-base">Suburb/Town *</Label>
                      <Input
                        name="suburb"
                        value={formData.suburb}
                        onChange={handleInputChange}
                        required
                        className="border-luhya-gold/30 focus:border-luhya-gold text-sm sm:text-base"
                      />
                      </div>
                      <div className="space-y-2">
                      <Label className="text-luhya-navy font-medium text-sm sm:text-base">State/Territory *</Label>
                      <Input
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        className="border-luhya-gold/30 focus:border-luhya-gold text-sm sm:text-base"
                      />
                      </div>
                      <div className="space-y-2">
                      <Label className="text-luhya-navy font-medium text-sm sm:text-base">Postcode *</Label>
                      <Input
                        name="postcode"
                        value={formData.postcode}
                        onChange={handleInputChange}
                        required
                        className="border-luhya-gold/30 focus:border-luhya-gold text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-luhya-navy font-medium">Country *</Label>
                      <Input
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        required
                        className="border-luhya-gold/30 focus:border-luhya-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-luhya-navy font-medium">Phone *</Label>
                      <PhoneInput
                        name="phone"
                        value={formData.phone}
                        onChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
                        required
                        fieldClassName={PHONE_FIELD_CLASS}
                      />
                    </div>
                  </div>
                    </div>

                {/* Beneficiary Eligibility */}
                <div className="bg-gradient-to-r from-luhya-red/10 to-luhya-gold/10 border border-luhya-red/20 rounded-xl p-4 sm:p-6">
                  <h4 className="text-lg sm:text-xl font-bold text-luhya-red mb-3">Beneficiary Eligibility</h4>
                  <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                    <p>
                      A beneficiary is only someone who meets the strict eligibility rules set out in the welfare policy.
                      These rules cannot be changed or expanded.
                    </p>
                    <p className="font-medium text-luhya-navy">To qualify as a beneficiary:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>
                        <span className="font-medium text-luhya-navy">Biological parents</span> are the primary beneficiaries.
                        Use <span className="font-medium">Father (biological)</span> or <span className="font-medium">Mother (biological)</span> when listing them below.
                      </li>
                      <li>
                        <span className="font-medium text-luhya-navy">Next of Kin</span> receives the payout if biological parents are unavailable.
                        Nominate your Next of Kin in the section below.
                      </li>
                      <li>
                        <span className="font-medium text-luhya-navy">A stepparent or legal guardian</span>, only if the relationship began before you turned 17.
                      </li>
                      <li>
                        <span className="font-medium text-luhya-navy">Your spouse</span>, <span className="font-medium text-luhya-navy">your children</span>, and
                        <span className="font-medium text-luhya-navy"> brothers and sisters who share your biological mother</span>.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Next of Kin */}
                <div className="bg-gradient-to-r from-luhya-navy to-luhya-gold p-3 sm:p-4 rounded-t-lg">
                  <h4 className="text-lg sm:text-xl font-bold text-white">Next of Kin</h4>
                </div>
                <div className="bg-white border border-luhya-gold/30 rounded-b-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    If biological parents are unavailable, the payout goes to the Next of Kin listed here.
                    Please provide accurate contact details.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-luhya-navy font-medium">First/Given Name</Label>
                      <Input
                        value={formData.nextOfKin.firstName}
                        onChange={(e) => handleNextOfKinChange("firstName", e.target.value)}
                        className="border-luhya-gold/30 focus:border-luhya-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-luhya-navy font-medium">Middle Name</Label>
                      <Input
                        value={formData.nextOfKin.middleName}
                        onChange={(e) => handleNextOfKinChange("middleName", e.target.value)}
                        className="border-luhya-gold/30 focus:border-luhya-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-luhya-navy font-medium">Surname/Family Name</Label>
                      <Input
                        value={formData.nextOfKin.surname}
                        onChange={(e) => handleNextOfKinChange("surname", e.target.value)}
                        className="border-luhya-gold/30 focus:border-luhya-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-luhya-navy font-medium">Phone</Label>
                      <PhoneInput
                        value={formData.nextOfKin.phone}
                        onChange={(phone) => handleNextOfKinChange("phone", phone)}
                        fieldClassName={PHONE_FIELD_CLASS}
                      />
                    </div>
                  </div>
                </div>

                {/* Welfare Beneficiaries Section */}
                <div className="bg-gradient-to-r from-luhya-navy to-luhya-gold p-3 sm:p-4 rounded-t-lg">
                  <h4 className="text-lg sm:text-xl font-bold text-white">Welfare Beneficiaries (5 Family Members)</h4>
                </div>
                <div className="bg-white border border-luhya-gold/30 rounded-b-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {formData.beneficiaries.map((beneficiary, index) => (
                    <div key={index} className="border border-luhya-gold/20 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <span className="bg-luhya-gold text-luhya-navy px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold">
                          #{index + 1}
                        </span>
                        <span className="font-semibold text-sm sm:text-base text-luhya-navy">Beneficiary</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label className="text-luhya-navy font-medium">First/Given Name</Label>
                          <Input
                            value={beneficiary.firstName}
                            onChange={(e) => handleBeneficiaryChange(index, 'firstName', e.target.value)}
                            className="border-luhya-gold/30 focus:border-luhya-gold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-luhya-navy font-medium">Middle Name</Label>
                          <Input
                            value={beneficiary.middleName}
                            onChange={(e) => handleBeneficiaryChange(index, 'middleName', e.target.value)}
                            className="border-luhya-gold/30 focus:border-luhya-gold"
                          />
                        </div>
                    <div className="space-y-2">
                          <Label className="text-luhya-navy font-medium">Surname/Family Name</Label>
                          <Input
                            value={beneficiary.surname}
                            onChange={(e) => handleBeneficiaryChange(index, 'surname', e.target.value)}
                            className="border-luhya-gold/30 focus:border-luhya-gold"
                          />
                    </div>
                  </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                        <div className="space-y-2">
                          <Label className="text-luhya-navy font-medium text-sm sm:text-base">Phone</Label>
                          <PhoneInput
                            value={beneficiary.phone}
                            onChange={(phone) => handleBeneficiaryChange(index, 'phone', phone)}
                            fieldClassName={`${PHONE_FIELD_CLASS} sm:text-base`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-luhya-navy font-medium text-sm sm:text-base">Relationship</Label>
                          <Select value={beneficiary.relationship} onValueChange={(value) => handleBeneficiaryChange(index, 'relationship', value)}>
                            <SelectTrigger className="border-luhya-gold/30 focus:border-luhya-gold text-sm sm:text-base">
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              {BENEFICIARY_RELATIONSHIPS.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Signature Section */}
                <div className="bg-gradient-to-r from-luhya-navy to-luhya-gold p-3 sm:p-4 rounded-t-lg">
                  <h4 className="text-lg sm:text-xl font-bold text-white">Signature</h4>
                </div>
                <div className="bg-white border border-luhya-gold/30 rounded-b-lg p-4 sm:p-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4">
                    <p className="text-center text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Please sign below</p>
                    <canvas
                      ref={signatureRef}
                      width={800}
                      height={200}
                      className="border border-gray-300 rounded-lg w-full touch-none"
                      style={{ minHeight: '150px', maxHeight: '200px' }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawingTouch}
                      onTouchMove={drawTouch}
                      onTouchEnd={stopDrawingTouch}
                    />
                    <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-4">
                      <Button type="button" variant="outline" onClick={clearSignature} className="w-full sm:w-auto text-sm">
                        Clear
                      </Button>
                      <Button type="button" variant="outline" onClick={undoSignature} className="w-full sm:w-auto text-sm">
                        Undo
                      </Button>
                      </div>
                    </div>
                  </div>

                {/* Declarations Section */}
                <div className="bg-gradient-to-r from-luhya-navy to-luhya-gold p-3 sm:p-4 rounded-t-lg">
                  <h4 className="text-lg sm:text-xl font-bold text-white">Declarations</h4>
                </div>
                <div className="bg-white border border-luhya-gold/30 rounded-b-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {/* Welfare Constitution: open it to enable the acknowledgement below */}
                  <div className="rounded-lg border border-luhya-gold/30 bg-luhya-cream/40 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <FileText aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-luhya-green" />
                      <div className="min-w-0">
                        <h5 className="font-semibold text-luhya-navy">MULEMBE WELFARE CONSTITUTION</h5>
                        <p className="mt-1 text-sm text-muted-foreground">Version 1.0 · PDF · Read here or download a copy</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openConstitution}
                      aria-expanded={previewVisible}
                      aria-controls="welfare-constitution-preview"
                      className="mt-4 w-full sm:w-auto gap-2 border-luhya-green text-luhya-green"
                    >
                      <Eye className="w-4 h-4" aria-hidden="true" />
                      View the constitution
                    </Button>
                  </div>
                  {previewVisible && (
                    <section
                      ref={previewRef}
                      id="welfare-constitution-preview"
                      tabIndex={-1}
                      aria-label="Welfare Constitution preview"
                      className="scroll-mt-24 overflow-hidden rounded-lg border border-luhya-gold/30 focus:outline-none"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-luhya-gold/20 bg-white p-3 sm:p-4">
                        <div>
                          <div className="font-semibold text-luhya-navy">Constitution preview</div>
                          <div className="text-xs text-muted-foreground">Mulembe Welfare Association NSW · Version 1.0</div>
                        </div>
                        <Button asChild type="button" variant="outline" className="gap-2">
                          <a href={welfareConstitutionUrl} download="MULEMBE WELFARE CONSTITUTION.pdf">
                            <Download className="w-4 h-4" aria-hidden="true" />
                            Download PDF
                          </a>
                        </Button>
                      </div>
                      <iframe
                        src={`${welfareConstitutionUrl}#navpanes=0&view=FitH&zoom=page-width`}
                        title="MULEMBE WELFARE CONSTITUTION"
                        className="block h-[70vh] min-h-[420px] max-h-[800px] w-full border-0 bg-gray-100"
                      />
                      <div className="space-y-3 border-t border-luhya-gold/20 bg-white p-3 sm:p-4">
                        <p className="text-sm text-muted-foreground">
                          Read through the document, then return to the acknowledgement below. If your browser cannot display
                          the preview, use Download PDF to read a copy.
                        </p>
                        <Button type="button" variant="outline" onClick={closeConstitution} className="gap-2">
                          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                          Back to acknowledgement
                        </Button>
                      </div>
                    </section>
                  )}
                  <div className={`bg-luhya-gold/10 p-4 rounded-lg border-l-4 border-luhya-gold ${constitutionOpened ? "" : "opacity-70"}`}>
                    <div className="flex items-start gap-3">
                      <input
                        ref={consentRef}
                        type="checkbox"
                        id="constitutionConsent"
                        checked={formData.constitutionConsent}
                        onChange={(e) => handleCheckboxChange('constitutionConsent', e.target.checked)}
                        className="mt-1"
                        required
                        disabled={!constitutionOpened}
                        aria-describedby="constitution-consent-help"
                      />
                      <label htmlFor="constitutionConsent" className="text-sm text-luhya-navy">
                        I confirm I have read and understood the Welfare Constitution and agree to abide by it.
                            </label>
                          </div>
                    {!constitutionOpened && (
                      <p id="constitution-consent-help" className="mt-2 pl-7 text-xs text-muted-foreground">
                        Open the constitution above first to enable this acknowledgement.
                      </p>
                    )}
                        </div>
                  
                  <div className="bg-luhya-gold/10 p-4 rounded-lg border-l-4 border-luhya-gold">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="privacyConsent"
                        checked={formData.privacyConsent}
                        onChange={(e) => handleCheckboxChange('privacyConsent', e.target.checked)}
                        className="mt-1"
                        required
                      />
                      <label htmlFor="privacyConsent" className="text-sm text-luhya-navy">
                        I consent to my personal information being collected, stored, and used for membership administration in accordance with the Privacy Notice below.
                      </label>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500">These must be checked to submit.</p>
                </div>

                {/* Privacy Notice */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h5 className="font-semibold text-luhya-navy mb-2">Privacy Notice</h5>
                  <p className="text-sm text-gray-600">
                    The Association collects personal information to administer membership and welfare beneficiary records. 
                    Your data will be stored securely and only used for lawful purposes related to the Association's functions. 
                    You may request access to, or correction of, your information by contacting the Secretary.
                  </p>
                  </div>

                  {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 sm:pt-6 border-t-4 border-luhya-gold">
                  <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => window.print()}>
                    Print / Save as PDF
                  </Button>
                    <Button type="submit" variant="community" size="lg" className="group w-full sm:w-auto" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting…' : 'Submit'}
                      <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </form>
            </div>
          </div>
  );
};

export default WelfareApplicationForm;

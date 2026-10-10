import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Users, DollarSign, Shield, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type React from "react";
import WelfareConstitution from "@/components/WelfareConstitution";

const BENEFICIARY_RELATIONSHIPS = [
  { value: "kin", label: "Kin" },
  { value: "mother", label: "Mother" },
  { value: "father", label: "Father" },
  { value: "child", label: "Child" },
  { value: "sibling", label: "Sibling" },
  { value: "partner", label: "Partner" },
] as const;

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

const Welfare = () => {
  const FORM_ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT || '/form-submit.php';
  const [formData, setFormData] = useState({
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
    // Beneficiaries (5 family members)
    beneficiaries: Array(5).fill(null).map(() => createEmptyBeneficiary()),
    // Signature and declarations
    signature: '',
    constitutionConsent: false,
    privacyConsent: false,
  });

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

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({})) as { message?: string };
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      alert('Thank you for your registration! Your form has been submitted successfully to the Mulembe Community NSW team. We will contact you soon.');
      // Reset form
      setFormData({
        firstName: '', middleName: '', surname: '', email: '', street: '', suburb: '', state: '', postcode: '', country: 'Australia', phone: '',
        nextOfKin: createEmptyNextOfKin(),
        beneficiaries: Array(5).fill(null).map(() => createEmptyBeneficiary()),
        signature: '', constitutionConsent: false, privacyConsent: false,
      });
    } catch (err) {
      alert(`There was a problem submitting your application. Please try again.\n${(err as Error).message}`);
    }
  };
  const welfareServices = [
    {
      icon: Heart,
      title: "Bereavement Support",
      description: "Financial and emotional support during times of loss and bereavement",
      highlight: true
    },
    {
      icon: DollarSign,
      title: "Financial Assistance",
      description: "Emergency financial support for community members in need"
    },
    {
      icon: Users,
      title: "Family Support",
      description: "Support for families during difficult times and life transitions"
    },
    {
      icon: Shield,
      title: "Community Care",
      description: "Mutual aid and support network for all community members"
    }
  ];

  const supportProcess = [
    {
      step: "1",
      title: "Contact Us",
      description: "Reach out through our community channels or leadership team"
    },
    {
      step: "2",
      title: "Support Provided",
      description: "Receive the assistance you need with dignity and respect"
    }
  ];

  return (
    <section id="welfare" className="py-20 bg-gradient-to-b from-luhya-cream/30 to-white scroll-mt-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-luhya-red to-luhya-green bg-clip-text text-transparent">
              🌿 Welfare Fund
            </span>
          </h2>
          <h3 className="text-xl md:text-2xl font-semibold text-luhya-navy mb-6">
            Standing Together in Times of Need
          </h3>
          <div className="text-lg text-muted-foreground max-w-4xl mx-auto space-y-4">
            <p>
              Life in a new country brings joy and opportunity, but it can also bring challenges we never expect. 
              In moments of loss, being far from home makes everything feel heavier. As a community, we believe 
              no member should walk that journey alone.
            </p>
            <p>
              The Mulembe Community NSW Welfare Fund was created so that when difficult times arise, we can stand 
              together in strength and compassion. Through member contributions and donations, the fund provides 
              financial and emotional support to families during bereavement.
            </p>
          </div>
        </div>

        {/* Support Coverage */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center text-luhya-navy">This support can help cover urgent costs such as:</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {welfareServices.map((service, index) => (
              <Card key={index} className={`group hover:shadow-[var(--shadow-clean)] transition-all duration-300 ${
                service.highlight 
                  ? 'border-luhya-red/30 bg-gradient-to-br from-luhya-red/5 to-luhya-gold/5' 
                  : 'border-luhya-gold/20'
              }`}>
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 ${
                    service.highlight
                      ? 'bg-gradient-to-br from-luhya-red to-luhya-gold'
                      : 'bg-gradient-to-br from-luhya-gold to-luhya-green'
                  }`}>
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h4 className={`font-semibold text-lg mb-3 ${
                    service.highlight ? 'text-luhya-red' : 'text-luhya-navy'
                  }`}>
                    {service.title}
                  </h4>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Philosophy Section */}
        <div className="mb-16 bg-gradient-to-r from-luhya-gold/10 to-luhya-green/10 p-8 rounded-2xl border border-luhya-gold/20">
          <div className="text-center max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-luhya-navy">Our Philosophy</h3>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                Joining the Welfare Fund is not about expecting loss—it's about preparing with wisdom, unity, and love. 
                It is a way of saying: <span className="font-semibold text-luhya-gold">"When life becomes heavy, your community will carry part of the weight with you."</span>
              </p>
              <p>
                Together we carry the weight, together we find strength.
              </p>
            </div>
          </div>
        </div>

        {/* Support Process */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center text-luhya-navy">How Our Support Works</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {supportProcess.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-luhya-navy to-luhya-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">{step.step}</span>
                </div>
                <h4 className="font-semibold text-lg mb-2 text-luhya-navy">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Comprehensive Membership Application Form */}
        <div id="welfare-form" className="mt-12 sm:mt-16 bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-luhya-gold/20 shadow-[var(--shadow-clean)]">
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-luhya-navy">Mulembe Community NSW<br />Welfare Membership Form</h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
                Complete this form to join our community and access welfare benefits. All information will be kept confidential.
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <WelfareConstitution />
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
                      <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+61 ..."
                        required
                        className="border-luhya-gold/30 focus:border-luhya-gold"
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
                        Use <span className="font-medium">Mother</span> or <span className="font-medium">Father</span> when listing them below.
                      </li>
                      <li>
                        <span className="font-medium text-luhya-navy">Next of Kin</span> receives the payout if biological parents are unavailable.
                        Nominate your Next of Kin in the section below.
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
                      <Input
                        value={formData.nextOfKin.phone}
                        onChange={(e) => handleNextOfKinChange("phone", e.target.value)}
                        placeholder="+61 ..."
                        className="border-luhya-gold/30 focus:border-luhya-gold"
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
                          <Input
                            value={beneficiary.phone}
                            onChange={(e) => handleBeneficiaryChange(index, 'phone', e.target.value)}
                            placeholder="+61 ..."
                            className="border-luhya-gold/30 focus:border-luhya-gold text-sm sm:text-base"
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
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
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
                  <div className="bg-luhya-gold/10 p-4 rounded-lg border-l-4 border-luhya-gold">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="constitutionConsent"
                        checked={formData.constitutionConsent}
                        onChange={(e) => handleCheckboxChange('constitutionConsent', e.target.checked)}
                        className="mt-1"
                        required
                      />
                      <label htmlFor="constitutionConsent" className="text-sm text-luhya-navy">
                        I confirm I have read and understood the Welfare Constitution and agree to abide by it.
                            </label>
                          </div>
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
                  <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto">
                    Print / Save as PDF
                  </Button>
                    <Button type="submit" variant="community" size="lg" className="group w-full sm:w-auto">
                    Submit
                      <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </form>
            </div>
          </div>
      </div>
    </section>
  );
};

export default Welfare;

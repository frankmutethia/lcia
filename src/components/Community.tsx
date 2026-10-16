import PublishedContent from "@/components/PublishedContent";
import { Button } from "@/components/ui/button";
import { ADDRESS_LINE_1, ADDRESS_LINE_2, EMAIL } from "@/constants/contact";
import { useState } from "react";
import PhoneInput from "@/components/PhoneInput";

const Community = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/form-submit.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "community_registration",
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        alert(
          "Thank you for your interest! We will contact you soon to welcome you to our community.",
        );
        setFormData({ fullName: "", email: "", mobile: "" });
      } else {
        throw new Error("Submission failed");
      }
    } catch {
      alert(
        "There was a problem submitting your registration. Please try again or contact us directly.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="community" className="py-20 bg-white scroll-mt-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Our{" "}
            <span className="bg-gradient-to-r from-luhya-red to-luhya-green bg-clip-text text-transparent">
              Community Members Say
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from our members who have found connection, culture, and
            belonging in the Mulembe Community NSW.
          </p>
        </div>

        <PublishedContent type="testimonial" />

        {/* Registration Form Section */}
        <div
          id="join-form"
          className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-border"
        >
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
              Ready to Join Our Community?
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto px-4">
              We'd love to welcome you to the Mulembe Community NSW. Fill out
              the form below and we'll contact you soon to help you become part
              of our family.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="space-y-2">
                <label
                  htmlFor="fullName"
                  className="text-sm font-medium text-luhya-navy"
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-luhya-gold/30 rounded-lg focus:border-luhya-gold focus:ring-2 focus:ring-luhya-gold/20 focus:outline-none transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-luhya-navy"
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-luhya-gold/30 rounded-lg focus:border-luhya-gold focus:ring-2 focus:ring-luhya-gold/20 focus:outline-none transition-colors"
                  placeholder="Enter your email address"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="mobile"
                  className="text-sm font-medium text-luhya-navy"
                >
                  Mobile Number *
                </label>
                <PhoneInput
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={(mobile) =>
                    setFormData((prev) => ({ ...prev, mobile }))
                  }
                  required
                  fieldClassName="w-full px-4 py-3 bg-white border border-luhya-gold/30 rounded-lg focus:border-luhya-gold focus:ring-2 focus:ring-luhya-gold/20 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="text-center">
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full sm:w-auto px-8 sm:px-12"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Join Our Community"}
              </Button>
            </div>
          </form>

          <div className="text-center text-xs sm:text-sm text-muted-foreground mt-6 sm:mt-8 px-4">
            <p>{ADDRESS_LINE_1}</p>
            <p>{ADDRESS_LINE_2}</p>
            <p>
              <a
                href={`mailto:${EMAIL}`}
                className="break-all underline hover:no-underline"
              >
                {EMAIL}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Community;

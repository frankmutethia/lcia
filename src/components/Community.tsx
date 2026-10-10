import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Quote } from "lucide-react";
import { ADDRESS_LINE_1, ADDRESS_LINE_2, PHONE_DISPLAY, PHONE_TEL, EMAIL } from "@/constants/contact";
import { useState } from "react";
import PhoneInput from "@/components/PhoneInput";

const Community = () => {
  const testimonials = [
    {
      name: "Douglas Marango",
      role: "Community Member",
      content: "At last, we have a community of our own abroad! Being part of Mulembe Community NSW reminds me that even though we are far from Kenya, we have not forgotten our culture. These gatherings feel like home.",
      rating: 5
    },
    {
      name: "Brian Lupia",
      role: "Community Member",
      content: "The meetups are always filled with laughter, stories, and plenty of Kenyan food. Everyone brings something from home, and when we sit together to eat, it feels just like being back in the village.",
      rating: 5
    },
    {
      name: "Daisy",
      role: "Community Member",
      content: "For me, joining these gatherings has been a blessing for my mental health. It calms me, gives me joy, and makes me feel that even though I am away from home, I still have a second family here in Sydney.",
      rating: 5
    },
    {
      name: "Loven",
      role: "Community Member",
      content: "Every time we meet, we not only celebrate our culture but also encourage one another—whether it's supporting businesses, sharing ideas, or simply enjoying each other's company. It's a good initiative that strengthens our unity as Luhyas.",
      rating: 5
    }
  ];

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/form-submit.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'community_registration',
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        alert('Thank you for your interest! We will contact you soon to welcome you to our community.');
        setFormData({ fullName: '', email: '', mobile: '' });
      } else {
        throw new Error('Submission failed');
      }
    } catch {
      alert('There was a problem submitting your registration. Please try again or contact us directly.');
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
            Hear from our members who have found connection, culture, and belonging 
            in the Mulembe Community NSW.
          </p>
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="group hover:shadow-[var(--shadow-clean)] transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-community-warm text-community-warm" />
                  ))}
                </div>
                
                <div className="relative mb-4">
                  <Quote className="absolute -top-2 -left-2 w-8 h-8 text-community-warm-light" />
                  <p className="text-muted-foreground pl-6 italic">
                    "{testimonial.content}"
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-community-warm to-community-sky rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Registration Form Section */}
        <div id="join-form" className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-border">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Ready to Join Our Community?</h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto px-4">
              We'd love to welcome you to the Mulembe Community NSW. Fill out the form below 
              and we'll contact you soon to help you become part of our family.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-luhya-navy">
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
                <label htmlFor="email" className="text-sm font-medium text-luhya-navy">
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
                <label htmlFor="mobile" className="text-sm font-medium text-luhya-navy">
                  Mobile Number *
                </label>
                <PhoneInput
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={(mobile) => setFormData(prev => ({ ...prev, mobile }))}
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
                {isSubmitting ? 'Submitting...' : 'Join Our Community'}
              </Button>
            </div>
          </form>

          <div className="text-center text-xs sm:text-sm text-muted-foreground mt-6 sm:mt-8 px-4">
            <p>{ADDRESS_LINE_1}</p>
            <p>{ADDRESS_LINE_2}</p>
            <p>
              <a href={`tel:${PHONE_TEL}`} className="underline hover:no-underline">{PHONE_DISPLAY}</a>
               <br/>
              <a href={`mailto:${EMAIL}`} className="underline hover:no-underline">{EMAIL}</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Community;

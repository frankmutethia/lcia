import PublishedContent from "@/components/PublishedContent";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, ExternalLink, Instagram } from "lucide-react";
import deesKitchenPoster from "@/assets/WhatsApp Image 2025-09-08 at 1.28.32 PM.jpeg";

const BusinessDirectory = () => {
  const sampleBusinesses = [
    {
      name: "Dee's Kitchen",
      owner: "Dee's Kitchen",
      category: "Food & Catering",
      description: "Super delicious samosas & chapatis. Call to order—catering available.",
      location: "NSW",
      phone: "+61 410 195 794",
      email: "",
      services: ["Samosas", "Chapatis", "Catering", "Bulk Orders"],
      image: deesKitchenPoster,
    },
    
    {
      name: "Pampered Films",
      owner: "",
      partnership: true,
      category: "Professional Services",
      description: "Professional videography and photography services for all occasions",
      location: "Parramatta, NSW",
      phone: "0450495668",
      email: "terence@pamperedfilms.com.au",
      website: "pamperedfilms.com.au",
      services: ["Weddings Videography", "Birthdays Shoots", "Baby Showers", "Portraits", "Family Sessions"]
    },
    {
      name: "Sampler Entertainment",
      owner: "Sampler",
      category: "Professional Services",
      description: "We provide professional DJ services for parties, weddings, and special events. Our goal is to create lasting memories for every occasion",
      location: "NSW",
      instagram: "https://www.instagram.com/pampered_photography?igsh=MTJjZWU3cXZsdGFqdg==",
      services: ["DJ Services", "Public Address System", "Event Entertainment", "Wedding DJ"]
    },
    {
      name: "Modestbeauty",
      owner: "Shaleen Malova",
      category: "Health & Wellness",
      description: "Professional beauty services specializing in lash extensions, eyebrow treatments, and facial care",
      location: "Warwick Farm, NSW",
      phone: "+61 452 109 090",
      email: "modestbeauty4@gmail.com",
      services: ["Lash Extensions", "Eyebrow Lamination & Tinting", "Facials", "Lash Educator"]
    },
    {
      name: "Braids & African Styles with a Touch of Home",
      owner: "Brigid Nanzala",
      category: "Health & Wellness",
      description: "Professional braiding and African hairstyling services with authentic techniques and cultural touch",
      location: "NSW",
      services: ["Box Braids", "Knotless Braids", "Senegalese Twists", "Marley Twists", "Faux Locs", "Passion Twists", "Fulani Braids", "Goddess Braids"]
    },
    {
      name: "Hakuna Matata Movers Company",
      owner: "Hakuna Matata Group",
      category: "Transportation",
      description: "Stress-Free, Reliable, Fast moving services for residential and commercial needs. Get it done Cheap!",
      location: "Mascot NSW",
      phone: "0405248626",
      email: "hakunamatatacompany3@gmail.com",
      services: ["Residential Moving", "Commercial Moving", "Removals"],
      image: "/hakuna-matata-movers.jpg"
    }
  ];


  return (
    <section id="business" className="py-20 bg-gradient-to-b from-white to-luhya-gold/10 scroll-mt-24">
      <div className="container mx-auto px-4 lg:px-8">
        <PublishedContent type="category" />
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            <span className="bg-gradient-to-r from-luhya-navy to-luhya-gold bg-clip-text text-transparent">
              Business Directory
            </span>
          </h2>
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-luhya-navy mb-3 sm:mb-4">
            Support Luhya-owned businesses in NSW
          </h3>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            We rise by lifting each other — find services you can trust from our community members.
          </p>
          
          {/* CTA Buttons removed per request */}
        </div>


        {/* Featured Businesses */}
        <div className="mb-12 sm:mb-16">
          <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center text-luhya-navy">Featured Businesses</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {sampleBusinesses.map((business, index) => (
              <Card key={index} className="group hover:shadow-[var(--shadow-clean)] transition-all duration-300 border-luhya-green/20">
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-4">
                    <h4 className="font-semibold text-xl mb-2 text-luhya-navy group-hover:text-luhya-gold transition-colors">
                      {business.name}
                    </h4>
                    {business.image && (
                      <div className="mb-3 flex justify-center">
                        <img 
                          src={business.image} 
                          alt={business.name}
                          className="max-w-full h-auto max-h-96 object-contain rounded-lg shadow-md bg-gray-50"
                        />
                      </div>
                    )}
                    {business.partnership ? (
                      <p className="text-sm text-luhya-gold font-medium mb-2">Partnership</p>
                    ) : business.owner ? (
                      <p className="text-sm text-luhya-gold font-medium mb-2">Owner: {business.owner}</p>
                    ) : null}
                    <p className="text-sm text-muted-foreground mb-3">{business.description}</p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-luhya-green" />
                      {business.location}
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2 text-luhya-gold" />
                      <a href={`tel:${business.phone}`} className="hover:underline">{business.phone}</a>
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-2 text-luhya-red" />
                      <a href={`mailto:${business.email}`} className="hover:underline">{business.email}</a>
                    </div>
                    {business.website && (
                      <div className="flex items-center text-sm">
                        <ExternalLink className="w-4 h-4 mr-2 text-luhya-gold" />
                        <a href={`https://${business.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-luhya-gold">
                          {business.website}
                        </a>
                      </div>
                    )}
                    {business.instagram && (
                      <div className="flex items-center text-sm">
                        <Instagram className="w-4 h-4 mr-2 text-pink-500" />
                        <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline text-pink-500">
                          Follow on Instagram
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-luhya-navy mb-2">Services:</h5>
                    <div className="flex flex-wrap gap-2">
                      {business.services.map((service, serviceIndex) => (
                        <span key={serviceIndex} className="text-xs bg-luhya-gold/20 text-luhya-gold px-2 py-1 rounded-full">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full group">
                    Contact Business
                    <ExternalLink className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom Call to Action removed per request */}
      </div>
    </section>
  );
};

export default BusinessDirectory;

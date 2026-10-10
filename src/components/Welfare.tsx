import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, DollarSign, Shield, Send } from "lucide-react";
import { Link } from "react-router-dom";

const Welfare = () => {
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
        {/* Membership application lives on its own page */}
        <div className="text-center">
          <Button asChild variant="community" size="lg" className="group">
            <Link to="/welfare/apply">
              Join the Welfare Fund
              <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Welfare;

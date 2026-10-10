import { Card, CardContent } from "@/components/ui/card";
import { Home, Users, Sparkles, Shield, Heart, TreePine } from "lucide-react";

const About = () => {
  const features = [
    {
      icon: TreePine,
      title: "Cultural Heritage",
      description: "Keeping Luhya traditions, language & customs alive"
    },
    {
      icon: Users,
      title: "Unity & Brotherhood",
      description: "Strong bonds across all Luhya sub-tribes in NSW"
    },
    {
      icon: Sparkles,
      title: "Community Events",
      description: "Celebrations that bring families together 🎉"
    },
    {
      icon: Shield,
      title: "Support System",
      description: "Emotional, social & financial support for members"
    },
    {
      icon: Heart,
      title: "Welfare Program",
      description: "Standing together in times of loss & need 🌿"
    },
    {
      icon: Home,
      title: "Youth & Future",
      description: "Teaching our kids where we come from with pride 🌍"
    }
  ];

  return (
    <section id="about" className="pt-12 pb-20 sm:pt-16 sm:pb-24 bg-white scroll-mt-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            About the{" "}
            <span className="bg-gradient-to-r from-luhya-gold to-luhya-green bg-clip-text text-transparent">
              Mulembe Community NSW
            </span>
          </h2>
          <div className="text-lg text-muted-foreground max-w-4xl mx-auto space-y-6">
            <p>
              The Mulembe Community NSW was created to be a home away from home, a place where culture, support, and family meet. Living far from Kenya can be joyful, but it can also be heavy when faced alone. That's why we came together as brothers and sisters: to celebrate who we are, to support each other, and to remind ourselves that <em>omundu khu mundu</em> is more than a saying. <em>It's our way of life.</em>
            </p>
            <p>
              Here, we laugh together, dance to Isukuti beats, share plates of ugali and <em>ingokho</em>, and hold each other up in times of need. What started as small gatherings has grown into a community with welfare support, cultural events, and friendships that feel like home.💛
            </p>
            <p>
              Joining Mulembe is not just about membership; it's about belonging. Whether it's celebrating our traditions, uplifting one another, or raising the next generation with pride in who we are, this is your home away from home.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-[var(--shadow-clean)] transition-all duration-300 border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                 <div className="w-12 h-12 bg-gradient-to-br from-luhya-gold/20 to-luhya-green/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-luhya-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Community Values */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold mb-8">Our Core Values</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 sm:gap-6">
            <div className="space-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-luhya-gold to-luhya-green rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold">Unity</h4>
              <p className="text-sm text-muted-foreground">Omundu khu mundu</p>
            </div>
            <div className="space-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-luhya-red to-luhya-gold rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold">Compassion</h4>
              <p className="text-sm text-muted-foreground">Care & support</p>
            </div>
            <div className="space-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-luhya-green to-luhya-navy rounded-full flex items-center justify-center mx-auto">
                <TreePine className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold">Culture</h4>
              <p className="text-sm text-muted-foreground">Heritage & identity</p>
            </div>
            <div className="space-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-luhya-navy to-luhya-cream rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold">Integrity</h4>
              <p className="text-sm text-muted-foreground">Trust & accountability</p>
            </div>
            <div className="space-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-luhya-cream to-luhya-gold rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold">Growth</h4>
              <p className="text-sm text-muted-foreground">Empower & uplift</p>
            </div>
            <div className="space-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-luhya-gold to-luhya-red rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold">Togetherness</h4>
              <p className="text-sm text-muted-foreground">Joy & celebration</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

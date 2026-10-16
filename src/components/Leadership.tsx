import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Shield,
  Heart,
  DollarSign,
  FileText,
  Calendar,
  HeartHandshake,
  Share2,
  Lightbulb,
} from "lucide-react";
import { EMAIL } from "@/constants/contact";
// Note: Chairperson photo replaced with public image at /IMG_7287.JPG (served from public/)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import publicOfficerImg from "@/assets/WhatsApp Image 2025-09-10 at 6.21.52 PM.jpeg";
// Vice Chairperson photo
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import viceChairpersonImg from "@/assets/photos/WhatsApp Image 2026-01-25 at 9.59.07 PM.jpeg";
// Secretary General photo
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import secretaryGeneralImg from "@/assets/photos/WhatsApp Image 2026-01-25 at 9.59.25 PM.jpeg";
// Treasurer photo
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import treasurerImg from "@/assets/photos/WhatsApp Image 2026-01-25 at 9.59.57 PM.jpeg";
// Events Coordinator photo
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import eventsCoordinatorImg from "@/assets/photos/WhatsApp Image 2026-01-25 at 10.00.56 PM.jpeg";
// Welfare photo
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import welfareImg from "@/assets/photos/WhatsApp Image 2026-01-25 at 10.01.18 PM.jpeg";
// Social Media Team photos (Gift and Terence)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import socialMediaGiftImg from "@/assets/photos/WhatsApp Image 2026-01-26 at 11.44.54 AM.jpeg";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import socialMediaTerenceImg from "@/assets/photos/WhatsApp Image 2026-01-30 at 11.50.07 AM.jpeg";
// Advisory Team photo (James Wasikoyo)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import advisoryJamesImg from "@/assets/photos/WhatsApp Image 2026-01-30 at 9.57.05 PM.jpeg";

const Leadership = () => {
  const leadershipTeam = [
    {
      name: "Elizabeth Khisa",
      position: "President",
      icon: Users,
      description:
        "Leading our community with wisdom and vision, ensuring our cultural heritage thrives in NSW.",
    },
    {
      name: "Joseph Ikatanyi",
      position: "Vice President",
      icon: Shield,
      description:
        "Supporting our community's growth and strengthening the bonds that unite all Luhya sub-tribes.",
    },
    {
      name: "Melanie Odundo",
      position: "Secretary General",
      icon: FileText,
      description:
        "Managing our community communications and ensuring smooth operations of all our activities.",
    },
    {
      name: "Douglas Marango",
      position: "Treasurer",
      icon: DollarSign,
      description:
        "Overseeing our community finances and welfare fund with transparency and accountability.",
    },
    {
      name: "Shilla Muhonja",
      position: "Events Coordinator",
      icon: Calendar,
      description:
        "Organizing community gatherings, cultural events, and activities that bring our members together.",
    },
    {
      name: "Rose Wangwe",
      position: "Welfare Coordinator",
      icon: HeartHandshake,
      description:
        "Coordinating welfare support and standing with our community members in times of need.",
    },
    {
      name: "Gift",
      position: "Social Media Team",
      icon: Share2,
      description:
        "Managing our community's online presence and keeping members connected through social media.",
    },
    {
      name: "Terence",
      position: "Social Media Team",
      icon: Share2,
      description:
        "Managing our community's online presence and keeping members connected through social media.",
    },
    {
      name: "Natalia Andati",
      position: "Public Officer",
      icon: Heart,
      description:
        "Representing our community publicly and fostering connections with the broader Australian society.",
    },
    {
      name: "James Wasikoyo",
      position: "Advisory Team",
      icon: Lightbulb,
      description:
        "Providing strategic guidance and counsel to support our community's vision and growth.",
    },
    {
      name: "Cynthia Ojiambo",
      position: "Advisory Team",
      icon: Lightbulb,
      description:
        "Providing strategic guidance and counsel to support our community's vision and growth.",
    },
    {
      name: "Dennis Machabe",
      position: "Advisory Team",
      icon: Lightbulb,
      description:
        "Providing strategic guidance and counsel to support our community's vision and growth.",
    },
  ];

  return (
    <section
      id="leadership"
      className="py-20 bg-gradient-to-b from-white to-luhya-cream/20 scroll-mt-24"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Our{" "}
            <span className="bg-gradient-to-r from-luhya-navy to-luhya-gold bg-clip-text text-transparent">
              Leadership Team
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Meet the dedicated leaders who guide our community with passion,
            integrity, and commitment to preserving our Luhya heritage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {leadershipTeam.map((leader, index) => {
            // Generate initials from name
            const getInitials = (name: string) => {
              return name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase();
            };

            return (
              <Card
                key={index}
                className="group hover:shadow-[var(--shadow-clean)] transition-all duration-300 border-luhya-gold/20"
              >
                <CardContent className="p-4 sm:p-6 text-center">
                  {/* Profile Avatar */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto mb-3 sm:mb-4">
                    {/* Background circle with gradient */}
                    <div className="w-full h-full bg-gradient-to-br from-luhya-gold to-luhya-green rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg overflow-hidden">
                      {leader.name === "Elizabeth Khisa" ? (
                        <img
                          src="/IMG_7650.JPEG"
                          alt={`${leader.name} - ${leader.position}`}
                          className="w-[90%] h-[90%] rounded-full object-cover"
                        />
                      ) : leader.name === "Natalia Andati" ? (
                        <img
                          src={publicOfficerImg}
                          alt={`${leader.name} - ${leader.position}`}
                          className="w-[90%] h-[90%] rounded-full object-cover"
                        />
                      ) : leader.name === "Joseph Ikatanyi" ? (
                        <img
                          src={viceChairpersonImg}
                          alt={`${leader.name} - ${leader.position}`}
                          className="w-[90%] h-[90%] rounded-full object-cover"
                        />
                      ) : leader.name === "Melanie Odundo" ? (
                        <img
                          src={secretaryGeneralImg}
                          alt={`${leader.name} - ${leader.position}`}
                          className="w-[90%] h-[90%] rounded-full object-cover"
                        />
                      ) : leader.name === "Douglas Marango" ? (
                        <img
                          src={treasurerImg}
                          alt={`${leader.name} - ${leader.position}`}
                          className="w-[90%] h-[90%] rounded-full object-cover"
                        />
                      ) : leader.name === "Shilla Muhonja" ? (
                        <img
                          src={eventsCoordinatorImg}
                          alt={`${leader.name} - ${leader.position}`}
                          className="w-[90%] h-[90%] rounded-full object-cover"
                        />
                      ) : leader.name === "Rose Wangwe" ? (
                        <img
                          src={welfareImg}
                          alt={`${leader.name} - ${leader.position}`}
                          className="w-[90%] h-[90%] rounded-full object-cover"
                        />
                      ) : leader.name === "Gift" ? (
                        <img
                          src={socialMediaGiftImg}
                          alt={`${leader.name} - ${leader.position}`}
                          className="w-[90%] h-[90%] rounded-full object-cover"
                        />
                      ) : leader.name === "Terence" ? (
                        <img
                          src={socialMediaTerenceImg}
                          alt={`${leader.name} - ${leader.position}`}
                          className="w-[90%] h-[90%] rounded-full object-cover"
                        />
                      ) : leader.name === "James Wasikoyo" ? (
                        <img
                          src={advisoryJamesImg}
                          alt={`${leader.name} - ${leader.position}`}
                          className="w-[90%] h-[90%] rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-[90%] h-[90%] bg-white rounded-full flex items-center justify-center shadow-inner">
                          <span className="text-lg sm:text-xl md:text-2xl font-bold text-luhya-navy">
                            {getInitials(leader.name)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 text-luhya-navy">
                    {leader.name}
                  </h3>

                  <div className="text-sm font-medium text-luhya-gold mb-3">
                    {leader.position}
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {leader.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center bg-gradient-to-r from-luhya-navy/10 to-luhya-gold/10 p-8 rounded-2xl border border-luhya-navy/20">
          <h3 className="text-2xl font-bold mb-4 text-luhya-navy">
            Get to Know Our Leaders
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our leadership team is always available to answer questions, provide
            support, and welcome new members to our community.
          </p>
          <div className="text-sm text-muted-foreground">
            <p>Contact any of our leaders through our community channels</p>
            <a
              href={`mailto:${EMAIL}`}
              className="break-all font-medium text-luhya-gold underline-offset-4 hover:underline"
            >
              {EMAIL}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Leadership;

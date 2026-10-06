import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, CheckCircle2, Shirt, Lock, ArrowRight, CalendarPlus } from "lucide-react";
import CultureHeritageCards from "@/components/CultureHeritageCards";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import midYearCatchupPoster from "@/assets/Mid-Year catchup.jpeg";

const Events = () => {
  const upcomingEvents: Array<{
    title: string;
    date: string;
    time: string;
    location: string;
    attendees: string;
    description: string; image?: string;
  }> = [
    {
 title: "Mulembe Night",
 date: "Saturday, 28 November 2026",
 time: "3:00 PM till midnight",
 location: "Venue TBA",
 attendees: "All Kenyan communities & friends of Mulembe",
 description: "Join us for Mulembe Night — a special celebration bringing together Kenyan communities and friends of Mulembe for an evening of culture, connection and celebration. Enjoy great company, music, food and a celebration of our diverse Kenyan heritage. Come together as we celebrate the spirit of community: One Kenya • Many Cultures • One Night.",
 image: "/assets/Mulembe-night-poster.jpeg"
 }
  ];

  const tickets = [
    { name: "Early Bird", price: 90, unit: "per person", badge: "Save $10", link: "https://buy.stripe.com/aFa5kxceI9p12pMfZ0bQY00",
      description: "Planning to join us? Why wait? Get your ticket early and enjoy our special Early Bird rate." },
    { name: "Standard", price: 100, unit: "per person", link: "https://buy.stripe.com/7sYfZb0w0gRt3tQ8wybQY02",
      description: "Ready for Mulembe Night? Get your ticket and join us for an evening of culture, connection, food, music and celebration." },
    { name: "Group of 4", price: 380, unit: "$95 per person", badge: "Save $20", link: "https://buy.stripe.com/4gMaERguY9p13tQ146bQY03",
      description: "Coming with friends? We've got you! Grab 4 tickets together and enjoy a discounted group rate." },
    { name: "Kids", price: 20, unit: "per child", link: "https://buy.stripe.com/5kQ28lceI0Svd4qcMObQY04",
      description: "Bring the little ones along and let them enjoy Mulembe Night with the family." },
  ];

  // Mulembe Night: 3 PM – midnight, Sydney time (AEDT, UTC+11).
  // Count calendar days in Sydney so the number changes at midnight there, for every visitor.
  const sydneyToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" }).format(new Date());
  const daysToGo = Math.round((Date.parse("2026-11-28") - Date.parse(sydneyToday)) / 86_400_000);
  const calendarFile =
    "data:text/calendar;charset=utf-8," +
    encodeURIComponent(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Mulembe Community NSW//Events//EN",
        "BEGIN:VEVENT",
        "UID:mulembe-night-2026@mulembecommunitynswinc.org.au",
        "DTSTAMP:20260101T000000Z",
        "DTSTART:20261128T040000Z",
        "DTEND:20261128T130000Z",
        "SUMMARY:Mulembe Night",
        "LOCATION:Venue TBA",
        "DESCRIPTION:One Kenya · Many Cultures · One Night. Tickets: https://mulembecommunitynswinc.org.au/#tickets",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n")
    );

  // Set `hidden: true` to keep an event in the code without showing it on the site.
  const allPastEvents: Array<{
    title: string;
    date: string;
    time: string;
    location: string;
    attendees: string;
    description: string; image?: string;
    hidden?: boolean;
  }> = [
    {
      title: "Mulembe Community Mid-Year Catch Up",
      date: "July 4, 2026",
      time: "2:00 PM",
      location: "Venue details will be shared with members",
      attendees: "All members and guests welcome",
      description:
        "EARLY BIRD — $90 | Planning to join us? Why wait? Get your ticket early and enjoy our special Early Bird rate. STANDARD — $100 | Ready for Mulembe Night? Get your ticket and join us for an evening of culture, connection, food, music and celebration. GROUP OF 4 — $380 | Coming with friends? We’ve got you! Grab 4 tickets together and enjoy a discounted group rate.",
      image: midYearCatchupPoster,
      hidden: true,
    },
  ];
  const pastEvents = allPastEvents.filter((event) => !event.hidden);


  return (
    <>
      <section id="events" className="py-20 bg-white scroll-mt-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-2xl mb-10 lg:mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="block h-0.5 w-8 lg:w-10 bg-community-warm" />
            <span className="text-xs sm:text-sm font-bold tracking-[0.22em] text-community-warm">EVENTS & ACTIVITIES</span>
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.02] tracking-tight text-[#17201b]">
            Come together, <span className="italic font-semibold text-[#0f2c20]">celebrate together</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
            Stay connected through our regular events and activities. There's always something happening in the Mulembe
            community.
          </p>
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.map((event, index) => (
          <div key={index} id="mulembe-night" className="mb-20 scroll-mt-24">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-10 lg:gap-16 rounded-3xl bg-[#0f2c20] text-[#f4efe4] px-5 pt-10 sm:px-10 lg:p-14">
              <div className="flex flex-col gap-6 lg:gap-7 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="block h-0.5 w-8 lg:w-10 bg-[#e0b75a]" />
                  <span className="text-xs sm:text-sm font-bold tracking-[0.22em] text-[#e0b75a]">UPCOMING EVENT</span>
                </div>

                <h3 className="font-display font-bold text-6xl sm:text-7xl lg:text-8xl leading-[0.92] tracking-tight">
                  Mulembe
                  <br />
                  <span className="italic font-semibold text-[#e0b75a]">Night</span>
                </h3>
                <p className="text-base sm:text-xl text-[#c9d3cc]">One Kenya · Many Cultures · One Night</p>

                <div className="flex items-center gap-4 sm:gap-7 py-5 border-y border-[#f4efe4]/15">
                  <div className="font-display font-bold text-7xl sm:text-8xl leading-[0.9] text-[#e0b75a]">28</div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="text-base sm:text-xl font-bold tracking-wide">NOVEMBER 2026</div>
                    <div className="text-sm sm:text-base text-[#c9d3cc]">Saturday · {event.time}</div>
                  </div>
                  {daysToGo >= 0 && (
                    <div className="ml-auto flex shrink-0 flex-col items-center justify-center h-20 w-20 sm:h-28 sm:w-28 rounded-full border-[1.5px] border-dashed border-[#e0b75a]">
                      {daysToGo === 0 ? (
                        <div className="font-display font-bold text-lg sm:text-2xl leading-none text-[#e0b75a]">TODAY</div>
                      ) : (
                        <>
                          <div className="font-display font-bold text-2xl sm:text-4xl leading-none">{daysToGo}</div>
                          <div className="text-[9px] sm:text-xs tracking-widest text-[#c9d3cc]">
                            {daysToGo === 1 ? "DAY TO GO" : "DAYS TO GO"}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {[
                    { icon: MapPin, text: event.location },
                    { icon: Shirt, text: "Dress code: Smart & elegant" },
                    { icon: Users, text: event.attendees },
                  ].map(({ icon: Icon, text }) => (
                    <span key={text} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm">
                      <Icon className="w-4 h-4 shrink-0" />
                      {text}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="#tickets"
                    onClick={(e) => {
                      // The site uses hash routing, so a plain #tickets link would be treated as a route
                      e.preventDefault();
                      document.getElementById("tickets")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#e0b75a] px-7 py-4 font-bold text-[#0f2c20] hover:bg-[#ebc774] transition"
                  >
                    Book your tickets
                    <ArrowRight className="w-[18px] h-[18px]" />
                  </a>
                  <a
                    href={calendarFile}
                    download="mulembe-night.ics"
                    className="inline-flex items-center justify-center gap-2.5 rounded-full border-[1.5px] border-[#f4efe4]/40 px-7 py-4 font-semibold hover:bg-white/10 transition"
                  >
                    <CalendarPlus className="w-[18px] h-[18px]" />
                    Add to calendar
                  </a>
                </div>
              </div>

              {event.image && (
                <div className="relative w-[270px] sm:w-[320px] lg:w-[380px] self-start justify-self-center lg:justify-self-auto -mb-36 lg:-mb-52 lg:mt-4">
                  <div className="absolute inset-0 top-4 -left-3 rounded-2xl bg-[#e0b75a] -rotate-[5deg]" />
                  <img
                    src={event.image}
                    alt={`${event.title} poster`}
                    className="relative block w-full h-auto rounded-2xl border-[6px] lg:border-8 border-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)] rotate-[3deg]"
                  />
                </div>
              )}
            </div>

            <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-16 pt-44 sm:pt-52 lg:pt-16 lg:px-14">
              <div className="flex flex-col gap-4 max-w-2xl">
                <div className="text-xs sm:text-sm font-bold tracking-[0.22em] text-community-warm">ABOUT THE NIGHT</div>
                <p className="font-display text-xl sm:text-2xl leading-snug text-[#17201b]">
                  A special celebration bringing together Kenyan communities and friends of Mulembe for an evening of
                  culture, connection and celebration.
                </p>
                <p className="text-base sm:text-lg leading-relaxed text-gray-600">
                  Enjoy great company, music, food and a celebration of our diverse Kenyan heritage. Come together as we
                  celebrate the spirit of community.
                </p>
              </div>
            </div>

            {/* Tickets */}
            <div id="tickets" className="mt-16 lg:mt-24 scroll-mt-24 lg:px-14">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7">
                <h3 className="font-display font-bold text-4xl sm:text-5xl tracking-tight">Get your tickets</h3>
                <div className="inline-flex items-center gap-2 text-sm sm:text-base text-gray-600">
                  <Lock className="w-4 h-4" />
                  Prices in AUD · Secure checkout by Stripe
                </div>
              </div>

              <div className="flex flex-col gap-3.5">
                {tickets.map((t) => (
                  <div
                    key={t.name}
                    className="relative grid grid-cols-[116px_minmax(0,1fr)] sm:grid-cols-[200px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-[#e5e1d8] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div
                      className="relative flex flex-col justify-center px-3.5 py-5 sm:px-7 border-r-2 border-dashed border-[#d9d3c6] bg-[#f6f2ea] text-[#0f2c20]"
                    >
                      <div className="text-[11px] sm:text-xs font-bold tracking-[0.15em] uppercase opacity-80">{t.name}</div>
                      <div className="mt-1 sm:mt-1.5 flex items-baseline gap-0.5">
                        <span className="text-base sm:text-xl font-bold">$</span>
                        <span className="font-display font-bold text-4xl sm:text-5xl leading-none">{t.price}</span>
                      </div>
                      <span className="absolute -right-[11px] -top-[11px] h-[22px] w-[22px] rounded-full bg-white" />
                      <span className="absolute -right-[11px] -bottom-[11px] h-[22px] w-[22px] rounded-full bg-white" />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 px-4 py-5 sm:px-8 sm:py-6 min-w-0">
                      <div className="flex flex-col gap-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="hidden sm:inline text-xl font-bold">{t.name}</span>
                          <span className="text-sm text-gray-600">{t.unit}</span>
                          {t.badge && (
                            <span
                              className="rounded-full px-2.5 py-0.5 text-[11px] sm:text-xs font-bold bg-[#e3f1e6] text-[#1f6b3a]"
                            >
                              {t.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm sm:text-[15px] leading-relaxed text-gray-600">{t.description}</p>
                      </div>
                      <a
                        href={t.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 min-h-11 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm sm:text-[15px] font-bold transition bg-[#0f2c20] text-white hover:bg-[#1a4332]"
                      >
                        <span className="sm:hidden">Buy {t.name}</span>
                        <span className="hidden sm:inline">Buy ticket</span>
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
{/* Past Events */}
        {pastEvents.length > 0 && (
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8 flex items-center">
              <CheckCircle2 className="w-6 h-6 mr-2 text-muted-foreground" />
              Past Events
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((event, index) => (
                <Card key={index} className="group hover:shadow-[var(--shadow-clean)] transition-all duration-300 opacity-90">
                  <CardHeader>
                    <CardTitle className="text-lg text-muted-foreground group-hover:text-foreground transition-colors">
                      {event.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                        {event.date}
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                        {event.time}
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                        {event.location}
                      </div>
                      <div className="flex items-center text-sm">
                        <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                        {event.attendees} attended
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Culture & Heritage */}
        <div>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-10 sm:mb-12 flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
              <DotLottieReact
                src="/Pepa Hover Effect.json"
                loop
                autoplay
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <span>Culture & Heritage</span>
          </h3>
          <CultureHeritageCards />
        </div>

      </div>
    </section>
    </>
  );
};

export default Events;

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Events from "@/components/Events";
import Gallery from "@/components/Gallery";
import Community from "@/components/Community";
import Leadership from "@/components/Leadership";
import Membership from "@/components/Membership";
import BusinessDirectory from "@/components/BusinessDirectory";
import Welfare from "@/components/Welfare";
import Footer from "@/components/Footer";
import { useEffect } from "react";

const Index = ({ scrollTo }: { scrollTo?: string }) => {
  useEffect(() => {
    const sectionId = scrollTo ?? sessionStorage.getItem("scrollTo");
    if (!sectionId) return;

    sessionStorage.removeItem("scrollTo");
    const timer = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [scrollTo]);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <Header />
      <Hero />
      <About />
      <Welfare />
      <Events />
      <Gallery />
      <Community />
      <Leadership />
      <Membership />
      <BusinessDirectory />
      <Footer />
    </div>
  );
};

export default Index;

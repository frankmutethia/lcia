import { Mail, Phone, MapPin, Facebook, Instagram, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const Footer = () => {
  return (
    <footer className="bg-community-earth text-white py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo & Motto */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/lcia-logo.jpg" 
                alt="Mulembe Community NSW Logo" 
                className="w-8 h-8 object-contain rounded-lg"
              />
              <span className="text-xl font-bold">Mulembe Community NSW</span>
            </div>
            <div className="space-y-3">
              <p className="text-white/80 text-sm">
                A vibrant community where neighbors become family and every day 
                brings new opportunities to connect, grow, and thrive together.
              </p>
              <p className="text-luhya-gold/90 text-sm italic font-medium">
                "From stories to songs to shared meals — there's a place for you here."
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => scrollToSection('home')} className="text-left w-full text-white/80 hover:text-white transition-colors">Home</button></li>
              <li><button onClick={() => scrollToSection('about')} className="text-left w-full text-white/80 hover:text-white transition-colors">About Us</button></li>
              <li><button onClick={() => scrollToSection('events')} className="text-left w-full text-white/80 hover:text-white transition-colors">Events</button></li>
              <li><button onClick={() => scrollToSection('community')} className="text-left w-full text-white/80 hover:text-white transition-colors">Community</button></li>
              <li><button onClick={() => scrollToSection('leadership')} className="text-left w-full text-white/80 hover:text-white transition-colors">Leadership</button></li>
              <li><Link to="/leadership-interest" className="text-white/80 hover:text-white transition-colors">Leadership Expression of Interest</Link></li>
              <li><button onClick={() => scrollToSection("voting")} className="text-white/80 hover:text-white transition-colors">Voting</button></li>
              <li><button onClick={() => scrollToSection('membership')} className="text-left w-full text-white/80 hover:text-white transition-colors">Membership</button></li>
              <li><button onClick={() => scrollToSection('business')} className="text-left w-full text-white/80 hover:text-white transition-colors">Business Directory</button></li>
              <li><button onClick={() => scrollToSection('welfare')} className="text-left w-full text-white/80 hover:text-white transition-colors">Welfare</button></li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h4 className="font-semibold mb-4">Contact & Legal</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-community-warm mt-0.5" />
                <span className="text-white/80">Unit 17/ 328 Woodville Road<br />Guildford, 2161 NSW</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-community-warm" />
                <a href="tel:+61410107026" className="text-white/80 hover:text-white transition-colors">+61 410 107 026</a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-community-warm" />
                <a href="mailto:mulembecommunitysydneyau@gmail.com" className="text-white/80 hover:text-white transition-colors">Contact Us</a>
              </div>
              <div className="pt-2">
                <a href="#" className="text-white/80 hover:text-white transition-colors">Privacy Policy</a>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="font-semibold mb-4">Connect With Us</h4>
            <div className="space-y-3">
              <div className="flex space-x-4">
                <a href="#" aria-label="Join our WhatsApp or chat" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors group">
                  <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
                <a href="#" aria-label="Visit our Facebook page" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors group">
                  <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
                <a href="https://www.instagram.com/mulembe_nsw?igsh=MWplZnhlYzIyaDJ5bw==" target="_blank" rel="noopener noreferrer" aria-label="Visit our Instagram profile" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors group">
                  <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              </div>
              {/* Removed social text links per request; icons above remain clickable */}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-white/60 text-sm">© 2025 Mulembe Community NSW. All rights reserved.</p>
            <p className="text-luhya-gold text-sm font-medium italic">
              Proudly preserving Luhya culture in NSW Australia
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

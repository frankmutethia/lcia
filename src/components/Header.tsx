import { Button } from "@/components/ui/button";
import { Menu, X, Calendar, MessageCircle, Home, Heart, Users, Store, Info, LogIn, Vote } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const scrollToSection = (sectionId: string) => {
  // Let the mobile menu collapse before calculating the section position.
  window.setTimeout(() => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, 0);
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-border z-50">
      <div className="container mx-auto px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between gap-6 h-16 xl:h-[72px]">
          {/* Logo */}
          <div className="flex shrink-0 items-center space-x-3">
            <img 
              src="/lcia-logo.jpg" 
              alt="Mulembe Community NSW Logo" 
              className="w-10 h-10 sm:w-11 sm:h-11 xl:w-12 xl:h-12 object-contain"
            />
            <div className="flex flex-col">
              <span className="whitespace-nowrap text-base sm:text-lg xl:text-xl font-extrabold text-black leading-tight">Mulembe Community</span>
              <span className="whitespace-nowrap text-xs sm:text-sm text-luhya-gold font-bold leading-tight">NSW Australia</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav aria-label="Main navigation" className="hidden xl:flex items-center gap-5 2xl:gap-7 [&_svg]:hidden 2xl:[&_svg]:block">
            <button onClick={() => scrollToSection('home')} className="flex items-center gap-1.5 whitespace-nowrap text-sm 2xl:text-base text-foreground hover:text-community-warm transition-colors">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button onClick={() => scrollToSection('about')} className="flex items-center gap-1.5 whitespace-nowrap text-sm 2xl:text-base text-foreground hover:text-community-warm transition-colors">
              <Info className="w-4 h-4" />
              <span>About</span>
            </button>
            <button onClick={() => scrollToSection('events')} className="flex items-center gap-1.5 whitespace-nowrap text-sm 2xl:text-base text-foreground hover:text-community-warm transition-colors">
              <Calendar className="w-4 h-4" />
              <span>Events</span>
            </button>
            <button onClick={() => scrollToSection('community')} className="flex items-center gap-1.5 whitespace-nowrap text-sm 2xl:text-base text-foreground hover:text-community-warm transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span>Community</span>
            </button>
            <button onClick={() => scrollToSection('leadership')} className="flex items-center gap-1.5 whitespace-nowrap text-sm 2xl:text-base text-foreground hover:text-community-warm transition-colors">
              <Users className="w-4 h-4" />
              <span>Leadership</span>
            </button>
            <button onClick={() => scrollToSection('membership')} className="flex items-center gap-1.5 whitespace-nowrap text-sm 2xl:text-base text-foreground hover:text-community-warm transition-colors">
              <Heart className="w-4 h-4" />
              <span>Membership</span>
            </button>
            <button onClick={() => scrollToSection('business')} className="flex items-center gap-1.5 whitespace-nowrap text-sm 2xl:text-base text-foreground hover:text-community-warm transition-colors">
              <Store className="w-4 h-4" />
              <span>Business</span>
            </button>
            <button onClick={() => scrollToSection('welfare')} className="flex items-center gap-1.5 whitespace-nowrap text-sm 2xl:text-base text-foreground hover:text-community-warm transition-colors">
              <Heart className="w-4 h-4" />
              <span>Welfare</span>
            </button>
            <button onClick={() => scrollToSection("voting")} className="flex items-center gap-1.5 whitespace-nowrap text-sm 2xl:text-base text-foreground hover:text-community-warm transition-colors"><Vote className="w-4 h-4" /><span>Voting</span></button>
          </nav>

          {/* CTA Button */}
          <div className="hidden xl:block shrink-0">
            <Button onClick={() => scrollToSection('join-form')} variant="community" size="sm" className="text-sm px-4 py-2">Join MCNSW</Button>
          </div>

          <Button asChild variant="outline" size="sm" className="hidden shrink-0 sm:inline-flex"><Link to="/login"><LogIn className="mr-1 h-4 w-4" aria-hidden="true" />Staff Login</Link></Button>

          {/* Mobile Menu Button */}
          <button
            className="xl:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div id="mobile-navigation" className="xl:hidden max-h-[70dvh] overflow-y-auto py-4 border-t border-border bg-background/95 backdrop-blur-sm">
            <nav aria-label="Mobile navigation" className="flex flex-col space-y-3">
              <button onClick={() => { scrollToSection('home'); setIsMenuOpen(false); }} className="flex items-center space-x-3 px-3 py-2 rounded-md text-foreground hover:text-community-warm hover:bg-gray-50 transition-colors">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
              <button onClick={() => { scrollToSection('about'); setIsMenuOpen(false); }} className="flex items-center space-x-3 px-3 py-2 rounded-md text-foreground hover:text-community-warm hover:bg-gray-50 transition-colors">
                <Info className="w-4 h-4" />
                <span>About</span>
              </button>
              <button onClick={() => { scrollToSection('events'); setIsMenuOpen(false); }} className="flex items-center space-x-3 px-3 py-2 rounded-md text-foreground hover:text-community-warm hover:bg-gray-50 transition-colors">
                <Calendar className="w-4 h-4" />
                <span>Events</span>
              </button>
              <button onClick={() => { scrollToSection('community'); setIsMenuOpen(false); }} className="flex items-center space-x-3 px-3 py-2 rounded-md text-foreground hover:text-community-warm hover:bg-gray-50 transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span>Community</span>
              </button>
              <button onClick={() => { scrollToSection('leadership'); setIsMenuOpen(false); }} className="flex items-center space-x-3 px-3 py-2 rounded-md text-foreground hover:text-community-warm hover:bg-gray-50 transition-colors">
                <Users className="w-4 h-4" />
                <span>Leadership</span>
              </button>
              <button onClick={() => { scrollToSection('membership'); setIsMenuOpen(false); }} className="flex items-center space-x-3 px-3 py-2 rounded-md text-foreground hover:text-community-warm hover:bg-gray-50 transition-colors">
                <Heart className="w-4 h-4" />
                <span>Membership</span>
              </button>
              <button onClick={() => { scrollToSection('business'); setIsMenuOpen(false); }} className="flex items-center space-x-3 px-3 py-2 rounded-md text-foreground hover:text-community-warm hover:bg-gray-50 transition-colors">
                <Store className="w-4 h-4" />
                <span>Business</span>
              </button>
              <button onClick={() => { scrollToSection('welfare'); setIsMenuOpen(false); }} className="flex items-center space-x-3 px-3 py-2 rounded-md text-foreground hover:text-community-warm hover:bg-gray-50 transition-colors">
                <Heart className="w-4 h-4" />
                <span>Welfare</span>
              </button>
              <button onClick={() => { scrollToSection("voting"); setIsMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2"><Vote className="h-4 w-4" />Voting</button>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 sm:hidden"><LogIn className="h-4 w-4" />Staff Login</Link>
              <div className="pt-2 border-t border-border">
                <Button onClick={() => { scrollToSection('join-form'); setIsMenuOpen(false); }} variant="community" size="sm" className="w-full">Join MCNSW</Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

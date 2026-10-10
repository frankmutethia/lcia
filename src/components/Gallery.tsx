import PublishedContent from "@/components/PublishedContent";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Heart, Users, MapPin, Download, Calendar, X, ChevronLeft, ChevronRight } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useMemo, useState, useEffect } from "react";

// Dynamically import photos from the photos folder, excluding leadership headshots
const photoModules = import.meta.glob<{ default: string }>('@/assets/photos/*.jpeg', { eager: true });

// Leadership photos live in the same folder but must not appear in the meetup gallery
const LEADERSHIP_PHOTO_FILES = [
  'WhatsApp Image 2026-01-25 at 9.59.07 PM.jpeg',
  'WhatsApp Image 2026-01-25 at 9.59.25 PM.jpeg',
  'WhatsApp Image 2026-01-25 at 9.59.57 PM.jpeg',
  'WhatsApp Image 2026-01-25 at 10.00.56 PM.jpeg',
  'WhatsApp Image 2026-01-25 at 10.01.18 PM.jpeg',
  'WhatsApp Image 2026-01-26 at 11.44.54 AM.jpeg',
  'WhatsApp Image 2026-01-30 at 11.50.07 AM.jpeg',
  'WhatsApp Image 2026-01-30 at 9.57.05 PM.jpeg',
];

const photos = Object.entries(photoModules)
  .filter(([path]) => !LEADERSHIP_PHOTO_FILES.some((file) => path.endsWith(file)))
  .map(([, module]) => module.default);

const Gallery = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Generate gallery items from photos - all from the same event
  const galleryItems = useMemo(() => {
    return photos.map((photo, index) => {
      return {
        id: index + 1,
        image: photo,
        date: "December 13, 2025"
      };
    });
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;

      if (e.key === 'Escape') {
        setSelectedImageIndex(null);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedImageIndex(prev => {
          if (prev === null) return null;
          return prev > 0 ? prev - 1 : photos.length - 1;
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedImageIndex(prev => {
          if (prev === null) return null;
          return prev < photos.length - 1 ? prev + 1 : 0;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex]);

  const handleOpenImage = (index: number) => {
    setSelectedImageIndex(index);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const handleCloseImage = () => {
    setSelectedImageIndex(null);
    document.body.style.overflow = 'unset'; // Restore scrolling
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageIndex === null) return;
    setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : photos.length - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageIndex === null) return;
    setSelectedImageIndex(selectedImageIndex < photos.length - 1 ? selectedImageIndex + 1 : 0);
  };

  return (
    <section id="gallery" className="py-20 bg-white scroll-mt-24">
      <div className="container mx-auto px-4 lg:px-8">
        <PublishedContent type="gallery" />
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
              <DotLottieReact
                src="/Photos.json"
                loop
                autoplay
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <span>Community,</span>
              <span className="bg-gradient-to-r from-luhya-gold to-luhya-green bg-clip-text text-transparent">
                Gallery
              </span>
            </div>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Relive the beautiful moments from our End of Year Community Meetup — a celebration of unity, culture, and togetherness.
          </p>
        </div>

        {/* Event Banner */}
        <div className="mb-8 sm:mb-12 bg-gradient-to-r from-luhya-gold/10 to-luhya-green/10 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-luhya-gold/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left w-full md:w-auto">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-luhya-gold to-luhya-green rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <Calendar className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-luhya-navy mb-1">End of Year Mulembe Community Meetup</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  December 13, 2025 • All {photos.length} photos from this event
                </p>
              </div>
            </div>
            <a 
              href="https://drive.google.com/drive/folders/15F0tofKt-YAMn_wJrlas2QwTPLuxPdcy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-shrink-0 w-full sm:w-auto"
            >
              <Button variant="community" size="lg" className="group w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Download All Photos</span>
                <span className="sm:hidden">Download Photos</span>
              </Button>
            </a>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {galleryItems.map((item, index) => (
             <Card 
               key={item.id} 
               className="group hover:shadow-[var(--shadow-clean)] transition-all duration-300 overflow-hidden border-luhya-gold/10 cursor-pointer"
               onClick={() => handleOpenImage(index)}
             >
               <div className="relative overflow-hidden h-48 sm:h-56 md:h-64">
                 <img
                   src={item.image}
                   alt={`End of Year Mulembe Community Meetup - Photo ${item.id}`}
                   className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                 />
                 {/* Event Badge - Always Visible */}
                 <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-luhya-gold/95 backdrop-blur-sm text-white px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 shadow-lg">
                   <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                   <span className="hidden xs:inline">Dec 13, 2025</span>
                   <span className="xs:hidden">Dec 13</span>
                 </div>
                 {/* Hover Overlay */}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                 {/* Click Indicator - Hidden on mobile, shown on hover for desktop */}
                 <div className="hidden sm:flex absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                   <div className="bg-white/90 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-luhya-navy">
                    Click to view full size
                  </div>
                 </div>
               </div>
              <CardContent className="p-3 sm:p-4 md:p-5">
                <h3 className="font-semibold text-sm sm:text-base mb-1 text-luhya-navy group-hover:text-luhya-gold transition-colors line-clamp-1">
                  End of Year Mulembe Community Meetup
                </h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-3 sm:mb-4">
                  Photo {item.id} of {photos.length}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Community</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-luhya-gold hover:text-luhya-gold hover:bg-luhya-gold/10 h-7 sm:h-8 text-xs sm:text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenImage(index);
                    }}
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Image Modal/Lightbox */}
        {selectedImageIndex !== null && (
          <div 
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
            onClick={handleCloseImage}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseImage}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-sm text-white rounded-full p-2 sm:p-2.5 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Navigation Buttons */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-sm text-white rounded-full p-2.5 sm:p-3 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-sm text-white rounded-full p-2.5 sm:p-3 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}

            {/* Image Container */}
            <div 
              className="relative max-w-7xl w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={photos[selectedImageIndex]}
                alt={`End of Year Mulembe Community Meetup - Photo ${selectedImageIndex + 1}`}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl"
                style={{ maxHeight: 'calc(100vh - 120px)' }}
              />
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
              {selectedImageIndex + 1} / {photos.length}
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-16">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-luhya-gold to-luhya-green rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
              <Camera className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-luhya-gold">{photos.length}+</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Photos Captured</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-luhya-green to-luhya-red rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-luhya-green">50+</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Events Documented</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-luhya-red to-luhya-navy rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
              <Heart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-luhya-red">1000+</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Memories Made</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-luhya-navy to-luhya-gold rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
              <MapPin className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-luhya-navy">3+</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Years Together</div>
          </div>
        </div>

        {/* Download gallery */}
        <div className="text-center bg-gradient-to-r from-luhya-gold/10 to-luhya-green/10 p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-luhya-gold/20">
          <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Download Our Gallery</h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto px-4">
            Browse and download photos from our community events to keep and share our beautiful memories together.
          </p>
          <a
            href="https://drive.google.com/drive/folders/15F0tofKt-YAMn_wJrlas2QwTPLuxPdcy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full sm:w-auto px-4"
          >
            <Button variant="outline" size="lg" className="group w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Download Gallery
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Gallery;

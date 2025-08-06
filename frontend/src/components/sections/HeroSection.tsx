import bg1 from '@/assets/bg1.png'
import bg2 from '@/assets/bg2.jpg'
import bg3 from '@/assets/bg3.jpg'
import bg4 from '@/assets/bg4.jpg'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';

const heroImages = [
  {
    src: bg1,
    alt: "Modern dental clinic",
    title: "Nụ Cười Khỏe Mạnh",
    subtitle: "Dịch vụ nha khoa hiện đại"
  },
  {
    src: bg2,
    alt: "Dental equipment",
    title: "Công Nghệ Tiên Tiến",
    subtitle: "Trang thiết bị y tế tối tân"
  },
  {
    src: bg3,
    alt: "Dental office",
    title: "Không Gian Thân Thiện",
    subtitle: "Môi trường thoải mái, an toàn"
  },
  {
    src: bg4,
    alt: "Happy patient",
    title: "Bệnh Nhân Hài Lòng",
    subtitle: "Chăm sóc tận tâm, chuyên nghiệp"
  }
];

export const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [api, setApi] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);

  const goToSlide = (index: number) => {
    if (api) {
      api.scrollTo(index);
      setCurrentSlide(index);
    }
  };

  // Listen for carousel API changes
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrentSlide(api.selectedScrollSnap());
    };

    // Set initial slide
    setCurrentSlide(api.selectedScrollSnap());
    
    // Listen for slide changes
    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Auto-scroll carousel
  useEffect(() => {
    if (!api) return;

    const intervalId = setInterval(() => {
      // Only auto-scroll if not hovered
      if (!isHovered) {
        api.scrollNext();
      }
    }, 4000); // Auto-scroll every 4 seconds

    return () => clearInterval(intervalId);
  }, [api, isHovered]);

  return (
    <section id="home" className="relative overflow-hidden">
      <div className="w-full">
        {/* Full Width Carousel */}
        <div 
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Carousel 
            className="w-full" 
            opts={{ align: "start", loop: true }}
            setApi={setApi}
          >
            <CarouselContent>
              {heroImages.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="relative">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious 
              className={`left-1 sm:left-2 md:left-4 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 transition-all duration-300 ${
                isHovered 
                  ? 'opacity-100 bg-white/20 border-white/30 text-white hover:bg-blue-500 hover:border-blue-400 hover:text-white' 
                  : 'opacity-0'
              }`} 
            />
            <CarouselNext 
              className={`right-1 sm:right-2 md:right-4 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 transition-all duration-300 ${
                isHovered 
                  ? 'opacity-100 bg-white/20 border-white/30 text-white hover:bg-blue-500 hover:border-blue-400 hover:text-white' 
                  : 'opacity-0'
              }`} 
            />
          </Carousel>
        </div>

        {/* Indicator Dots */}
        <div className="absolute bottom-2 sm:bottom-4 md:bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-2 sm:space-x-3 rounded-full px-3 py-2 sm:px-4 sm:py-2">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                  currentSlide === index 
                    ? 'bg-blue-600 scale-125 shadow-lg' 
                    : 'bg-blue-300/50 hover:bg-blue-300/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Phone Button */}
      <div className="fixed left-2 sm:left-4 bottom-4 sm:bottom-6 z-50">
        <div className="relative">
          {/* Main button */}
          <a 
            href="tel:0941120015"
            className="relative flex items-center bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 group"
          >
            <div className="relative p-2 sm:p-3">
              {/* Ping effect only on icon */}
              <div className="absolute inset-0 bg-red-400 rounded-full animate-ping scale-110"></div>
              <div className="absolute inset-0 bg-red-400 rounded-full animate-ping animation-delay-800 scale-110"></div>
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 animate-shake" />
            </div>
            <div className="pr-3 sm:pr-4 pl-1 py-2 sm:py-3 font-semibold text-xs sm:text-sm">
              0941.12.00.15
            </div>
          </a>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-10 sm:top-20 left-4 sm:left-10 w-2 h-2 sm:w-4 sm:h-4 bg-white/30 rounded-full animate-ping"></div>
      <div className="absolute top-20 sm:top-40 right-8 sm:right-20 w-3 h-3 sm:w-6 sm:h-6 bg-white/40 rounded-full animate-pulse"></div>
      <div className="absolute bottom-20 sm:bottom-32 left-8 sm:left-20 w-2 h-2 sm:w-3 sm:h-3 bg-white/50 rounded-full animate-bounce"></div>
      
      <style>{`
        .animation-delay-2000 {
          animation-delay: 2.0s;
        }
        
        @keyframes shake {
          0%, 100% { transform: rotate(15deg); }
          10% { transform: rotate(5deg); }
          20% { transform: rotate(25deg); }
          30% { transform: rotate(7deg); }
          40% { transform: rotate(23deg); }
          50% { transform: rotate(9deg); }
          60% { transform: rotate(21deg); }
          70% { transform: rotate(11deg); }
          80% { transform: rotate(19deg); }
          90% { transform: rotate(13deg); }
        }
        
        .animate-shake {
          animation: shake 1s infinite;
          animation-delay: 1s;
          transform-origin: center;
          transform: rotate(15deg);
        }
      `}</style>
    </section>
  );
};
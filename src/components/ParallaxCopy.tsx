import React, { useState, useEffect, useRef } from 'react';
import { ScrollTriggeredText } from './ui/scroll-triggered-text';

interface CopySlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  bgColor: string;
  accentColor: string;
}

const copySlides: CopySlide[] = [
  {
    id: 1,
    title: "Innovate",
    subtitle: "Push Boundaries",
    description: "We explore emerging technologies and experimental approaches to create groundbreaking digital experiences that challenge conventions.",
    bgColor: "from-purple-900/80 to-blue-900/60",
    accentColor: "text-purple-400"
  },
  {
    id: 2,
    title: "Collaborate",
    subtitle: "Build Together",
    description: "Our community thrives on collaboration, bringing together diverse perspectives to solve complex creative and technical challenges.",
    bgColor: "from-blue-900/80 to-cyan-900/60",
    accentColor: "text-cyan-400"
  },
  {
    id: 3,
    title: "Inspire",
    subtitle: "Shape the Future",
    description: "Through knowledge sharing and mentorship, we inspire the next generation of creative technologists to push the industry forward.",
    bgColor: "from-cyan-900/80 to-teal-900/60",
    accentColor: "text-teal-400"
  },
  {
    id: 4,
    title: "Create",
    subtitle: "Make Magic",
    description: "At the intersection of art and technology, we transform ideas into immersive experiences that captivate and engage audiences.",
    bgColor: "from-teal-900/80 to-green-900/60",
    accentColor: "text-emerald-400"
  }
];

const ParallaxCopy: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      
      // Calculate how much of the container has been scrolled through
      const scrolled = -containerRect.top;
      const maxScroll = containerHeight - viewportHeight;
      const progress = Math.max(0, Math.min(1, scrolled / maxScroll));
      
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-[500vh]">
      {copySlides.map((slide, index) => {
        // Calculate each slide's reveal progress
        const slideStart = index / copySlides.length;
        const slideEnd = (index + 1) / copySlides.length;
        const slideProgress = Math.max(0, Math.min(1, (scrollProgress - slideStart) / (slideEnd - slideStart)));
        
        // Transform calculations for the "pulling up" effect
        const translateY = (1 - slideProgress) * 100; // Slides up from bottom
        const scale = 0.8 + (slideProgress * 0.2); // Scales up as it appears
        const opacity = slideProgress;
        
        // Previous slide getting "pushed down" effect
        const prevSlideOffset = slideProgress * -50; // Previous content moves up and out
        
        return (
          <div
            key={slide.id}
            className="fixed inset-0 flex items-center justify-center"
            style={{
              transform: `translateY(${translateY}%) scale(${scale})`,
              opacity: opacity,
              zIndex: index + 1,
            }}
          >
            {/* Background overlay that pulls up */}
            <div 
              className={`absolute inset-0 bg-gradient-to-br ${slide.bgColor} backdrop-blur-sm`}
              style={{
                transform: `translateY(${translateY * 0.5}%)`, // Background moves slower for depth
              }}
            />
            
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-white/10 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    transform: `translateY(${translateY * (0.3 + Math.random() * 0.4)}%) scale(${scale})`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            {/* Content that slides up and overlays */}
            <div 
              className="relative z-10 max-w-4xl mx-auto px-8 text-center"
              style={{
                transform: `translateY(${translateY * 0.8}%) scale(${scale})`, // Content moves faster than background
              }}
            >
              {/* Progress indicator */}
              <div className="mb-8">
                <div className="flex justify-center space-x-3 mb-6">
                  {copySlides.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 rounded-full transition-all duration-500 ${
                        idx <= index ? 'bg-white w-8' : 'bg-white/30 w-4'
                      }`}
                      style={{
                        opacity: idx === index ? 1 : 0.5,
                      }}
                    />
                  ))}
                </div>
                <div className="text-white/70 text-sm font-secondary tracking-wider">
                  {String(index + 1).padStart(2, '0')} / {String(copySlides.length).padStart(2, '0')}
                </div>
              </div>

              {/* Main content with staggered animations */}
              <div 
                className="space-y-8"
                style={{
                  transform: `translateY(${(1 - slideProgress) * 40}px)`,
                  opacity: slideProgress,
                }}
              >
                <h1 
                  className="text-7xl md:text-9xl font-primary text-white font-bold tracking-tight"
                  style={{
                    transform: `translateY(${(1 - slideProgress) * 60}px)`,
                    opacity: Math.max(0, slideProgress - 0.1),
                  }}
                >
                  {slide.title}
                </h1>
                
                <h2 
                  className={`text-3xl md:text-4xl font-secondary ${slide.accentColor} font-medium`}
                  style={{
                    transform: `translateY(${(1 - slideProgress) * 40}px)`,
                    opacity: Math.max(0, slideProgress - 0.2),
                  }}
                >
                  {slide.subtitle}
                </h2>
                
                <p 
                  className="text-xl md:text-2xl text-zinc-200 max-w-3xl mx-auto font-secondary leading-relaxed"
                  style={{
                    transform: `translateY(${(1 - slideProgress) * 20}px)`,
                    opacity: Math.max(0, slideProgress - 0.3),
                  }}
                >
                  {slide.description}
                </p>

                {/* Call to action on last slide */}
                {index === copySlides.length - 1 && slideProgress > 0.7 && (
                  <div 
                    className="mt-16"
                    style={{
                      transform: `translateY(${(1 - slideProgress) * 30}px)`,
                      opacity: Math.max(0, slideProgress - 0.5),
                    }}
                  >
                    <p className="text-xl text-white/90 mb-8 font-secondary">
                      Ready to join our creative journey?
                    </p>
                    <button 
                      onClick={() => window.location.href = '/membership-form'}
                      className="group px-10 py-4 bg-white text-black font-bold text-lg rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl font-secondary relative overflow-hidden"
                    >
                      <span className="relative z-10">Join the Collective</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Overlay blend effect for smoother transitions */}
            <div 
              className="absolute inset-0 bg-black/20"
              style={{
                opacity: Math.max(0, 1 - slideProgress * 2),
              }}
            />
          </div>
        );
      })}
      
      {/* Base layer - always visible */}
      <div className="fixed inset-0 bg-black" style={{ zIndex: 0 }} />
    </div>
  );
};

export default ParallaxCopy;
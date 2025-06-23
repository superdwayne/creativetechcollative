import React, { useEffect, useRef } from 'react';

interface MorphingTextProps {
  texts: string[];
  className?: string;
  morphTime?: number;
  cooldownTime?: number;
}

export const MorphingText: React.FC<MorphingTextProps> = ({
  texts,
  className = "",
  morphTime = 1,
  cooldownTime = 0.25
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number>();
  
  useEffect(() => {
    if (!containerRef.current || !text1Ref.current || !text2Ref.current || texts.length === 0) return;

    const elts = {
      text1: text1Ref.current,
      text2: text2Ref.current
    };

    let textIndex = texts.length - 1;
    let time = new Date();
    let morph = 0;
    let cooldown = cooldownTime;

    elts.text1.textContent = texts[textIndex % texts.length];
    elts.text2.textContent = texts[(textIndex + 1) % texts.length];

    function doMorph() {
      morph -= cooldown;
      cooldown = 0;
      
      let fraction = morph / morphTime;
      
      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
      }
      
      setMorph(fraction);
    }

    function setMorph(fraction: number) {
      elts.text2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      elts.text2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
      
      fraction = 1 - fraction;
      elts.text1.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      elts.text1.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
      
      elts.text1.textContent = texts[textIndex % texts.length];
      elts.text2.textContent = texts[(textIndex + 1) % texts.length];
    }

    function doCooldown() {
      morph = 0;
      
      elts.text2.style.filter = "";
      elts.text2.style.opacity = "100%";
      
      elts.text1.style.filter = "";
      elts.text1.style.opacity = "0%";
    }

    function animate() {
      animationRef.current = requestAnimationFrame(animate);
      
      let newTime = new Date();
      let shouldIncrementIndex = cooldown > 0;
      let dt = (newTime.getTime() - time.getTime()) / 1000;
      time = newTime;
      
      cooldown -= dt;
      
      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          textIndex++;
        }
        
        doMorph();
      } else {
        doCooldown();
      }
    }

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [texts, morphTime, cooldownTime]);

  return (
    <div className="relative w-full">
      {/* SVG filter for the morphing effect */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="threshold">
            <feColorMatrix 
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140" 
            />
          </filter>
        </defs>
      </svg>
      
      {/* Container with morphing effect */}
      <div 
        ref={containerRef}
        className={`relative w-full text-center ${className}`}
        style={{
          filter: 'url(#threshold) blur(0.6px)'
        }}
      >
        {/* Invisible placeholder to maintain consistent height */}
        <span 
          className="invisible block select-none"
          aria-hidden="true"
        >
          {texts[0] || "Placeholder"}
        </span>
        
        <span 
          ref={text1Ref}
          className="absolute top-0 left-0 w-full select-none text-center"
          style={{ opacity: '0%' }}
        />
        <span 
          ref={text2Ref}
          className="absolute top-0 left-0 w-full select-none text-center"
          style={{ opacity: '100%' }}
        />
      </div>
    </div>
  );
};
import React, { useState, useRef, useEffect } from 'react';

interface SplashPageProps {
  onComplete?: () => void;
}

const SplashPage: React.FC<SplashPageProps> = ({ onComplete }) => {
  const [isHyperspeed, setIsHyperspeed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const handleClick = () => {
    setIsHyperspeed(true);
    setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onComplete?.();
      }, 1000);
    }, 2000);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Hyperspeed particles
    interface Particle {
      x: number;
      y: number;
      z: number;
      speed: number;
      size: number;
    }

    const particles: Particle[] = [];
    const numParticles = 300;

    // Initialize particles in 3D space
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: Math.random() * 2000 + 1000,
        speed: 0,
        size: Math.random() * 2 + 1
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (isHyperspeed) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const fov = 500;

        particles.forEach(particle => {
          // Accelerate particles toward camera (decreasing Z)
          particle.speed += 3;
          particle.z -= particle.speed;

          // Reset particle if it passes the camera
          if (particle.z < 1) {
            particle.x = (Math.random() - 0.5) * 2000;
            particle.y = (Math.random() - 0.5) * 2000;
            particle.z = 2000 + Math.random() * 1000;
            particle.speed = 0;
          }

          // Project 3D position to 2D screen
          const scale = fov / particle.z;
          const screenX = centerX + particle.x * scale;
          const screenY = centerY + particle.y * scale;

          // Calculate previous position for motion blur
          const prevZ = particle.z + particle.speed;
          const prevScale = fov / prevZ;
          const prevScreenX = centerX + particle.x * prevScale;
          const prevScreenY = centerY + particle.y * prevScale;

          // Only draw if on screen
          if (screenX > 0 && screenX < canvas.width && screenY > 0 && screenY < canvas.height) {
            // Draw particle as a line (motion blur effect)
            const opacity = Math.min(1, (2000 - particle.z) / 2000);
            const gradient = ctx.createLinearGradient(
              prevScreenX,
              prevScreenY,
              screenX,
              screenY
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
            gradient.addColorStop(1, `rgba(255, 255, 255, ${opacity * 0.9})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = particle.size * scale * 2;
            ctx.beginPath();
            ctx.moveTo(prevScreenX, prevScreenY);
            ctx.lineTo(screenX, screenY);
            ctx.stroke();
          }
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHyperspeed]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center cursor-pointer transition-opacity duration-1000 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClick}
    >
      {/* Hyperspeed Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full"
      />

      {/* CTC Text */}
      <div className="relative z-10">
        <h1 
          className={`text-8xl md:text-9xl lg:text-[12rem] font-primary font-bold text-white tracking-tighter transition-all duration-300 ${
            isHyperspeed 
              ? 'scale-150 blur-sm opacity-0' 
              : 'scale-100 animate-pulse-slow'
          }`}
          style={{
            textShadow: '0 0 40px rgba(255, 255, 255, 0.5), 0 0 80px rgba(255, 255, 255, 0.3)',
          }}
        >
          CTC
        </h1>
      </div>

      {/* Click hint */}
      {!isHyperspeed && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-zinc-500 text-sm font-secondary tracking-[0.3em] uppercase animate-fade-in-out">
          Click to enter
        </div>
      )}

      <style>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }

        @keyframes fade-in-out {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .animate-fade-in-out {
          animation: fade-in-out 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SplashPage;

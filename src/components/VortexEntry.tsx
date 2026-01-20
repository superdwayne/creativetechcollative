import { useRef, useState, useEffect } from 'react';

interface VortexEntryProps {
  onComplete?: () => void;
}

const VortexEntry: React.FC<VortexEntryProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [, setDepth] = useState(0); // Used to trigger re-renders
  const targetDepthRef = useRef(0); // Target depth (where user scrolls to)
  const smoothDepthRef = useRef(0); // Smoothly interpolated depth
  const animationRef = useRef<number>();
  const hasCompletedRef = useRef(false);

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

    // Scroll handler - scroll to journey into the vortex
    const handleScroll = (e: WheelEvent) => {
      e.preventDefault();
      // Scroll down = go deeper, scroll up = come back
      const scrollSpeed = 0.003;
      targetDepthRef.current = Math.max(0, Math.min(1, targetDepthRef.current + e.deltaY * scrollSpeed));
    };
    window.addEventListener('wheel', handleScroll, { passive: false });

   

    // Generate particles for subtle trail effect
    interface Particle {
      x: number;
      y: number;
      z: number;
      speed: number;
      size: number;
      brightness: number;
    }
    
    const particles: Particle[] = [];
    const numParticles = 50; // Reduced from 200
    
    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 200 + Math.random() * 600;
      particles.push({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        z: Math.random() * 6000,
        speed: 1 + Math.random() * 3, // Slower
        size: 0.5 + Math.random() * 1.5, // Smaller
        brightness: 0.2 + Math.random() * 0.4 // Dimmer
      });
    }

    // Animation loop
    const animate = () => {
      // Smooth interpolation - ease towards target depth
      const easing = 0.08; // Lower = smoother, higher = more responsive
      smoothDepthRef.current += (targetDepthRef.current - smoothDepthRef.current) * easing;
      
      // Update depth state for UI (rounded)
      const newDepth = Math.round(smoothDepthRef.current * 100);
      setDepth(newDepth);
      
      // Check for completion at 100%
      if (newDepth >= 100 && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        setTimeout(() => {
          setIsAnimating(false);
          setTimeout(() => onComplete?.(), 300);
        }, 500);
      }

      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width * 0.5;
      const centerY = canvas.height * 0.5;

      // Camera depth controlled by smooth interpolated value
      const cameraDepth = -500 + smoothDepthRef.current * 5500;

      // Tunnel parameters
      const numRings = 150;
      const numSegments = 48;
      const maxRadius = Math.max(canvas.width, canvas.height) * 1.5;
      const totalDepth = 6000;
      const fov = 400;

      // Draw tunnel rings
      for (let ring = 0; ring < numRings; ring++) {
        const t = ring / numRings;
        const ringDepth = t * totalDepth;
        const relativeDepth = ringDepth - cameraDepth;

        if (relativeDepth < 10) continue;

        const radius = maxRadius * Math.pow(1 - t, 0.5);
        const perspectiveScale = fov / relativeDepth;

        if (perspectiveScale < 0.01 || perspectiveScale > 10) continue;

        const opacity = Math.min(0.9, Math.max(0, 1 - relativeDepth / 1500));
        const lineWidth = Math.max(0.3, perspectiveScale * 3);

        if (opacity < 0.05) continue;

        const distanceFade = Math.min(1, relativeDepth / 1000);
        const white = Math.floor(255 - distanceFade * 50);
        ctx.strokeStyle = `rgba(${white}, ${white}, 255, ${opacity})`;
        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        for (let seg = 0; seg <= numSegments; seg++) {
          const angle = (seg / numSegments) * Math.PI * 2;
          const x3d = Math.cos(angle) * radius;
          const y3d = Math.sin(angle) * radius;
          const screenX = centerX + x3d * perspectiveScale;
          const screenY = centerY + y3d * perspectiveScale;

          if (seg === 0) ctx.moveTo(screenX, screenY);
          else ctx.lineTo(screenX, screenY);
        }
        ctx.stroke();
      }

      // Draw radial lines
      for (let seg = 0; seg < numSegments; seg++) {
        const baseAngle = (seg / numSegments) * Math.PI * 2;
        let prevX = 0, prevY = 0, firstPoint = true;

        for (let ring = 0; ring < numRings; ring++) {
          const t = ring / numRings;
          const ringDepth = t * totalDepth;
          const relativeDepth = ringDepth - cameraDepth;

          if (relativeDepth < 10) continue;

          const radius = maxRadius * Math.pow(1 - t, 0.5);
          const perspectiveScale = fov / relativeDepth;

          if (perspectiveScale < 0.01 || perspectiveScale > 10) continue;

          const opacity = Math.min(0.7, Math.max(0, 1 - relativeDepth / 1500));
          const x3d = Math.cos(baseAngle) * radius;
          const y3d = Math.sin(baseAngle) * radius;
          const screenX = centerX + x3d * perspectiveScale;
          const screenY = centerY + y3d * perspectiveScale;

          if (!firstPoint && opacity > 0.05) {
            const distanceFade = Math.min(1, relativeDepth / 1000);
            const white = Math.floor(255 - distanceFade * 50);
            ctx.strokeStyle = `rgba(${white}, ${white}, 255, ${opacity})`;
            ctx.lineWidth = Math.max(0.2, perspectiveScale * 2);
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(screenX, screenY);
            ctx.stroke();
          }

          prevX = screenX;
          prevY = screenY;
          firstPoint = false;
        }
      }

      // Draw and update particles (subtle floating dust)
      particles.forEach(particle => {
        // Move particle slowly towards camera
        particle.z -= particle.speed;
        
        // Reset particle if it passes the camera
        if (particle.z < cameraDepth - 100) {
          particle.z = cameraDepth + 5000 + Math.random() * 1000;
          const angle = Math.random() * Math.PI * 2;
          const distance = 200 + Math.random() * 600;
          particle.x = Math.cos(angle) * distance;
          particle.y = Math.sin(angle) * distance;
        }
        
        // Calculate perspective
        const relativeZ = particle.z - cameraDepth;
        if (relativeZ > 10 && relativeZ < 5000) {
          const scale = fov / relativeZ;
          const screenX = centerX + particle.x * scale;
          const screenY = centerY + particle.y * scale;
          
          // Only draw if on screen
          if (screenX > 0 && screenX < canvas.width && screenY > 0 && screenY < canvas.height) {
            const opacity = Math.min(0.6, Math.max(0, (1 - relativeZ / 4000))) * particle.brightness;
            const size = Math.max(0.5, particle.size * scale);
            
            // Simple dot - no glow
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.beginPath();
            ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Black hole center
      const holeDepth = totalDepth - cameraDepth;
      if (holeDepth > 50) {
        const holeScale = fov / holeDepth;
        const holeRadius = 80 * holeScale;

        if (holeRadius > 2) {
          const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, holeRadius * 3);
          gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
          gradient.addColorStop(0.3, 'rgba(0, 0, 30, 0.9)');
          gradient.addColorStop(0.6, 'rgba(0, 0, 60, 0.4)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, holeRadius * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw centered text "Creative Technology Collective"
      // Text stays at fixed size and always visible
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      const baseFontSize = 56;
      const lineHeight = 70;
      const textX = centerX - 150; // Position left of center
      
      // Main title - "Creative"
      ctx.font = `600 ${baseFontSize}px "PP Neue Montreal", "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText('Creative', textX, centerY - lineHeight);
      
      // "Technology"
      ctx.font = `600 ${baseFontSize}px "PP Neue Montreal", "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText('Technology', textX, centerY);
      
      // "Collective"
      ctx.font = `600 ${baseFontSize}px "PP Neue Montreal", "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText('Collective', textX, centerY + lineHeight);
      
      ctx.restore();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Auto-complete after 15 seconds
    const timeout = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => onComplete?.(), 500);
    }, 15000);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('wheel', handleScroll);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  if (!isAnimating) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-black transition-opacity duration-200 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {/* Skip button */}
      <button
        onClick={() => {
          setIsAnimating(false);
          setTimeout(() => onComplete?.(), 500);
        }}
        className="absolute bottom-8 right-8 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors text-sm border border-white/20"
      >
        Skip →
      </button>
    </div>
  );
};

export default VortexEntry;

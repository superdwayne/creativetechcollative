import React, { useRef, useEffect, useState } from 'react';
import { MemberData } from '../types/member';

interface InfiniteGridProps {
  memberData: MemberData[];
}

const InfiniteGrid: React.FC<InfiniteGridProps> = ({ memberData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Camera/viewport state
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [footerHeight, setFooterHeight] = useState(94);
  
  // Grid settings - VW Lab style
  const cellSize = 300; // Size of each grid cell
  const imageSize = 250; // Size of member images
  const gridSpacing = 50; // Spacing between images
  const maxVelocity = 15;
  const friction = 0.92;
  
  // Fallback data when no member data is available
  const fallbackMembers: MemberData[] = [
    { id: '1', name: 'Dwayne', description: 'Founder', image: '/members/Dwayne.png' },
    { id: '2', name: 'Adina', description: 'Designer', image: '/members/Adina.png' },
    { id: '3', name: 'Deniz', description: 'Developer', image: '/members/Deniz.png' },
    { id: '4', name: 'Erin', description: 'UX Researcher', image: '/members/erin.png' },
    { id: '5', name: 'Florido', description: 'Motion Designer', image: '/members/Florido.png' },
    { id: '6', name: 'James', description: 'Frontend Dev', image: '/members/James.png' },
    { id: '7', name: 'Jennifer', description: 'Product Manager', image: '/members/Jennifer.png' },
    { id: '8', name: 'Joshua', description: 'Backend Dev', image: '/members/Joshua.png' },
    { id: '9', name: 'Karolina', description: 'Brand Strategist', image: '/members/Karolina.png' },
    { id: '10', name: 'Koen', description: 'AI Engineer', image: '/members/Koen.png' },
    { id: '11', name: 'Martin', description: 'DevOps', image: '/members/Martin.png' },
    { id: '12', name: 'Pax', description: 'Content Strategist', image: '/members/Pax.png' },
    { id: '13', name: 'Rui', description: 'UI Designer', image: '/members/Rui.png' },
    { id: '14', name: 'John', description: 'Technologist', image: '/members/john.png' }
  ];

  // Use fallback data if no member data is provided
  const activeMembers = memberData.length > 0 ? memberData : fallbackMembers;
  
  // Image cache
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  
  // Preload images
  useEffect(() => {
    activeMembers.forEach(member => {
      if (!imageCache.current.has(member.image)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          imageCache.current.set(member.image, img);
        };
        img.onerror = () => {
          console.warn(`Failed to load image: ${member.image}`);
        };
        img.src = member.image;
      }
    });
  }, [activeMembers]);

  // Calculate footer height
  useEffect(() => {
    const calculateFooterHeight = () => {
      const height = window.innerWidth >= 768 ? 112 : 94;
      setFooterHeight(height);
    };
    
    calculateFooterHeight();
    window.addEventListener('resize', calculateFooterHeight);
    return () => window.removeEventListener('resize', calculateFooterHeight);
  }, []);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Get member for grid position - infinite tiling
  const getMemberAtPosition = (gridX: number, gridY: number): MemberData => {
    // Create infinite tiling pattern
    const memberIndex = (Math.abs(gridX) + Math.abs(gridY * 3)) % activeMembers.length;
    return activeMembers[memberIndex];
  };

  // Render function
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate visible grid bounds with padding
    const padding = 2;
    const startX = Math.floor((camera.x - padding * cellSize) / cellSize);
    const endX = Math.ceil((camera.x + width + padding * cellSize) / cellSize);
    const startY = Math.floor((camera.y - padding * cellSize) / cellSize);
    const endY = Math.ceil((camera.y + height + padding * cellSize) / cellSize);

    // Draw grid of member images
    for (let gridX = startX; gridX <= endX; gridX++) {
      for (let gridY = startY; gridY <= endY; gridY++) {
        const member = getMemberAtPosition(gridX, gridY);
        const image = imageCache.current.get(member.image);
        
        if (image && image.complete) {
          // Calculate position on screen
          const screenX = (gridX * cellSize) - camera.x;
          const screenY = (gridY * cellSize) - camera.y;
          
          // Only draw if visible
          if (screenX + imageSize > 0 && screenX < width && 
              screenY + imageSize > 0 && screenY < height) {
            
            // Draw image with rounded corners
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(
              screenX + (cellSize - imageSize) / 2, 
              screenY + (cellSize - imageSize) / 2, 
              imageSize, 
              imageSize, 
              20
            );
            ctx.clip();
            
            ctx.drawImage(
              image, 
              screenX + (cellSize - imageSize) / 2, 
              screenY + (cellSize - imageSize) / 2, 
              imageSize, 
              imageSize
            );
            ctx.restore();
            
            // Add subtle border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(
              screenX + (cellSize - imageSize) / 2, 
              screenY + (cellSize - imageSize) / 2, 
              imageSize, 
              imageSize, 
              20
            );
            ctx.stroke();
            
            // Add member name overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(
              screenX + (cellSize - imageSize) / 2, 
              screenY + (cellSize - imageSize) / 2 + imageSize - 40, 
              imageSize, 
              40
            );
            
            ctx.fillStyle = 'white';
            ctx.font = '14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
              member.name,
              screenX + cellSize / 2,
              screenY + (cellSize - imageSize) / 2 + imageSize - 15
            );
          }
        } else {
          // Draw placeholder for loading images
          const screenX = (gridX * cellSize) - camera.x;
          const screenY = (gridY * cellSize) - camera.y;
          
          if (screenX + imageSize > 0 && screenX < width && 
              screenY + imageSize > 0 && screenY < height) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.roundRect(
              screenX + (cellSize - imageSize) / 2, 
              screenY + (cellSize - imageSize) / 2, 
              imageSize, 
              imageSize, 
              20
            );
            ctx.fill();
          }
        }
      }
    }
  };

  // Animation loop
  useEffect(() => {
    const animate = () => {
      // Apply momentum
      if (!isDragging && (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1)) {
        setCamera(prev => ({
          x: prev.x + velocity.x,
          y: prev.y + velocity.y
        }));
        
        setVelocity(prev => ({
          x: prev.x * friction,
          y: prev.y * friction
        }));
      }
      
      render();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [camera, velocity, isDragging, activeMembers]);

  // Mouse/touch interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getEventPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const pos = getEventPos(e);
      setIsDragging(true);
      setLastMouse(pos);
      setVelocity({ x: 0, y: 0 });
      canvas.style.cursor = 'grabbing';
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const pos = getEventPos(e);
      const deltaX = pos.x - lastMouse.x;
      const deltaY = pos.y - lastMouse.y;
      
      // Update camera position (inverted for natural feel)
      setCamera(prev => ({
        x: prev.x - deltaX,
        y: prev.y - deltaY
      }));
      
      // Store velocity for momentum
      setVelocity({
        x: Math.max(-maxVelocity, Math.min(maxVelocity, -deltaX)),
        y: Math.max(-maxVelocity, Math.min(maxVelocity, -deltaY))
      });
      
      setLastMouse(pos);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      canvas.style.cursor = 'grab';
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const sensitivity = 2;
      
      setCamera(prev => ({
        x: prev.x + e.deltaX * sensitivity,
        y: prev.y + e.deltaY * sensitivity
      }));
      
      setVelocity({
        x: Math.max(-maxVelocity, Math.min(maxVelocity, e.deltaX * 0.5)),
        y: Math.max(-maxVelocity, Math.min(maxVelocity, e.deltaY * 0.5))
      });
    };

    // Mouse events
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('mouseleave', handlePointerUp);
    
    // Touch events
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    canvas.addEventListener('touchend', handlePointerUp);
    
    // Wheel event
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('mouseup', handlePointerUp);
      canvas.removeEventListener('mouseleave', handlePointerUp);
      canvas.removeEventListener('touchstart', handlePointerDown);
      canvas.removeEventListener('touchmove', handlePointerMove);
      canvas.removeEventListener('touchend', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [isDragging, lastMouse, maxVelocity]);

  if (activeMembers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-lg">No members available...</div>
      </div>
    );
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 bg-black overflow-hidden select-none"
      style={{ bottom: `${footerHeight}px` }}
    >
      <div
        ref={containerRef}
        className="w-full h-full"
      >
        <canvas
          ref={canvasRef}
          className="cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        />
      </div>
      
      {/* Instructions overlay */}
      <div className="absolute top-6 left-6 text-white/60 text-sm font-light pointer-events-none z-10">
        <p>Drag to explore • Infinite Grid</p>
        <p className="text-xs mt-1 opacity-75">Inspired by VW Lab</p>
      </div>

      {/* Member count overlay */}
      <div className="absolute bottom-6 left-6 text-white/80 text-sm font-light pointer-events-none z-10">
        <p>Exploring {activeMembers.length} creative minds</p>
      </div>

      {/* Navigation hint */}
      <div className="absolute top-6 right-6 text-white/60 text-sm font-light pointer-events-none z-10">
        <p>∞ Infinite Grid</p>
      </div>
    </div>
  );
};

export default InfiniteGrid;

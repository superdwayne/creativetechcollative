import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MemberData } from '../types/member';

interface InfinityGridProps {
  memberData: MemberData[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const InfinityGrid: React.FC<InfinityGridProps> = ({ memberData, isLoading, setIsLoading }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 });
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Grid settings
  const cardWidth = 300;
  const cardHeight = 375; // 4:5 aspect ratio
  const cellWidth = cardWidth;
  const cellHeight = cardHeight;

  // Update window size and canvas
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Load images
  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = memberData.map((member) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            imagesRef.current.set(member.id, img);
            resolve();
          };
          img.onerror = () => {
            // Create a placeholder for failed images
            const canvas = document.createElement('canvas');
            canvas.width = cardWidth;
            canvas.height = cardHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.fillStyle = '#f0f0f0';
              ctx.fillRect(0, 0, cardWidth, cardHeight);
              ctx.fillStyle = '#999';
              ctx.font = '16px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(member.name, cardWidth / 2, cardHeight / 2);
            }
            const placeholderImg = new Image();
            placeholderImg.src = canvas.toDataURL();
            imagesRef.current.set(member.id, placeholderImg);
            resolve();
          };
          img.src = member.image;
        });
      });

      await Promise.all(imagePromises);
      setIsLoading(false);
    };

    if (memberData.length > 0) {
      loadImages();
    }
  }, [memberData, setIsLoading]);

  // Canvas rendering function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx || memberData.length === 0) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate visible grid
    const margin = Math.max(cardWidth, cardHeight);
    const tilesX = Math.ceil((windowSize.width + margin * 2) / cellWidth) + 2;
    const tilesY = Math.ceil((windowSize.height + margin * 2) / cellHeight) + 2;
    const startX = Math.floor((offset.x - margin) / cellWidth);
    const startY = Math.floor((offset.y - margin) / cellHeight);

    // Draw grid tiles
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        const tileX = startX + x;
        const tileY = startY + y;
        
        // Calculate screen position
        const screenX = tileX * cellWidth + offset.x;
        const screenY = tileY * cellHeight + offset.y;
        
        // Skip if not visible
        if (screenX + cardWidth < 0 || screenX > windowSize.width || 
            screenY + cardHeight < 0 || screenY > windowSize.height) {
          continue;
        }
        
        // Get member using modulo for infinite repetition
        const gridCols = Math.ceil(windowSize.width / cellWidth) + 2;
        const memberIndex = ((Math.abs(tileY) * gridCols) + Math.abs(tileX)) % memberData.length;
        const member = memberData[memberIndex];
        const memberKey = `${member.id}-${tileX}-${tileY}`;
        
        // Draw image
        const img = imagesRef.current.get(member.id);
        if (img) {
          ctx.drawImage(img, screenX, screenY, cardWidth, cardHeight);
        }
        
        // Draw hover overlay
        if (hoveredMember === memberKey) {
          // Dark overlay
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(screenX, screenY, cardWidth, cardHeight);
          
          // Text
          ctx.fillStyle = 'white';
          ctx.font = 'bold 18px Arial';
          ctx.textAlign = 'center';
          const textY = screenY + cardHeight - 60;
          ctx.fillText(member.name, screenX + cardWidth / 2, textY);
          
          ctx.font = '12px Arial';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillText(member.description || 'Creative Technologist', screenX + cardWidth / 2, textY + 20);
          
          // Small dot indicator
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(screenX + cardWidth - 15, screenY + 15, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [offset, windowSize, memberData, hoveredMember, cardWidth, cardHeight, cellWidth, cellHeight]);

  // Mouse hover detection
  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setMousePos({ x: mouseX, y: mouseY });
    
    // Check for hover
    const margin = Math.max(cardWidth, cardHeight);
    const tilesX = Math.ceil((windowSize.width + margin * 2) / cellWidth) + 2;
    const tilesY = Math.ceil((windowSize.height + margin * 2) / cellHeight) + 2;
    const startX = Math.floor((offset.x - margin) / cellWidth);
    const startY = Math.floor((offset.y - margin) / cellHeight);
    
    let newHoveredMember = null;
    
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        const tileX = startX + x;
        const tileY = startY + y;
        const screenX = tileX * cellWidth + offset.x;
        const screenY = tileY * cellHeight + offset.y;
        
        if (mouseX >= screenX && mouseX <= screenX + cardWidth &&
            mouseY >= screenY && mouseY <= screenY + cardHeight) {
          const gridCols = Math.ceil(windowSize.width / cellWidth) + 2;
          const memberIndex = ((Math.abs(tileY) * gridCols) + Math.abs(tileX)) % memberData.length;
          const member = memberData[memberIndex];
          newHoveredMember = `${member.id}-${tileX}-${tileY}`;
          break;
        }
      }
      if (newHoveredMember) break;
    }
    
    setHoveredMember(newHoveredMember);
    
    // Handle dragging
    if (isDragging) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      
      setOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setVelocity({ x: deltaX, y: deltaY });
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    setVelocity({ x: 0, y: 0 });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setLastMousePos({ x: touch.clientX, y: touch.clientY });
    setVelocity({ x: 0, y: 0 });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - lastMousePos.x;
    const deltaY = touch.clientY - lastMousePos.y;
    
    setOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setVelocity({ x: deltaX, y: deltaY });
    setLastMousePos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Momentum scrolling
  useEffect(() => {
    if (!isDragging && (Math.abs(velocity.x) > 1 || Math.abs(velocity.y) > 1)) {
      const momentum = setInterval(() => {
        setVelocity(prev => ({
          x: prev.x * 0.95,
          y: prev.y * 0.95
        }));
        
        setOffset(prev => ({
          x: prev.x + velocity.x,
          y: prev.y + velocity.y
        }));
        
        if (Math.abs(velocity.x) < 0.1 && Math.abs(velocity.y) < 0.1) {
          clearInterval(momentum);
          setVelocity({ x: 0, y: 0 });
        }
      }, 16);
      
      return () => clearInterval(momentum);
    }
  }, [isDragging, velocity.x, velocity.y]);

  // Render loop
  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      render();
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [render]);

  // Momentum scrolling
  useEffect(() => {
    if (!isDragging && (Math.abs(velocity.x) > 1 || Math.abs(velocity.y) > 1)) {
      const momentum = setInterval(() => {
        setVelocity(prev => ({
          x: prev.x * 0.95,
          y: prev.y * 0.95
        }));
        
        setOffset(prev => ({
          x: prev.x + velocity.x,
          y: prev.y + velocity.y
        }));
        
        if (Math.abs(velocity.x) < 0.1 && Math.abs(velocity.y) < 0.1) {
          clearInterval(momentum);
          setVelocity({ x: 0, y: 0 });
        }
      }, 16);
      
      return () => clearInterval(momentum);
    }
  }, [isDragging, velocity.x, velocity.y]);

  return (
    <div className="fixed inset-0 bg-white overflow-hidden">
      <canvas
        ref={canvasRef}
        className="cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveCanvas}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      />
      
      {/* Instructions overlay */}
      <div className="absolute top-6 left-6 text-black/60 text-sm font-light pointer-events-none">
        <p>Drag to explore</p>
      </div>
    </div>
  );
};

export default InfinityGrid;

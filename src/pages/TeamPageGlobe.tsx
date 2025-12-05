import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  row: number; // Which row/section this member belongs to (0, 1, or 2)
}

// Team members with placeholder images - distributed across 3 rows
const teamMembers: TeamMember[] = [
  // Row 0 - Top
  { id: '1', name: 'Dwayne Paisley-Marshall', role: 'Founder & Creative Director', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop', row: 0 },
  { id: '2', name: 'Adina', role: 'Lead Designer', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop', row: 0 },
  { id: '3', name: 'Deniz', role: 'Technical Lead', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop', row: 0 },
  { id: '4', name: 'Erin', role: 'UX Researcher', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop', row: 0 },
  // Row 1 - Middle
  { id: '5', name: 'Florido', role: 'Motion Designer', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop', row: 1 },
  { id: '6', name: 'James', role: 'Frontend Developer', image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=500&fit=crop', row: 1 },
  { id: '7', name: 'Jennifer', role: 'Product Manager', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop', row: 1 },
  { id: '8', name: 'Joshua', role: 'Backend Developer', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop', row: 1 },
  // Row 2 - Bottom
  { id: '9', name: 'Karolina', role: 'Brand Strategist', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop', row: 2 },
  { id: '10', name: 'Koen', role: 'AI Engineer', image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=500&fit=crop', row: 2 },
  { id: '11', name: 'Martin', role: 'DevOps Engineer', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop', row: 2 },
  { id: '12', name: 'Pax', role: 'Content Strategist', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop', row: 2 },
];

// Get members by row
const getRowMembers = (row: number) => teamMembers.filter(m => m.row === row);

// Width of the virtual canvas for each row (for infinite scroll)
const ROW_WIDTH = 2400; // Total width before repeating

// Generate scattered positions for each member within their row
const memberPositions = teamMembers.map((member) => {
  const rowMembers = getRowMembers(member.row);
  const indexInRow = rowMembers.findIndex(m => m.id === member.id);
  const membersInRow = rowMembers.length;
  
  // Spread members across the row width with some randomness
  const baseX = (indexInRow / membersInRow) * ROW_WIDTH;
  
  return {
    x: baseX + (Math.random() - 0.5) * 150, // Base X with jitter
    y: (Math.random() - 0.5) * 80, // Vertical jitter within row
    scale: 0.85 + Math.random() * 0.3,
    rotation: (Math.random() - 0.5) * 8, // Slight tilt
  };
});

// Diamond decoration component
const Diamond: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div 
    style={{
      position: 'absolute',
      width: 12,
      height: 12,
      background: 'linear-gradient(135deg, #a8d5ba 0%, #7fb99b 100%)',
      transform: 'rotate(45deg)',
      opacity: 0.5,
      pointerEvents: 'none',
      ...style,
    }}
  />
);

// Row configuration - each row scrolls independently in different directions
const ROW_CONFIG = [
  { direction: 1, speed: 1 },     // Top row - scrolls right
  { direction: -1, speed: 1.2 },  // Middle row - scrolls left (opposite)
  { direction: 1, speed: 0.8 },   // Bottom row - scrolls right, slower
];

const TeamPageGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Separate scroll offset for each row (in pixels)
  const [scrollOffsets, setScrollOffsets] = useState([0, 0, 0]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  
  // Separate velocity for each row
  const velocitiesRef = useRef([0, 0, 0]);
  const lastTouchRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastMouseXRef = useRef(0);

  // Card dimensions
  const cardWidth = 240;
  const cardHeight = 300;

  // Determine which row the mouse is over based on Y position
  const getRowFromY = useCallback((y: number) => {
    const height = window.innerHeight;
    const rowHeight = height / 3;
    if (y < rowHeight) return 0;
    if (y < rowHeight * 2) return 1;
    return 2;
  }, []);

  // Handle wheel scroll - affects row under cursor
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const row = getRowFromY(e.clientY);
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    const config = ROW_CONFIG[row];
    velocitiesRef.current[row] += delta * 0.8 * config.direction * config.speed;
  }, [getRowFromY]);

  // Handle mouse drag
  const handleMouseDown = useCallback((e: MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseXRef.current = e.clientX;
    setActiveRow(getRowFromY(e.clientY));
  }, [getRowFromY]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || activeRow === null) return;
    const delta = e.clientX - lastMouseXRef.current;
    const config = ROW_CONFIG[activeRow];
    velocitiesRef.current[activeRow] -= delta * 1.5 * config.direction * config.speed;
    lastMouseXRef.current = e.clientX;
  }, [activeRow]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    setActiveRow(null);
  }, []);

  // Handle touch events
  const handleTouchStart = useCallback((e: TouchEvent) => {
    lastTouchRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
    setActiveRow(getRowFromY(e.touches[0].clientY));
  }, [getRowFromY]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDraggingRef.current || activeRow === null) return;
    const delta = e.touches[0].clientX - lastTouchRef.current;
    const config = ROW_CONFIG[activeRow];
    velocitiesRef.current[activeRow] -= delta * 2 * config.direction * config.speed;
    lastTouchRef.current = e.touches[0].clientX;
  }, [activeRow]);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    setActiveRow(null);
  }, []);

  // Animation loop with momentum for all rows (no auto-scroll)
  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      setScrollOffsets(prev => {
        const newOffsets = [...prev];
        let hasMovement = false;
        
        for (let i = 0; i < 3; i++) {
          // Apply velocity with friction
          newOffsets[i] = prev[i] + velocitiesRef.current[i];
          velocitiesRef.current[i] *= 0.95; // Friction
          
          // Wrap around for infinite scroll
          if (newOffsets[i] > ROW_WIDTH) newOffsets[i] -= ROW_WIDTH;
          if (newOffsets[i] < 0) newOffsets[i] += ROW_WIDTH;
          
          // Check if still moving
          if (Math.abs(velocitiesRef.current[i]) > 0.01) {
            hasMovement = true;
          } else {
            velocitiesRef.current[i] = 0;
          }
        }
        
        return hasMovement ? newOffsets : prev;
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Row Y positions (centered vertically with spacing)
  const getRowY = (row: number) => {
    const rowHeight = window.innerHeight / 3;
    return rowHeight * row + rowHeight / 2;
  };

  // Calculate position for each card with infinite horizontal scroll
  const getCardStyle = (member: TeamMember, index: number): React.CSSProperties => {
    const pos = memberPositions[index];
    const row = member.row;
    const scrollOffset = scrollOffsets[row];
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    
    // Calculate X position with wrapping
    let x = pos.x - scrollOffset;
    
    // Wrap around for infinite scroll - create copies on both sides
    while (x < -cardWidth) x += ROW_WIDTH;
    while (x > ROW_WIDTH) x -= ROW_WIDTH;
    
    // Center the row and add Y jitter
    const y = getRowY(row) + pos.y;
    
    // Only show if within extended viewport
    const isVisible = x > -cardWidth * 2 && x < viewportWidth + cardWidth * 2;
    
    return {
      position: 'absolute',
      left: 0,
      top: 0,
      width: cardWidth,
      height: cardHeight,
      transform: `
        translateX(${x}px)
        translateY(${y - cardHeight / 2}px)
        scale(${pos.scale})
        rotate(${pos.rotation}deg)
      `,
      opacity: isVisible && isLoaded ? 1 : 0,
      zIndex: 10 + (2 - row) * 10,
      transition: 'opacity 0.3s ease',
      cursor: 'pointer',
    };
  };

  // Get visible member count based on scroll position
  const getVisibleCount = () => {
    return Math.floor(scrollOffsets[1] / (ROW_WIDTH / teamMembers.length)) % teamMembers.length + 1;
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-[#f5f3ef] overflow-hidden select-none"
      style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
    >
      {/* Floating diamonds */}
      <Diamond style={{ top: '15%', left: '8%' }} />
      <Diamond style={{ top: '25%', right: '12%' }} />
      <Diamond style={{ top: '45%', left: '5%' }} />
      <Diamond style={{ top: '65%', right: '8%' }} />
      <Diamond style={{ top: '75%', left: '15%' }} />
      <Diamond style={{ top: '35%', right: '25%' }} />
      <Diamond style={{ top: '55%', left: '20%' }} />
      <Diamond style={{ top: '85%', right: '18%' }} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-6 flex items-center justify-between pointer-events-none">
        <div 
          className="pointer-events-auto"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateX(0)' : 'translateX(-20px)',
            transition: 'all 0.6s ease',
          }}
        >
          <span className="text-sm font-light tracking-widest uppercase text-[#1a1a1a]/60">
            CTC Collective
          </span>
        </div>
        
        <div 
          className="text-sm text-[#1a1a1a]/50 tracking-wider"
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.6s ease 0.2s',
          }}
        >
          Scroll to explore
        </div>
        
        <a
          href="/"
          className="text-sm font-light tracking-widest uppercase text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors pointer-events-auto"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateX(0)' : 'translateX(20px)',
            transition: 'all 0.6s ease',
          }}
        >
          Back
        </a>
      </header>

      {/* Info panel - bottom left */}
      <div 
        className="fixed bottom-8 left-8 z-40 max-w-xs"
        style={{
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease 0.4s',
        }}
      >
        <p className="text-[#1a1a1a]/40 text-xs uppercase tracking-widest mb-2">
          Our Team
        </p>
        <p className="text-[#1a1a1a]/60 text-sm leading-relaxed">
          Click on any member to<br />
          explore their story and<br />
          creative journey
        </p>
      </div>

      {/* 3D Cylinder of cards - three independent rotating rows */}
      <div className="absolute inset-0 flex items-center justify-center">
        {teamMembers.map((member, index) => (
          <div
            key={member.id}
            style={getCardStyle(member, index)}
            onMouseEnter={() => setHoveredId(member.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Diamond decorations on cards */}
            <Diamond style={{ top: -6, left: -6, width: 10, height: 10 }} />
            <Diamond style={{ bottom: -4, right: -4, width: 8, height: 8 }} />
            
            <div 
              className="relative w-full h-full overflow-hidden rounded-sm shadow-xl"
              style={{
                transform: hoveredId === member.id ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.3s ease',
              }}
            >
              <img
                src={member.image}
                alt={member.name}
                className="w-full h-full object-cover"
                style={{
                  filter: hoveredId === member.id ? 'none' : 'sepia(15%) saturate(85%)',
                  transition: 'filter 0.3s ease',
                }}
                draggable={false}
              />
              
              {/* Hover overlay */}
              <div 
                className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4"
                style={{
                  opacity: hoveredId === member.id ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }}
              >
                <h3 className="font-serif text-lg text-white mb-1">{member.name}</h3>
                <p className="text-white/70 text-xs uppercase tracking-widest">{member.role}</p>
              </div>
              
              {/* Border */}
              <div 
                className="absolute inset-0 border border-white/10 rounded-sm pointer-events-none"
                style={{
                  borderColor: hoveredId === member.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  transition: 'border-color 0.3s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Counter - bottom center */}
      <div 
        className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-40"
        style={{
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease 0.5s',
        }}
      >
        <div className="bg-[#1a1a1a] text-white px-4 py-2 text-sm font-mono tracking-wider">
          {String(getVisibleCount()).padStart(2, '0')} : {String(teamMembers.length).padStart(2, '0')}
        </div>
        <button className="w-8 h-8 bg-[#7fb99b] flex items-center justify-center text-white text-xs rounded-sm hover:bg-[#6da889] transition-colors">
          i
        </button>
      </div>

      {/* Scroll indicator - bottom right */}
      <div 
        className="fixed bottom-8 right-8 z-40"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.6s ease 0.6s',
        }}
      >
        <div className="w-10 h-10 border border-[#1a1a1a]/20 rounded-full flex items-center justify-center">
          <div 
            className="w-6 h-6 border-t-2 border-r-2 border-[#1a1a1a]/30 rounded-tr-sm"
            style={{ transform: 'rotate(45deg)' }}
          />
        </div>
      </div>

      {/* Custom styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&display=swap');
        
        .font-serif {
          font-family: 'Playfair Display', Georgia, serif;
        }
        
        /* Hide scrollbar */
        ::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default TeamPageGlobe;

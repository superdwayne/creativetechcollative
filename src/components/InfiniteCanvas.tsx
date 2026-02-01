import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { NetworkProfile } from '@/types/network-profile';
import { ArrowRight, BadgeCheck, ZoomIn, ZoomOut, Compass, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfiniteCanvasProps {
  profiles: NetworkProfile[];
}

interface Position {
  x: number;
  y: number;
}

// Generate deterministic position based on profile data
const getProfilePosition = (profile: NetworkProfile, index: number, total: number): Position => {
  // Create a hash from the profile name for consistent positioning
  const hash = profile.fullName.split('').reduce((acc, char, i) => {
    return acc + char.charCodeAt(0) * (i + 1);
  }, 0);

  // Spiral layout with some randomness
  const angle = (index / total) * Math.PI * 6 + (hash % 100) / 100;
  const radius = 200 + (index * 80) + (hash % 150);

  // Add some organic variation
  const offsetX = Math.sin(hash) * 100;
  const offsetY = Math.cos(hash * 2) * 100;

  return {
    x: Math.cos(angle) * radius + offsetX,
    y: Math.sin(angle) * radius + offsetY,
  };
};

// Get card size based on profile richness
const getCardSize = (profile: NetworkProfile): 'large' | 'medium' | 'small' => {
  const hasPhoto = !!profile.profilePictureUrl;
  const hasProjects = profile.projects && profile.projects.length > 0;
  const hasBio = profile.bio && profile.bio.length > 100;

  if (hasPhoto && hasProjects) return 'large';
  if (hasPhoto || hasProjects || hasBio) return 'medium';
  return 'small';
};

// Generate unique gradient for each profile
const getProfileGradient = (name: string): string => {
  const gradients = [
    'from-violet-900/40 to-purple-950/60',
    'from-blue-900/40 to-indigo-950/60',
    'from-emerald-900/40 to-teal-950/60',
    'from-rose-900/40 to-pink-950/60',
    'from-amber-900/40 to-orange-950/60',
    'from-cyan-900/40 to-sky-950/60',
    'from-fuchsia-900/40 to-purple-950/60',
    'from-lime-900/40 to-green-950/60',
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({ profiles }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.8);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [hoveredProfile, setHoveredProfile] = useState<string | null>(null);

  // Calculate positions for all profiles
  const profilePositions = profiles.map((profile, index) => ({
    profile,
    position: getProfilePosition(profile, index, profiles.length),
    size: getCardSize(profile),
  }));

  // Handle mouse/touch pan
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('a')) return; // Don't drag when clicking links
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle zoom with wheel
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.min(Math.max(0.3, z + delta), 2));
  }, []);

  // Attach wheel listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Zoom controls
  const zoomIn = () => setZoom(z => Math.min(2, z + 0.2));
  const zoomOut = () => setZoom(z => Math.max(0.3, z - 0.2));
  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(0.8);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-200px)] min-h-[600px] bg-zinc-950 overflow-hidden cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at center, rgba(139, 92, 246, 0.03) 0%, transparent 70%),
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: `100% 100%, ${60 * zoom}px ${60 * zoom}px, ${60 * zoom}px ${60 * zoom}px`,
          backgroundPosition: `center, ${pan.x}px ${pan.y}px, ${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Canvas content */}
      <div
        className="absolute top-1/2 left-1/2 transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center',
        }}
      >
        {/* Center point indicator */}
        <div className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4">
          <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
          <div className="absolute inset-1 rounded-full bg-purple-500/40" />
        </div>

        {/* Profile cards */}
        {profilePositions.map(({ profile, position, size }) => (
          <Link
            key={profile.id}
            to={`/directory/profile/${profile.slug}`}
            className={cn(
              "absolute block transition-all duration-300",
              "hover:z-50 hover:scale-105",
              "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:scale-105",
              isDragging && "pointer-events-none"
            )}
            style={{
              left: position.x,
              top: position.y,
              transform: 'translate(-50%, -50%)',
            }}
            onMouseEnter={() => setHoveredProfile(profile.id)}
            onMouseLeave={() => setHoveredProfile(null)}
            onClick={(e) => isDragging && e.preventDefault()}
          >
            {size === 'large' ? (
              // Large card - photo + info
              <div className={cn(
                "w-64 bg-gradient-to-br border border-white/10 overflow-hidden group",
                "hover:border-white/20 hover:shadow-2xl hover:shadow-purple-500/10",
                getProfileGradient(profile.fullName)
              )}>
                {profile.profilePictureUrl && (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={profile.profilePictureUrl}
                      alt={profile.fullName}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-primary text-white truncate">{profile.fullName}</h3>
                    {profile.isCtcMember && <BadgeCheck className="h-4 w-4 text-purple-400/60 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1 text-zinc-500 text-xs font-secondary mb-2">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{profile.location}</span>
                  </div>
                  <p className="text-xs text-zinc-400 font-secondary line-clamp-2">{profile.bio}</p>
                </div>
              </div>
            ) : size === 'medium' ? (
              // Medium card - name + details
              <div className={cn(
                "w-48 p-4 bg-gradient-to-br border border-white/10 group",
                "hover:border-white/20 hover:shadow-xl hover:shadow-purple-500/10",
                getProfileGradient(profile.fullName)
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {profile.profilePictureUrl ? (
                    <img src={profile.profilePictureUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-primary">
                      {profile.fullName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-primary text-white truncate">{profile.fullName}</h3>
                    <p className="text-[10px] text-zinc-500 font-secondary truncate">{profile.location}</p>
                  </div>
                </div>
                {profile.skills && profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {profile.skills.slice(0, 2).map((skill, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 bg-white/5 text-zinc-400 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Small card - minimal
              <div className={cn(
                "px-4 py-3 bg-gradient-to-br border border-white/10 group",
                "hover:border-white/20 hover:shadow-lg hover:shadow-purple-500/10",
                getProfileGradient(profile.fullName)
              )}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-primary">
                    {profile.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-primary text-white whitespace-nowrap">{profile.fullName}</h3>
                    <p className="text-[10px] text-zinc-500 font-secondary">{profile.location.split(',')[0]}</p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-zinc-600 group-hover:text-white ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-50">
        <button
          onClick={zoomIn}
          className="p-2 bg-zinc-900/90 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 bg-zinc-900/90 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={resetView}
          className="p-2 bg-zinc-900/90 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
        >
          <Compass className="h-4 w-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="absolute top-4 left-4 bg-zinc-900/90 border border-white/10 p-4 z-50">
        <div className="text-[10px] font-secondary text-zinc-600 uppercase tracking-wider mb-1">Exploring</div>
        <div className="text-2xl font-primary text-white">{profiles.length}</div>
        <div className="text-[10px] font-secondary text-zinc-600 uppercase tracking-wider">Creatives</div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-xs font-secondary text-zinc-600 z-50">
        Drag to explore • Scroll to zoom • Click to discover
      </div>

      {/* Zoom indicator */}
      <div className="absolute top-4 right-4 bg-zinc-900/90 border border-white/10 px-3 py-2 z-50">
        <span className="text-xs font-secondary text-zinc-500">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};

export default InfiniteCanvas;

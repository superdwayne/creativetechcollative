import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { NetworkProfile } from '@/types/network-profile';
import { cn } from '@/lib/utils';

interface ArchiveGridProps {
  profiles: NetworkProfile[];
  onClose?: () => void;
  isLoading?: boolean;
}

/**
 * HAU.studio Archive Grid (100% match)
 *
 * Exact layout from hau.studio/archive/:
 * - Single horizontal row (flex-direction: row, flex-wrap: nowrap)
 * - Items staggered vertically within the row
 * - Pure horizontal scrolling via transform
 * - 386px wide items, 40px gap
 * - Text hidden until hover, 0.3s transitions
 */

const ArchiveGrid: React.FC<ArchiveGridProps> = ({ profiles, onClose, isLoading = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation state
  const [translateX, setTranslateX] = useState(0);
  const [targetX, setTargetX] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // HAU.studio exact dimensions
  const CARD_WIDTH = 386;
  const CARD_HEIGHT = 480;
  const GAP = 40;

  // Generate staggered Y offsets for each profile (HAU-style vertical variance)
  const yOffsets = useMemo(() => {
    return profiles.map((_, i) => {
      // Create a repeating pattern of Y offsets for visual rhythm
      const patterns = [0, 80, 160, 60, 120, 40, 140, 20, 100, 180];
      return patterns[i % patterns.length];
    });
  }, [profiles]);

  // Canvas width for horizontal scroll
  const canvasWidth = profiles.length * (CARD_WIDTH + GAP) + 400;
  const maxX = Math.max(0, canvasWidth - (typeof window !== 'undefined' ? window.innerWidth : 1920));

  // Start slightly offset
  useEffect(() => {
    const startX = -maxX * 0.05;
    setTargetX(startX);
    setTranslateX(startX);
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, [maxX]);

  // Smooth horizontal animation
  useEffect(() => {
    let raf: number;
    const animate = () => {
      setTranslateX(prev => {
        const diff = targetX - prev;
        return Math.abs(diff) < 0.5 ? targetX : prev + diff * 0.1;
      });
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [targetX]);

  const markScrolling = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 150);
  }, []);

  // Wheel - pure horizontal scroll
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    markScrolling();
    // Use both deltaX and deltaY for horizontal movement
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    setTargetX(prev => Math.max(-maxX, Math.min(0, prev - delta * 1.5)));
  }, [maxX, markScrolling]);

  // Keyboard - horizontal only
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) { onClose(); return; }
    const step = 400;
    if (e.key === 'ArrowRight') { e.preventDefault(); markScrolling(); setTargetX(prev => Math.max(-maxX, prev - step)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); markScrolling(); setTargetX(prev => Math.min(0, prev + step)); }
  }, [maxX, onClose, markScrolling]);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    c.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      c.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [handleWheel, handleKeyDown]);

  // Drag - horizontal only
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, tx: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    setIsDragging(true);
    markScrolling();
    dragStart.current = { x: e.clientX, tx: targetX };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [targetX, markScrolling]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    setTargetX(Math.max(-maxX, Math.min(0, dragStart.current.tx + dx)));
  }, [isDragging, maxX]);

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  const isEmpty = profiles.length === 0 && !isLoading;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden z-50"
      style={{
        backgroundColor: '#fff',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Back button - HAU style */}
      {onClose && (
        <button
          onClick={onClose}
          className="fixed top-8 left-10 z-50 pointer-events-auto"
          style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(30,30,30,0.4)',
            transition: 'color 0.3s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(30,30,30,1)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(30,30,30,0.4)'}
        >
          ← Back
        </button>
      )}

      {/* Archive count - HAU style */}
      <div
        className="fixed top-8 right-10 z-50 text-right pointer-events-none"
        style={{ color: '#1e1e1e' }}
      >
        <div style={{
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.35em',
          textTransform: 'uppercase',
          color: 'rgba(30,30,30,0.4)',
          marginBottom: '4px'
        }}>
          Archive
        </div>
        <div style={{
          fontSize: 'clamp(48px, 5vw, 72px)',
          fontWeight: 200,
          lineHeight: 0.9,
          letterSpacing: '-0.02em'
        }}>
          {profiles.length.toString().padStart(2, '0')}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border border-neutral-200 border-t-neutral-400 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p style={{ color: 'rgba(30,30,30,0.4)', fontSize: '14px' }}>No profiles yet</p>
        </div>
      )}

      {/* Horizontal scroll canvas - HAU style single row with staggered Y */}
      {!isEmpty && !isLoading && (
        <div
          className={cn(
            "absolute will-change-transform",
            isReady ? "opacity-100" : "opacity-0"
          )}
          style={{
            transform: `translate3d(${translateX}px, 0, 0)`,
            width: canvasWidth,
            height: '100vh',
            transition: 'opacity 0.4s ease',
          }}
        >
          {/* Single horizontal row with flex */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              gap: GAP,
              paddingLeft: 120,
              paddingTop: 100,
              alignItems: 'flex-start',
            }}
          >
            {profiles.map((profile, index) => {
              const isHovered = hoveredId === profile.id;
              const yOffset = yOffsets[index];
              const delay = index * 30;

              return (
                <div
                  key={profile.id}
                  className={cn(
                    "relative flex-shrink-0",
                    isReady ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    width: CARD_WIDTH,
                    marginTop: yOffset,
                    transform: isReady ? 'translateY(0)' : 'translateY(20px)',
                    transition: `opacity 0.3s ease ${delay}ms, transform 0.3s ease ${delay}ms`,
                  }}
                  onMouseEnter={() => !isScrolling && setHoveredId(profile.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Image card */}
                  <Link
                    to={`/directory/profile/${profile.slug}`}
                    className={cn(
                      "block relative overflow-hidden",
                      (isDragging || isScrolling) && "pointer-events-none"
                    )}
                    style={{
                      width: CARD_WIDTH,
                      height: CARD_HEIGHT,
                    }}
                    onClick={(e) => { if (isDragging || isScrolling) e.preventDefault(); }}
                    draggable={false}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: '#f5f5f5' }}
                    >
                      {profile.profilePictureUrl ? (
                        <img
                          src={profile.profilePictureUrl}
                          alt={profile.fullName}
                          className="w-full h-full object-cover"
                          style={{
                            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                            transition: 'transform 0.3s ease',
                          }}
                          draggable={false}
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ backgroundColor: '#f0f0f0' }}
                        >
                          <span style={{
                            fontSize: '160px',
                            fontWeight: 200,
                            color: 'rgba(0,0,0,0.04)',
                            userSelect: 'none'
                          }}>
                            {profile.fullName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Text below - HAU style: appears on hover */}
                  <div
                    className="absolute left-0 right-0"
                    style={{ top: CARD_HEIGHT + 12 }}
                  >
                    <p
                      style={{
                        fontSize: '1.31944vw',
                        fontWeight: 500,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#1e1e1e',
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                      }}
                    >
                      {profile.fullName}
                    </p>
                    <p
                      style={{
                        fontSize: '0.9vw',
                        fontWeight: 400,
                        color: 'rgba(30,30,30,0.5)',
                        marginTop: '4px',
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 0.3s ease 0.05s',
                      }}
                    >
                      {profile.location}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom hint */}
      <div
        className="fixed bottom-8 left-10 z-50 pointer-events-none"
        style={{
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(30,30,30,0.25)',
        }}
      >
        Scroll to explore
      </div>
    </div>
  );
};

export default ArchiveGrid;

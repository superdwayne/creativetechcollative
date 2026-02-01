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
 * HAU.studio-inspired Archive Grid
 *
 * Features:
 * - 2D infinite canvas panning (drag/scroll in any direction)
 * - Multiple columns with parallax effect
 * - Dark theme matching site design
 * - 386px × 480px cards, 40px gap
 */

const ArchiveGrid: React.FC<ArchiveGridProps> = ({ profiles, onClose, isLoading = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 2D position state
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [targetX, setTargetX] = useState(0);
  const [targetY, setTargetY] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dimensions - smaller cards
  const CARD_WIDTH = 280;
  const CARD_HEIGHT = 350;
  const GAP = 32;
  const NUM_COLUMNS = 7;

  // Distribute profiles into columns
  const columns = useMemo(() => {
    const cols: NetworkProfile[][] = Array.from({ length: NUM_COLUMNS }, () => []);
    profiles.forEach((p, i) => cols[i % NUM_COLUMNS].push(p));
    return cols;
  }, [profiles]);

  // Parallax speeds for each column
  const parallaxSpeeds = [0.7, 0.85, 1.0, 0.9, 0.75, 0.8, 0.95];

  // Column Y offsets for staggered start
  const columnOffsets = [60, 0, 100, 30, 80, 50, 90];

  // Canvas bounds
  const canvasWidth = NUM_COLUMNS * (CARD_WIDTH + GAP) + 400;
  const maxColumnItems = Math.max(...columns.map(c => c.length), 1);
  const canvasHeight = maxColumnItems * (CARD_HEIGHT + GAP) + Math.max(...columnOffsets) + 400;

  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight - 180 : 900; // Account for header
  const maxX = Math.max(0, canvasWidth - (typeof window !== 'undefined' ? window.innerWidth : 1920));
  const maxY = Math.max(0, canvasHeight - viewportHeight);

  // Start position - centered-ish
  useEffect(() => {
    const startX = -maxX * 0.15;
    const startY = -maxY * 0.1;
    setTargetX(startX);
    setTargetY(startY);
    setTranslateX(startX);
    setTranslateY(startY);
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, [maxX, maxY]);

  // Smooth animation loop
  useEffect(() => {
    let raf: number;
    const animate = () => {
      setTranslateX(prev => {
        const diff = targetX - prev;
        return Math.abs(diff) < 0.5 ? targetX : prev + diff * 0.1;
      });
      setTranslateY(prev => {
        const diff = targetY - prev;
        return Math.abs(diff) < 0.5 ? targetY : prev + diff * 0.1;
      });
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [targetX, targetY]);

  const markScrolling = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 150);
  }, []);

  // Wheel - 2D scroll
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    markScrolling();

    // Support both axes
    const dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
    const dy = e.shiftKey ? 0 : e.deltaY;

    setTargetX(prev => Math.max(-maxX, Math.min(0, prev - dx * 1.2)));
    setTargetY(prev => Math.max(-maxY, Math.min(0, prev - dy * 1.2)));
  }, [maxX, maxY, markScrolling]);

  // Keyboard - 2D navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) { onClose(); return; }
    const step = 300;
    if (e.key === 'ArrowRight') { e.preventDefault(); markScrolling(); setTargetX(prev => Math.max(-maxX, prev - step)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); markScrolling(); setTargetX(prev => Math.min(0, prev + step)); }
    if (e.key === 'ArrowDown') { e.preventDefault(); markScrolling(); setTargetY(prev => Math.max(-maxY, prev - step)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); markScrolling(); setTargetY(prev => Math.min(0, prev + step)); }
  }, [maxX, maxY, onClose, markScrolling]);

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

  // Drag - 2D panning
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    setIsDragging(true);
    markScrolling();
    dragStart.current = { x: e.clientX, y: e.clientY, tx: targetX, ty: targetY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [targetX, targetY, markScrolling]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTargetX(Math.max(-maxX, Math.min(0, dragStart.current.tx + dx)));
    setTargetY(Math.max(-maxY, Math.min(0, dragStart.current.ty + dy)));
  }, [isDragging, maxX, maxY]);

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  const isEmpty = profiles.length === 0 && !isLoading;

  // Calculate normalized scroll progress for parallax
  const scrollProgressY = maxY > 0 ? Math.abs(translateY) / maxY : 0;

  return (
    <div
      ref={containerRef}
      className="fixed left-0 right-0 bottom-0 overflow-hidden z-40 bg-black"
      style={{
        top: '180px', // Below the header
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-zinc-600 text-sm">No profiles yet</p>
        </div>
      )}

      {/* 2D Canvas with parallax columns */}
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
          {/* Columns with parallax */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: GAP,
              paddingLeft: 120,
              paddingRight: 120,
              height: '100%',
            }}
          >
            {columns.map((column, colIndex) => {
              // Parallax: each column moves at different speed based on Y scroll
              const parallaxY = translateY * parallaxSpeeds[colIndex];

              return (
                <div
                  key={colIndex}
                  className="flex flex-col will-change-transform"
                  style={{
                    width: CARD_WIDTH,
                    gap: GAP,
                    paddingTop: columnOffsets[colIndex] + 40,
                    transform: `translateY(${parallaxY}px)`,
                  }}
                >
                  {column.map((profile, rowIndex) => {
                    const isHovered = hoveredId === profile.id;
                    const delay = colIndex * 40 + rowIndex * 30;

                    return (
                      <div
                        key={profile.id}
                        className={cn(
                          "relative flex-shrink-0",
                          isReady ? "opacity-100" : "opacity-0"
                        )}
                        style={{
                          transform: isReady ? 'translateY(0)' : 'translateY(30px)',
                          transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
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
                          <div className="absolute inset-0 bg-zinc-900">
                            {profile.profilePictureUrl ? (
                              <img
                                src={profile.profilePictureUrl}
                                alt={profile.fullName}
                                className="w-full h-full object-cover"
                                style={{
                                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                  transition: 'transform 0.3s ease',
                                  opacity: isHovered ? 1 : 0.85,
                                }}
                                draggable={false}
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                                <span
                                  className="text-zinc-800 select-none"
                                  style={{ fontSize: '100px', fontWeight: 200 }}
                                >
                                  {profile.fullName.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Hover overlay */}
                          <div
                            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                            style={{
                              opacity: isHovered ? 1 : 0,
                              transition: 'opacity 0.3s ease',
                            }}
                          />
                        </Link>

                        {/* Text below - appears on hover */}
                        <div
                          className="absolute left-0 right-0"
                          style={{ top: CARD_HEIGHT + 12 }}
                        >
                          <p
                            className="text-white uppercase tracking-wider"
                            style={{
                              fontSize: 'clamp(11px, 1vw, 14px)',
                              fontWeight: 500,
                              letterSpacing: '0.1em',
                              opacity: isHovered ? 1 : 0,
                              transform: isHovered ? 'translateY(0)' : 'translateY(4px)',
                              transition: 'opacity 0.3s ease, transform 0.3s ease',
                            }}
                          >
                            {profile.fullName}
                          </p>
                          <p
                            className="text-zinc-500"
                            style={{
                              fontSize: 'clamp(10px, 0.85vw, 12px)',
                              marginTop: '4px',
                              opacity: isHovered ? 1 : 0,
                              transform: isHovered ? 'translateY(0)' : 'translateY(4px)',
                              transition: 'opacity 0.3s ease 0.05s, transform 0.3s ease 0.05s',
                            }}
                          >
                            {profile.location}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom hint */}
      <div
        className="fixed bottom-8 left-10 z-50 pointer-events-none text-zinc-600"
        style={{
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}
      >
        Drag or scroll to explore
      </div>

      {/* Navigation hint - bottom right */}
      <div className="fixed bottom-8 right-10 z-50 pointer-events-none flex items-center gap-3">
        <div className="flex items-center gap-1 text-zinc-600">
          <span className="text-[10px] uppercase tracking-widest">←→↑↓</span>
        </div>
      </div>
    </div>
  );
};

export default ArchiveGrid;

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
 * Layout: Multiple vertical columns scrolling horizontally with parallax
 * - Columns are flex-direction: column (items stack vertically)
 * - Columns arranged in a horizontal row
 * - Each column scrolls at different speed (parallax)
 * - 386px wide columns, 480px tall images, 40px gap
 */

const ArchiveGrid: React.FC<ArchiveGridProps> = ({ profiles, onClose, isLoading = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll position (0-1 normalized)
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAccumulator = useRef(0);

  // HAU.studio exact dimensions
  const CARD_WIDTH = 386;
  const CARD_HEIGHT = 480;
  const GAP = 40;
  const NUM_COLUMNS = 5;

  // Distribute profiles into columns
  const columns = useMemo(() => {
    const cols: NetworkProfile[][] = Array.from({ length: NUM_COLUMNS }, () => []);
    profiles.forEach((p, i) => cols[i % NUM_COLUMNS].push(p));
    return cols;
  }, [profiles]);

  // Parallax speeds for each column (HAU-style differential movement)
  const parallaxSpeeds = [0.6, 0.8, 1.0, 0.75, 0.65];

  // Column Y offsets for staggered start positions
  const columnOffsets = [0, 60, 120, 40, 80];

  // Calculate max scroll based on content
  const maxColumnItems = Math.max(...columns.map(c => c.length));
  const maxScrollDistance = maxColumnItems * (CARD_HEIGHT + GAP) + 200;

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const markScrolling = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 150);
  }, []);

  // Handle wheel - accumulate scroll and convert to progress
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    markScrolling();

    const delta = e.deltaY || e.deltaX;
    scrollAccumulator.current += delta * 0.5;

    // Clamp to valid range
    scrollAccumulator.current = Math.max(0, Math.min(maxScrollDistance, scrollAccumulator.current));

    // Convert to 0-1 progress
    setScrollProgress(scrollAccumulator.current / maxScrollDistance);
  }, [maxScrollDistance, markScrolling]);

  // Keyboard
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) { onClose(); return; }
    const step = 100;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      markScrolling();
      scrollAccumulator.current = Math.min(maxScrollDistance, scrollAccumulator.current + step);
      setScrollProgress(scrollAccumulator.current / maxScrollDistance);
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      markScrolling();
      scrollAccumulator.current = Math.max(0, scrollAccumulator.current - step);
      setScrollProgress(scrollAccumulator.current / maxScrollDistance);
    }
  }, [maxScrollDistance, onClose, markScrolling]);

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

  // Drag
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ y: 0, scroll: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    setIsDragging(true);
    markScrolling();
    dragStart.current = { y: e.clientY, scroll: scrollAccumulator.current };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [markScrolling]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dy = dragStart.current.y - e.clientY;
    scrollAccumulator.current = Math.max(0, Math.min(maxScrollDistance, dragStart.current.scroll + dy));
    setScrollProgress(scrollAccumulator.current / maxScrollDistance);
  }, [isDragging, maxScrollDistance]);

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
      {/* Back button */}
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

      {/* Archive count */}
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

      {/* Multi-column parallax grid */}
      {!isEmpty && !isLoading && (
        <div
          className={cn(
            "absolute inset-0",
            isReady ? "opacity-100" : "opacity-0"
          )}
          style={{ transition: 'opacity 0.4s ease' }}
        >
          {/* Columns container - horizontal flex */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: GAP,
              paddingLeft: 80,
              paddingRight: 80,
              height: '100%',
              justifyContent: 'center',
            }}
          >
            {columns.map((column, colIndex) => {
              // Calculate parallax offset for this column
              const parallaxOffset = scrollProgress * maxScrollDistance * parallaxSpeeds[colIndex];

              return (
                <div
                  key={colIndex}
                  className="flex flex-col will-change-transform"
                  style={{
                    width: CARD_WIDTH,
                    gap: GAP,
                    paddingTop: columnOffsets[colIndex] + 100,
                    transform: `translateY(${-parallaxOffset}px)`,
                    transition: 'transform 0.1s linear',
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
                                  fontSize: '140px',
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

                        {/* Text below - appears on hover */}
                        <div
                          className="absolute left-0 right-0"
                          style={{ top: CARD_HEIGHT + 12 }}
                        >
                          <p
                            style={{
                              fontSize: 'clamp(12px, 1.3vw, 18px)',
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
                              fontSize: 'clamp(10px, 0.9vw, 14px)',
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

      {/* Scroll progress indicator */}
      <div
        className="fixed bottom-8 right-10 z-50 pointer-events-none"
        style={{
          width: '60px',
          height: '2px',
          backgroundColor: 'rgba(30,30,30,0.1)',
        }}
      >
        <div
          style={{
            width: `${scrollProgress * 100}%`,
            height: '100%',
            backgroundColor: 'rgba(30,30,30,0.4)',
            transition: 'width 0.1s linear',
          }}
        />
      </div>
    </div>
  );
};

export default ArchiveGrid;

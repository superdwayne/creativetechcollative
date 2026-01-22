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
 * Exact specifications from hau.studio/archive/:
 * - 5-column grid with 386px × 480px cards
 * - 40px gap between cards
 * - 0.3s ease transitions throughout
 * - Text hidden (opacity: 0) until hover
 * - Font sizes: 1.31944vw for titles
 * - Dark text (#1e1e1e) on white background
 */

const ArchiveGrid: React.FC<ArchiveGridProps> = ({ profiles, onClose, isLoading = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation state
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [targetX, setTargetX] = useState(0);
  const [targetY, setTargetY] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // HAU.studio exact dimensions
  const CARD_WIDTH = 386;
  const CARD_HEIGHT = 480;
  const GAP = 40; // HAU uses 40px gap
  const COLUMNS = 5;
  const COLUMN_OFFSETS = [0, 60, 100, 60, 0]; // Subtle stagger like HAU

  // Distribute profiles
  const columns = useMemo(() => {
    const cols: NetworkProfile[][] = Array.from({ length: COLUMNS }, () => []);
    profiles.forEach((p, i) => cols[i % COLUMNS].push(p));
    return cols;
  }, [profiles]);

  // Canvas size - tighter padding like HAU
  const maxRows = Math.max(...columns.map(c => c.length), 1);
  const canvasWidth = COLUMNS * CARD_WIDTH + (COLUMNS - 1) * GAP + 200;
  const canvasHeight = maxRows * (CARD_HEIGHT + GAP + 60) + Math.max(...COLUMN_OFFSETS) + 200;
  const maxX = Math.max(0, canvasWidth - window.innerWidth);
  const maxY = Math.max(0, canvasHeight - window.innerHeight);

  // Start slightly offset - not at corner
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

  // HAU-style smooth animation - snappier lerp
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

  // Wheel - horizontal scroll by default
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    markScrolling();
    const dx = e.deltaX || e.deltaY;
    setTargetX(prev => Math.max(-maxX, Math.min(0, prev - dx * 1.5)));
    if (e.shiftKey || Math.abs(e.deltaX) > 0) {
      setTargetY(prev => Math.max(-maxY, Math.min(0, prev - e.deltaY * 1.5)));
    }
  }, [maxX, maxY, markScrolling]);

  // Keyboard
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) { onClose(); return; }
    const step = 500;
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

  // Drag
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
      {/* Minimal back - HAU style: barely there until needed */}
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

      {/* Archive count - HAU style: large, light weight */}
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

      {/* Loading - subtle */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-6 h-6 border border-neutral-200 border-t-neutral-400 rounded-full animate-spin"
          />
        </div>
      )}

      {/* Empty */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p style={{ color: 'rgba(30,30,30,0.4)', fontSize: '14px' }}>No profiles yet</p>
        </div>
      )}

      {/* Canvas */}
      {!isEmpty && !isLoading && (
        <div
          className={cn(
            "absolute will-change-transform",
            isReady ? "opacity-100" : "opacity-0"
          )}
          style={{
            transform: `translate3d(${translateX}px, ${translateY}px, 0)`,
            width: canvasWidth,
            height: canvasHeight,
            transition: 'opacity 0.4s ease',
          }}
        >
          {/* Grid - HAU style compact padding */}
          <div
            className="flex"
            style={{
              paddingTop: 100,
              paddingLeft: 80,
              gap: GAP
            }}
          >
            {columns.map((column, colIndex) => (
              <div
                key={colIndex}
                className="flex flex-col"
                style={{
                  width: CARD_WIDTH,
                  gap: GAP,
                  marginTop: COLUMN_OFFSETS[colIndex],
                }}
              >
                {column.map((profile, rowIndex) => {
                  const isHovered = hoveredId === profile.id;
                  const delay = colIndex * 30 + rowIndex * 20;

                  return (
                    <div
                      key={profile.id}
                      className={cn(
                        "relative",
                        isReady ? "opacity-100" : "opacity-0"
                      )}
                      style={{
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

                      {/* Text below - HAU style: appears on hover with 0.3s transition */}
                      <div
                        className="absolute left-0 right-0"
                        style={{
                          top: CARD_HEIGHT + 12,
                        }}
                      >
                        {/* Name - HAU style: uppercase, tracked */}
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

                        {/* Location - HAU style: lighter, subtle */}
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
            ))}
          </div>
        </div>
      )}

      {/* Bottom hint - barely visible */}
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

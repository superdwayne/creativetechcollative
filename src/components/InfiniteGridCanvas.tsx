import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MemberData } from '../types/member';

interface InfiniteGridCanvasProps {
  memberData: MemberData[];
}

const InfiniteGridCanvas: React.FC<InfiniteGridCanvasProps> = ({ memberData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [footerHeight, setFooterHeight] = useState(94);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const isPointerDownRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Grid sizing similar to VWLab Infinite Grid feel
  const { cellWidth, cellHeight, imagePadding } = useMemo(() => {
    // Responsive sizing
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const columnsTarget = vw > 1280 ? 6 : vw > 1024 ? 5 : vw > 768 ? 4 : 3;
    const cellW = Math.floor((vw / columnsTarget));
    const cellH = Math.floor(cellW * 1.2);
    return { cellWidth: cellW, cellHeight: cellH, imagePadding: 0 };
  }, []);

  // Footer-aware sizing
  useEffect(() => {
    const handleResize = () => {
      const calculatedFooterHeight = window.innerWidth >= 768 ? 112 : 94;
      setFooterHeight(calculatedFooterHeight);
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - calculatedFooterHeight;
        canvas.style.width = '100vw';
        canvas.style.height = `${window.innerHeight - calculatedFooterHeight}px`;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload images
  useEffect(() => {
    if (!memberData.length) return;
    const promises = memberData.map((m) => new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { imagesRef.current.set(m.id, img); resolve(); };
      img.onerror = () => resolve();
      img.src = m.image;
    }));
    Promise.all(promises).then(() => {
      // trigger a redraw
      setOffset((p) => ({ ...p }));
    });
  }, [memberData]);

  // Deterministic mapping from tile -> member index
  const getMemberForTile = useCallback((tx: number, ty: number): MemberData => {
    const idx = (Math.abs(tx) * 73856093 ^ Math.abs(ty) * 19349663) >>> 0; // hash
    return memberData[idx % memberData.length];
  }, [memberData]);

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Determine visible tiles
    const margin = Math.max(cellWidth, cellHeight);
    const startX = Math.floor((-offset.x - margin) / cellWidth);
    const endX = Math.ceil((canvas.width - offset.x + margin) / cellWidth);
    const startY = Math.floor((-offset.y - margin) / cellHeight);
    const endY = Math.ceil((canvas.height - offset.y + margin) / cellHeight);

    for (let ty = startY; ty <= endY; ty++) {
      for (let tx = startX; tx <= endX; tx++) {
        const screenX = tx * cellWidth + offset.x;
        const screenY = ty * cellHeight + offset.y;

        const member = getMemberForTile(tx, ty);
        const img = imagesRef.current.get(member.id);

        if (img) {
          // Draw image covering cell
          ctx.drawImage(
            img,
            screenX + imagePadding,
            screenY + imagePadding,
            cellWidth - imagePadding * 2,
            cellHeight - imagePadding * 2
          );
        } else {
          // Placeholder block
          ctx.fillStyle = '#111';
          ctx.fillRect(screenX, screenY, cellWidth, cellHeight);
        }
      }
    }
  }, [cellWidth, cellHeight, imagePadding, offset, getMemberForTile]);

  // Animate
  useEffect(() => {
    let raf: number;
    const tick = () => {
      // momentum
      if (!isPointerDownRef.current) {
        offset.x += velocityRef.current.x;
        offset.y += velocityRef.current.y;
        velocityRef.current.x *= 0.96;
        velocityRef.current.y *= 0.96;
        if (Math.abs(velocityRef.current.x) < 0.02) velocityRef.current.x = 0;
        if (Math.abs(velocityRef.current.y) < 0.02) velocityRef.current.y = 0;
        // trigger state update sparingly
        setOffset({ x: offset.x, y: offset.y });
      } else {
        render();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [render, offset]);

  // Pointer interactions (VWLab feel)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const handlePointerDown = (e: PointerEvent) => {
      isPointerDownRef.current = true;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      velocityRef.current = { x: 0, y: 0 };
      canvas.style.cursor = 'grabbing';
      canvas.setPointerCapture(e.pointerId);
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDownRef.current) return;
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      velocityRef.current = { x: dx * 0.15, y: dy * 0.15 };
      setOffset((p) => ({ x: p.x + dx, y: p.y + dy }));
    };
    const handlePointerUp = (e: PointerEvent) => {
      isPointerDownRef.current = false;
      canvas.style.cursor = 'grab';
      canvas.releasePointerCapture(e.pointerId);
    };
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = 0.6;
      setOffset((p) => ({ x: p.x - e.deltaX * factor, y: p.y - e.deltaY * factor }));
    };
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel as any);
    };
  }, []);

  // Redraw on offset change
  useEffect(() => { render(); }, [render]);

  if (!memberData.length) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white">Loading grid…</div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-black overflow-hidden" style={{ bottom: `${footerHeight}px` }}>
      <canvas ref={canvasRef} className="w-full h-full cursor-grab" style={{ touchAction: 'none' }} />
      <div className="absolute top-6 left-6 text-white/70 text-sm pointer-events-none">Drag to explore • Infinite Grid</div>
    </div>
  );
};

export default InfiniteGridCanvas;



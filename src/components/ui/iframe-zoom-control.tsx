import React, { useState, useRef, useEffect } from 'react';

interface IframeZoomControlProps {
  children: React.ReactNode;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  showControls?: boolean;
  className?: string;
}

export const IframeZoomControl: React.FC<IframeZoomControlProps> = ({
  children,
  initialZoom = 1,
  minZoom = 0.5,
  maxZoom = 2,
  zoomStep = 0.1,
  showControls = true,
  className = ''
}) => {
  const [zoom, setZoom] = useState(initialZoom);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle zoom in
  const zoomIn = () => {
    setZoom(prev => Math.min(prev + zoomStep, maxZoom));
  };

  // Handle zoom out
  const zoomOut = () => {
    setZoom(prev => Math.max(prev - zoomStep, minZoom));
  };

  // Reset zoom
  const resetZoom = () => {
    setZoom(initialZoom);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      
      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomStep, maxZoom, minZoom, initialZoom]);

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      onWheel={handleWheel}
    >
      {/* Zoomed Content */}
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          width: '100%',
          height: '100%'
        }}
      >
        {children}
      </div>

      {/* Zoom Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
          {/* Zoom Level Display */}
          <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-secondary">
            {Math.round(zoom * 100)}%
          </div>
          
          {/* Zoom Buttons */}
          <div className="flex flex-col gap-1">
            <button
              onClick={zoomIn}
              className="w-10 h-10 bg-black/80 backdrop-blur-sm hover:bg-black/90 text-white rounded-lg flex items-center justify-center transition-colors"
              title="Zoom In (+)"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            
            <button
              onClick={zoomOut}
              className="w-10 h-10 bg-black/80 backdrop-blur-sm hover:bg-black/90 text-white rounded-lg flex items-center justify-center transition-colors"
              title="Zoom Out (-)"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
              </svg>
            </button>
            
            <button
              onClick={resetZoom}
              className="w-10 h-10 bg-black/80 backdrop-blur-sm hover:bg-black/90 text-white rounded-lg flex items-center justify-center transition-colors text-xs font-bold"
              title="Reset Zoom (0)"
            >
              100%
            </button>
          </div>
        </div>
      )}

      {/* Zoom Slider */}
      {showControls && (
        <div className="absolute bottom-4 right-4 w-32 z-20">
          <input
            type="range"
            min={minZoom}
            max={maxZoom}
            step={zoomStep}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer slider"
            title="Zoom Level"
          />
          <style>{`
            .slider::-webkit-slider-thumb {
              appearance: none;
              height: 16px;
              width: 16px;
              border-radius: 50%;
              background: white;
              cursor: pointer;
            }
            .slider::-moz-range-thumb {
              height: 16px;
              width: 16px;
              border-radius: 50%;
              background: white;
              cursor: pointer;
              border: none;
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

// Simple zoom wrapper for iframes
export const IframeZoomWrapper: React.FC<{
  src: string;
  title: string;
  allow?: string;
  sandbox?: string;
  style?: React.CSSProperties;
  zoom?: number;
  showControls?: boolean;
}> = ({ 
  src, 
  title, 
  allow, 
  sandbox, 
  style, 
  zoom = 1,
  showControls = false 
}) => {
  return (
    <IframeZoomControl 
      initialZoom={zoom}
      showControls={showControls}
    >
      <iframe
        src={src}
        title={title}
        allow={allow}
        sandbox={sandbox}
        style={{
          ...style,
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          border: 'none',
          overflow: 'hidden'
        }}
        scrolling="no"
        frameBorder="0"
      />
    </IframeZoomControl>
  );
}; 
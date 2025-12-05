import React, { useEffect, useRef } from 'react';

interface FloatingShapesProps {
  count?: number;
  colors?: string[];
  className?: string;
}

const FloatingShapes: React.FC<FloatingShapesProps> = ({
  count = 20,
  colors = ['#3d3d3d', '#4a4a4a', '#5a5a5a', '#6a6a6a', '#7a7a7a'],
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear existing shapes
    container.innerHTML = '';

    // Create floating shapes
    for (let i = 0; i < count; i++) {
      const shape = document.createElement('div');
      const size = Math.random() * 60 + 20;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const rotation = Math.random() * 360;
      const duration = Math.random() * 20 + 15;
      const delay = Math.random() * -20;

      // Random starting position
      const startX = Math.random() * 100;
      const startY = Math.random() * 100;

      // Shape type - rectangles with slight rotation
      shape.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size * (0.3 + Math.random() * 0.4)}px;
        background: ${color};
        opacity: ${0.3 + Math.random() * 0.4};
        left: ${startX}%;
        top: ${startY}%;
        transform: rotate(${rotation}deg);
        animation: float-${i} ${duration}s ease-in-out infinite;
        animation-delay: ${delay}s;
        pointer-events: none;
      `;

      // Create unique keyframes for each shape
      const keyframes = `
        @keyframes float-${i} {
          0%, 100% {
            transform: rotate(${rotation}deg) translate(0, 0);
          }
          25% {
            transform: rotate(${rotation + 10}deg) translate(${Math.random() * 30 - 15}px, ${Math.random() * 30 - 15}px);
          }
          50% {
            transform: rotate(${rotation + 5}deg) translate(${Math.random() * 30 - 15}px, ${Math.random() * 30 - 15}px);
          }
          75% {
            transform: rotate(${rotation - 5}deg) translate(${Math.random() * 30 - 15}px, ${Math.random() * 30 - 15}px);
          }
        }
      `;

      // Add keyframes to document
      const styleSheet = document.createElement('style');
      styleSheet.textContent = keyframes;
      document.head.appendChild(styleSheet);

      container.appendChild(shape);
    }

    return () => {
      // Cleanup keyframes
      const styles = document.querySelectorAll('style');
      styles.forEach((style) => {
        if (style.textContent?.includes('float-')) {
          style.remove();
        }
      });
    };
  }, [count, colors]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};

export default FloatingShapes;

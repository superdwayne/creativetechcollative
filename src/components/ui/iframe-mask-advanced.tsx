import React, { useState, useEffect } from 'react';

interface AdvancedIframeMaskProps {
  children: React.ReactNode;
  maskType?: 'polygon' | 'circle' | 'ellipse' | 'custom';
  maskShape?: string; // CSS clip-path value
  overlayContent?: React.ReactNode;
  className?: string;
  animated?: boolean;
}

export const AdvancedIframeMask: React.FC<AdvancedIframeMaskProps> = ({
  children,
  maskType = 'polygon',
  maskShape,
  overlayContent,
  className = '',
  animated = false
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getMaskShape = () => {
    if (maskShape) return maskShape;
    
    switch (maskType) {
      case 'circle':
        return 'circle(30% at 50% 50%)';
      case 'ellipse':
        return 'ellipse(40% 30% at 50% 50%)';
      case 'polygon':
        return 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)';
      default:
        return 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)';
    }
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Masked Iframe */}
      <div 
        className={`transition-all duration-200 ${animated ? 'animate-pulse' : ''}`}
        style={{
          clipPath: getMaskShape(),
          transform: isVisible ? 'scale(1)' : 'scale(0.8)',
          opacity: isVisible ? 1 : 0
        }}
      >
        {children}
      </div>
      
      {/* Overlay Content */}
      {overlayContent && (
        <div className="absolute inset-0 pointer-events-none">
          {overlayContent}
        </div>
      )}
    </div>
  );
};

// Gradient Mask Component
export const GradientIframeMask: React.FC<{
  children: React.ReactNode;
  gradientType?: 'radial' | 'linear' | 'conic';
  colors?: string[];
  className?: string;
}> = ({ 
  children, 
  gradientType = 'radial', 
  colors = ['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,1)'],
  className = ''
}) => {
  const getGradient = () => {
    switch (gradientType) {
      case 'radial':
        return `radial-gradient(circle at center, ${colors.join(', ')})`;
      case 'linear':
        return `linear-gradient(45deg, ${colors.join(', ')})`;
      case 'conic':
        return `conic-gradient(from 0deg, ${colors.join(', ')})`;
      default:
        return `radial-gradient(circle at center, ${colors.join(', ')})`;
    }
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: getGradient(),
          mixBlendMode: 'multiply'
        }}
      />
      {children}
    </div>
  );
};

// Animated Border Mask
export const AnimatedBorderMask: React.FC<{
  children: React.ReactNode;
  borderWidth?: number;
  borderColor?: string;
  animationSpeed?: number;
  className?: string;
}> = ({ 
  children, 
  borderWidth = 4, 
  borderColor = '#8b5cf6',
  animationSpeed = 2,
  className = ''
}) => {
  return (
    <div className={`relative w-full h-full ${className}`}>
      {children}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `conic-gradient(from 0deg, transparent, ${borderColor}, transparent)`,
          animation: `rotate ${animationSpeed}s linear infinite`
        }}
      />
      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}; 
import React from 'react';

interface IframeOverlayProps {
  className?: string;
  overlayType?: 'corner' | 'side' | 'center' | 'custom';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  content?: React.ReactNode;
  blur?: boolean;
  gradient?: boolean;
  border?: boolean;
  animated?: boolean;
}

export const IframeOverlay: React.FC<IframeOverlayProps> = ({
  className = '',
  overlayType = 'corner',
  position = 'top-left',
  size = 'md',
  content,
  blur = true,
  gradient = false,
  border = true,
  animated = false
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64'
  };

  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'top': 'top-0 left-1/2 transform -translate-x-1/2',
    'bottom': 'bottom-0 left-1/2 transform -translate-x-1/2',
    'left': 'top-1/2 left-0 transform -translate-y-1/2',
    'right': 'top-1/2 right-0 transform -translate-y-1/2',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  const borderClasses = {
    'top-left': 'border-b border-r',
    'top-right': 'border-b border-l',
    'bottom-left': 'border-t border-r',
    'bottom-right': 'border-t border-l',
    'top': 'border-b',
    'bottom': 'border-t',
    'left': 'border-r',
    'right': 'border-l',
    'center': ''
  };

  const baseClasses = `absolute ${positionClasses[position]} ${sizeClasses[size]} z-10`;
  const bgClasses = blur ? 'backdrop-blur-sm' : '';
  const gradientClasses = gradient ? 'bg-gradient-to-br from-black/80 to-transparent' : 'bg-black/80';
  const borderClassesApplied = border ? `border-zinc-700 ${borderClasses[position]}` : '';
  const animationClasses = animated ? 'animate-pulse' : '';

  return (
    <div className={`${baseClasses} ${bgClasses} ${gradientClasses} ${borderClassesApplied} ${animationClasses} ${className}`}>
      {content}
    </div>
  );
};

interface IframeMaskProps {
  children: React.ReactNode;
  masks: Array<{
    type: 'corner' | 'side' | 'center' | 'custom';
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right' | 'center';
    size: 'sm' | 'md' | 'lg' | 'xl';
    content?: React.ReactNode;
    blur?: boolean;
    gradient?: boolean;
    border?: boolean;
    animated?: boolean;
    className?: string;
  }>;
}

export const IframeMask: React.FC<IframeMaskProps> = ({ children, masks }) => {
  return (
    <div className="relative w-full h-full">
      {children}
      {masks.map((mask, index) => (
        <IframeOverlay
          key={index}
          overlayType={mask.type}
          position={mask.position}
          size={mask.size}
          content={mask.content}
          blur={mask.blur}
          gradient={mask.gradient}
          border={mask.border}
          animated={mask.animated}
          className={mask.className}
        />
      ))}
    </div>
  );
}; 
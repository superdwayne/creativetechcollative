import React, { useState } from 'react';
import { AdvancedIframeMask, GradientIframeMask, AnimatedBorderMask } from './iframe-mask-advanced';

type MaskType = 'none' | 'circle' | 'polygon' | 'ellipse' | 'gradient' | 'animated-border';

interface IframeMaskDemoProps {
  src: string;
  title: string;
  allow?: string;
  sandbox?: string;
  style?: React.CSSProperties;
}

export const IframeMaskDemo: React.FC<IframeMaskDemoProps> = ({
  src,
  title,
  allow,
  sandbox,
  style
}) => {
  const [currentMask, setCurrentMask] = useState<MaskType>('circle');

  const maskOptions = [
    { value: 'none', label: 'No Mask' },
    { value: 'circle', label: 'Circle' },
    { value: 'polygon', label: 'Octagon' },
    { value: 'ellipse', label: 'Ellipse' },
    { value: 'gradient', label: 'Gradient' },
    { value: 'animated-border', label: 'Animated Border' }
  ];

  const renderIframe = () => {
    const baseIframe = (
      <iframe
        src={src}
        title={title}
        allow={allow}
        sandbox={sandbox}
        style={{
          ...style,
          border: 'none',
          display: 'block'
        }}
        scrolling="no"
        frameBorder="0"
      />
    );

    switch (currentMask) {
      case 'circle':
        return (
          <AdvancedIframeMask
            maskType="circle"
            animated={true}
            overlayContent={
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2">
                <p className="text-white text-sm font-secondary">Circular View</p>
              </div>
            }
          >
            {baseIframe}
          </AdvancedIframeMask>
        );

      case 'polygon':
        return (
          <AdvancedIframeMask
            maskType="custom"
            maskShape="polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)"
            animated={false}
            overlayContent={
              <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2">
                <p className="text-white text-sm font-secondary">Octagon Mask</p>
              </div>
            }
          >
            {baseIframe}
          </AdvancedIframeMask>
        );

      case 'ellipse':
        return (
          <AdvancedIframeMask
            maskType="ellipse"
            animated={false}
            overlayContent={
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2">
                <p className="text-white text-sm font-secondary">Elliptical View</p>
              </div>
            }
          >
            {baseIframe}
          </AdvancedIframeMask>
        );

      case 'gradient':
        return (
          <GradientIframeMask
            gradientType="radial"
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
          >
            {baseIframe}
          </GradientIframeMask>
        );

      case 'animated-border':
        return (
          <AnimatedBorderMask
            borderWidth={4}
            borderColor="#8b5cf6"
            animationSpeed={3}
          >
            {baseIframe}
          </AnimatedBorderMask>
        );

      default:
        return baseIframe;
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Mask Type Selector */}
      <div className="absolute top-4 left-4 z-30 bg-black/80 backdrop-blur-sm rounded-lg p-3">
        <p className="text-white text-sm font-secondary mb-2">Mask Type:</p>
        <div className="flex flex-wrap gap-2">
          {maskOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setCurrentMask(option.value as MaskType)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                currentMask === option.value
                  ? 'bg-pink-500 text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Masked Iframe */}
      <div className="w-full h-full">
        {renderIframe()}
      </div>
    </div>
  );
}; 
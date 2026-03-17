import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { getSpectrumLabel, getSpectrumColor } from '@/types/network-profile';
import { useHaptics } from '@/hooks/useHaptics';

interface CreativeSpectrumSliderProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  className?: string;
  /** Compact mode for directory cards */
  compact?: boolean;
}

/**
 * A slider that lets members place themselves on the creative technology spectrum.
 * Both ends are creative technologists — this indicates whether they lean
 * more toward design or development in their creative practice.
 *
 * - 0 = Design-focused creative technologist (violet)
 * - 50 = Hybrid creative (default)
 * - 100 = Dev-focused creative technologist (cyan)
 *
 * When `readOnly` is true, renders as a static bar with a position marker.
 */
export const CreativeSpectrumSlider: React.FC<CreativeSpectrumSliderProps> = ({
  value,
  onChange,
  readOnly = false,
  className,
  compact = false,
}) => {
  const label = getSpectrumLabel(value);
  const thumbColor = getSpectrumColor(value);
  const { trigger } = useHaptics();
  const lastTickRef = useRef(value);

  // ── Compact read-only mini-bar (for directory cards) ──
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="relative flex-1 h-1.5 rounded-full bg-gradient-to-r from-violet-500 via-zinc-500 to-cyan-500 overflow-hidden">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-sm border border-zinc-700"
            style={{ left: `calc(${value}% - 5px)` }}
          />
        </div>
        <span className="text-[10px] font-medium text-zinc-400 whitespace-nowrap min-w-[70px] text-right">
          {label}
        </span>
      </div>
    );
  }

  // ── Read-only display (profile view) ──
  if (readOnly) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-[0.2em] text-zinc-400 uppercase">
            Creative Tech Spectrum
          </span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full border"
            style={{
              color: thumbColor,
              borderColor: `${thumbColor}40`,
              backgroundColor: `${thumbColor}15`,
            }}
          >
            {label}
          </span>
        </div>
        <div className="relative h-3 rounded-full bg-gradient-to-r from-violet-500 via-zinc-500 to-cyan-500">
          {/* Position marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg border-2 transition-all duration-300"
            style={{
              left: `calc(${value}% - 10px)`,
              borderColor: thumbColor,
              boxShadow: `0 0 8px ${thumbColor}60`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-zinc-400 font-medium">Design</span>
          <span className="text-[10px] text-zinc-400 font-medium">Hybrid</span>
          <span className="text-[10px] text-zinc-400 font-medium">Development</span>
        </div>
      </div>
    );
  }

  // ── Interactive slider (create/edit forms) ──
  return (
    <div className={cn('w-full max-w-md', className)}>
      {/* Current value label */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-zinc-300">Creative Tech Spectrum</span>
        <span
          className="text-sm font-semibold px-3 py-1 rounded-full border transition-all duration-200"
          style={{
            color: thumbColor,
            borderColor: `${thumbColor}40`,
            backgroundColor: `${thumbColor}15`,
          }}
        >
          {label}
        </span>
      </div>

      {/* Slider track */}
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => {
            const newVal = parseInt(e.target.value, 10);
            // Haptic tick at 25% markers
            const ticks = [0, 25, 50, 75, 100];
            const crossedTick = ticks.some(
              t => (lastTickRef.current < t && newVal >= t) || (lastTickRef.current > t && newVal <= t)
            );
            if (crossedTick) trigger(10);
            lastTickRef.current = newVal;
            onChange?.(newVal);
          }}
          className="creative-spectrum-range w-full h-3 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:ring-offset-2 focus:ring-offset-black"
          style={{
            background: 'linear-gradient(to right, rgb(139, 92, 246), rgb(113, 113, 122), rgb(6, 182, 212))',
          }}
          aria-label="Creative tech spectrum: Design-focused to Dev-focused"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={label}
        />
      </div>

      {/* End labels */}
      <div className="flex justify-between mt-2">
        <span className="text-xs text-zinc-400 font-medium">Design</span>
        <span className="text-xs text-zinc-400 font-medium">Hybrid</span>
        <span className="text-xs text-zinc-400 font-medium">Development</span>
      </div>

      {/* Custom slider styles */}
      <style>{`
        .creative-spectrum-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 3px solid ${thumbColor};
          box-shadow: 0 0 10px ${thumbColor}60, 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.1s;
        }
        .creative-spectrum-range::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 16px ${thumbColor}80, 0 2px 8px rgba(0,0,0,0.4);
        }
        .creative-spectrum-range::-webkit-slider-thumb:active {
          transform: scale(1.05);
        }
        .creative-spectrum-range::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 3px solid ${thumbColor};
          box-shadow: 0 0 10px ${thumbColor}60, 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        }
        .creative-spectrum-range::-moz-range-track {
          height: 12px;
          border-radius: 9999px;
          background: linear-gradient(to right, rgb(139, 92, 246), rgb(113, 113, 122), rgb(6, 182, 212));
        }
      `}</style>
    </div>
  );
};

export default CreativeSpectrumSlider;

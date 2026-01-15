import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  className?: string;
  disabled?: boolean;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ options, value, onChange, name, className, disabled }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-3", className)}>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex items-center gap-3 cursor-pointer",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <div className="relative flex items-center justify-center">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="peer sr-only"
              />
              <div
                className={cn(
                  "h-5 w-5 rounded-full border border-zinc-600 bg-zinc-900 transition-colors",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-pink-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-black",
                  value === option.value && "border-pink-500"
                )}
              />
              <div
                className={cn(
                  "absolute h-2.5 w-2.5 rounded-full bg-pink-500 transition-transform scale-0",
                  value === option.value && "scale-100"
                )}
              />
            </div>
            <span className="text-sm font-medium text-white">{option.label}</span>
          </label>
        ))}
      </div>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

export { RadioGroup }

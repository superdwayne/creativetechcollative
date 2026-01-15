import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            id={inputId}
            ref={ref}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              "h-5 w-5 shrink-0 rounded border border-zinc-600 bg-zinc-900 ring-offset-background transition-colors",
              "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-pink-500 peer-focus-visible:ring-offset-2",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              "peer-checked:bg-pink-500 peer-checked:border-pink-500",
              className
            )}
          >
            <Check className="h-4 w-4 text-white opacity-0 peer-checked:opacity-100 absolute top-0.5 left-0.5 pointer-events-none" />
          </div>
          <Check className="h-4 w-4 text-white opacity-0 peer-checked:opacity-100 absolute pointer-events-none" />
        </div>
        {(label || description) && (
          <label htmlFor={inputId} className="cursor-pointer select-none">
            {label && (
              <span className="text-sm font-medium text-white block">{label}</span>
            )}
            {description && (
              <span className="text-xs text-zinc-400 block mt-0.5">{description}</span>
            )}
          </label>
        )}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }

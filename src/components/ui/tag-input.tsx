import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxTags?: number;
}

const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  ({ tags, onTagsChange, suggestions = [], placeholder = "Add a tag...", className, disabled, maxTags }, ref) => {
    const [inputValue, setInputValue] = React.useState("");
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const filteredSuggestions = React.useMemo(() => {
      if (!inputValue.trim()) return [];
      const search = inputValue.toLowerCase();
      return suggestions
        .filter(s => 
          s.toLowerCase().includes(search) && 
          !tags.some(t => t.toLowerCase() === s.toLowerCase())
        )
        .slice(0, 8);
    }, [inputValue, suggestions, tags]);

    const addTag = (tag: string) => {
      const trimmedTag = tag.trim();
      if (!trimmedTag) return;
      if (tags.some(t => t.toLowerCase() === trimmedTag.toLowerCase())) return;
      if (maxTags && tags.length >= maxTags) return;
      
      onTagsChange([...tags, trimmedTag]);
      setInputValue("");
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    };

    const removeTag = (index: number) => {
      onTagsChange(tags.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
          addTag(filteredSuggestions[highlightedIndex]);
        } else if (inputValue.trim()) {
          addTag(inputValue);
        }
      } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
        removeTag(tags.length - 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    React.useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setShowSuggestions(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div ref={containerRef} className="relative">
        <div
          className={cn(
            "flex flex-wrap gap-2 p-3 min-h-[48px] rounded-md border border-zinc-700 bg-zinc-900 focus-within:ring-2 focus-within:ring-pink-500 focus-within:ring-offset-2 focus-within:ring-offset-black",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          onClick={() => inputRef.current?.focus()}
        >
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-400 text-sm font-medium border border-pink-500/30"
            >
              {tag}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                disabled={disabled}
                className="hover:text-pink-300 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ""}
            disabled={disabled || (maxTags !== undefined && tags.length >= maxTags)}
            className="flex-1 min-w-[120px] bg-transparent text-white text-sm outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed"
          />
        </div>
        
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 py-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-48 overflow-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addTag(suggestion)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm text-white hover:bg-zinc-700 transition-colors",
                  index === highlightedIndex && "bg-zinc-700"
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
)
TagInput.displayName = "TagInput"

export { TagInput }

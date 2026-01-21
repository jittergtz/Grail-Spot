import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export const SearchBar = ({ value, onChange, onClear }: SearchBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    if (value) {
      setIsExpanded(true);
    }
  }, [value]);

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = (e: React.FocusEvent) => {
    // Don't collapse if clicking inside the container
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node) && !value) {
      setIsExpanded(false);
    }
  };

  const handleClear = () => {
    onClear();
    // Collapse after clearing if no value
    setIsExpanded(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={`relative transition-all duration-300 ease-in-out ${
          isExpanded ? "w-[360px]" : "w-10"
        }`}
      >
        {!isExpanded ? (
          <button
            onClick={handleExpand}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-zinc-100 hover:bg-white  transition-colors shadow-md"
          >
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search by title, category, or description..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={handleCollapse}
              className="pl-10 pr-10 h-10 rounded-full outline-none text-base bg-white backdrop-blur-lg shadow-md border-0 "
            />
            {value && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

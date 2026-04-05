import React, { useEffect, useRef, useState } from 'react';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  label?: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled,
  className = '',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered =
    query.trim().length === 0
      ? options
      : options.filter((o) => {
        const haystack = `${o.label} ${o.description ?? ''}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      });

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsAnimating(true);
        setTimeout(() => {
          setOpen(false);
          setIsAnimating(false);
        }, 200);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleToggle = () => {
    if (disabled) return;
    if (open) {
      setIsAnimating(true);
      setTimeout(() => {
        setOpen(false);
        setIsAnimating(false);
      }, 200);
    } else {
      setOpen(true);
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsAnimating(true);
    setTimeout(() => {
      setOpen(false);
      setQuery('');
      setIsAnimating(false);
    }, 150);
  };

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2 ios-appear">{label}</label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`
          relative w-full flex items-center justify-between
          rounded-2xl border px-4 py-3.5 text-sm text-left
          bg-white/95 backdrop-blur-xl shadow-sm
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${open
            ? 'border-orange-500/50 ring-2 ring-orange-500/20 shadow-lg shadow-orange-500/10 scale-[1.01]'
            : 'border-gray-200/80 hover:border-gray-300 hover:shadow-md active:scale-[0.99]'
          }
        `}
      >
        <span className={`transition-colors duration-200 ${selected ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${open ? 'rotate-180 text-orange-500' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          ref={dropdownRef}
          className={`
            mt-2 w-full rounded-2xl border border-gray-200/50
            bg-white/98 backdrop-blur-2xl shadow-2xl shadow-black/10
            max-h-72 overflow-hidden z-50 relative
            transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isAnimating
              ? 'opacity-0 scale-95 translate-y-[-8px]'
              : 'opacity-100 scale-100 translate-y-0'
            }
          `}
          style={{
            animation: 'ios-dropdown-enter 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div className="p-3 border-b border-gray-100/80">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="
                w-full px-3 py-2 text-sm rounded-xl border border-gray-200/80
                bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-500/30
                focus:border-orange-500/50 transition-all duration-200
                placeholder:text-gray-400
              "
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1.5 custom-scrollbar">
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">No results found</div>
            )}
            {filtered.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full flex flex-col items-start px-4 py-2.5 text-left
                    transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                    hover:bg-orange-50/50 active:bg-orange-100/50 active:scale-[0.98]
                    ${isSelected ? 'bg-orange-50/80 border-l-2 border-orange-500' : ''}
                  `}
                  style={{
                    animationDelay: `${index * 20}ms`,
                    animation: 'ios-fade-in 0.2s ease-out both',
                  }}
                >
                  <span className={`text-sm ${isSelected ? 'text-orange-600 font-medium' : 'text-gray-900'}`}>
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="text-xs text-gray-500 mt-0.5">{option.description}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

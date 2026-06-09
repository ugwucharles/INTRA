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
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2 ios-appear">{label}</label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-expanded={open}
        className={`
          relative w-full flex items-center justify-between gap-2
          h-9 px-3 rounded-xl border text-[13px] text-left
          bg-white transition-all duration-150
          ${disabled ? 'cursor-not-allowed opacity-50 border-gray-200 text-gray-400' : 'cursor-pointer'}
          ${
            open
              ? 'border-gray-300 ring-2 ring-gray-900/[0.06] shadow-sm'
              : 'border-gray-200/80 shadow-sm hover:border-gray-300 hover:bg-gray-50/50'
          }
        `}
      >
        <span className={`truncate ${selected ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          ref={dropdownRef}
          className={`
            absolute z-50 mt-1.5 w-full rounded-xl border border-gray-100
            bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)]
            max-h-72 overflow-hidden
            transition-all duration-150
            ${isAnimating ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'}
          `}
        >
          <div className="p-2 border-b border-gray-50">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-gray-900/[0.06] focus:border-gray-300 focus:bg-white placeholder:text-gray-400 transition-colors"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-[13px] text-gray-400 text-center">No results found</div>
            )}
            {filtered.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full flex items-center justify-between gap-3 px-3 py-2 text-left
                    transition-colors duration-100
                    ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'}
                  `}
                >
                  <div className="min-w-0">
                    <span className={`block text-[13px] truncate ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="block text-[11px] text-gray-400 truncate mt-0.5">{option.description}</span>
                    )}
                  </div>
                  {isSelected && (
                    <svg className="w-4 h-4 flex-shrink-0 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
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

import React, { useEffect, useRef, useState } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  divider?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  align?: 'left' | 'right';
  trigger?: React.ReactNode;
  theme?: 'dark' | 'light';
  label?: string;
  hideValueOnMobile?: boolean;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className = '',
  buttonClassName = '',
  hideValueOnMobile = false,
  align = 'left',
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`
          w-full flex items-center justify-between gap-2
          h-9 px-3 rounded-xl text-[13px] text-left
          border transition-all duration-150
          ${buttonClassName}
          ${
            disabled
              ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
              : 'cursor-pointer bg-white border-gray-200/80 text-gray-900 hover:border-gray-300 hover:bg-gray-50/50'
          }
          ${open ? 'border-gray-300 bg-white ring-2 ring-gray-900/[0.06] shadow-sm' : 'shadow-sm'}
        `}
      >
        <span
          className={`truncate ${hideValueOnMobile ? 'hidden sm:inline' : ''} ${
            selected ? 'font-medium text-gray-900' : 'text-gray-500'
          }`}
        >
          {selected ? selected.label : placeholder}
        </span>
        {hideValueOnMobile && !selected && (
          <span className="sm:hidden text-gray-500 font-medium">···</span>
        )}
        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          } ${hideValueOnMobile ? 'sm:ml-0' : ''}`}
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
          role="listbox"
          className={`
            absolute z-50 mt-1.5 py-1 min-w-full w-max max-w-[min(100vw-2rem,280px)]
            max-h-56 overflow-y-auto rounded-xl
            border border-gray-100 bg-white
            shadow-[0_4px_24px_rgba(0,0,0,0.08)]
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          {options.map((option) => {
            const isSelected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full flex items-center justify-between gap-3 px-3 py-2 text-[13px] text-left
                  transition-colors duration-100
                  ${
                    isSelected
                      ? 'bg-gray-50 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <svg
                    className="w-4 h-4 flex-shrink-0 text-gray-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

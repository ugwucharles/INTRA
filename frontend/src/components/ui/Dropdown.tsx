import React, { useEffect, useRef, useState } from 'react';
import styles from './Dropdown.module.css';

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
  // Previously used props kept for compatibility but largely ignored/shimmed
  buttonClassName?: string;
  align?: 'left' | 'right';
  trigger?: React.ReactNode;
  theme?: 'dark' | 'light';
  label?: string; // Optional label for the button
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className = '',
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleSelect = (optionValue: string) => {
    if (onChange) {
      onChange(optionValue);
    }
    setOpen(false);
  };

  return (
    <div
      className={`${styles.menu} ${className}`}
      ref={containerRef}
      onMouseEnter={() => !disabled && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className={`${styles.item} ${open ? styles.open : ''}`}>
        <button
          type="button"
          className={styles.link}
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
        >
          <span>{selected ? selected.label : placeholder}</span>
          <svg viewBox="0 0 360 360" xmlSpace="preserve">
            <path
              d="M325.607,79.393c-5.857-5.857-15.355-5.858-21.213,0.001l-139.39,139.393L25.607,79.393 c-5.857-5.857-15.355-5.858-21.213,0.001c-5.858,5.858-5.858,15.355,0,21.213l150.004,150c2.813,2.813,6.628,4.393,10.606,4.393 s7.794-1.581,10.606-4.394l149.996-150C331.465,94.749,331.465,85.251,325.607,79.393z"
            />
          </svg>
        </button>

        <div className={styles.submenu}>
          {options.map((option) => (
            <div key={option.value} className={styles.submenuItem}>
              <button
                type="button"
                className={`${styles.submenuLink} ${value === option.value ? styles.active : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(option.value);
                }}
              >
                <span>{option.label}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

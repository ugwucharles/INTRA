import React from 'react';
import { Dropdown, DropdownOption } from './Dropdown';

interface SelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  hideValueOnMobile?: boolean;
  align?: 'left' | 'right';
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className = '',
  label,
  hideValueOnMobile = false,
  align = 'left',
}: SelectProps) {
  const dropdownOptions: DropdownOption[] = options.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  return (
    <div className={className}>
      {label && (
        <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          {label}
        </label>
      )}
      <Dropdown
        options={dropdownOptions}
        value={value || undefined}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        hideValueOnMobile={hideValueOnMobile}
        align={align}
      />
    </div>
  );
}

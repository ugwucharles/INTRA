import React, { useEffect, useRef, useState } from 'react';
import { Dropdown, DropdownOption } from './Dropdown';

interface SelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className = '',
  label,
}: SelectProps) {
  const dropdownOptions: DropdownOption[] = options.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  const selected = options.find((o) => o.value === value);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}
      <Dropdown
        options={dropdownOptions}
        value={value || undefined}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

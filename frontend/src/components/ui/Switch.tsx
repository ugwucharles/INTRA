import React, { useState } from 'react';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  size = 'md',
  className = '',
}: SwitchProps) {
  const [isPressed, setIsPressed] = useState(false);

  const sizes = {
    sm: {
      track: 'h-5 w-9',
      thumb: 'h-4 w-4',
      onPosition: 'calc(100% - 18px)',
      offPosition: '2px',
    },
    md: {
      track: 'h-7 w-12',
      thumb: 'h-6 w-6',
      onPosition: 'calc(100% - 26px)',
      offPosition: '2px',
    },
  }[size];

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    onCheckedChange(!checked);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        relative inline-flex items-center rounded-full
        transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500/40
        ${checked
          ? 'bg-orange-500 shadow-[0_0_15px_-3px_rgba(255,190,46,0.4)]'
          : 'bg-gray-200/80'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${isPressed ? 'scale-95' : 'scale-100'}
        ${sizes.track}
        ${className}
      `}
    >
      {/* Track Background Glow (Inside) */}
      <span
        className={`absolute inset-0 rounded-full transition-opacity duration-500 ${checked ? 'opacity-100' : 'opacity-0'}`}
        style={{
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)'
        }}
      />

      {/* Thumb */}
      <span
        className={`
          absolute rounded-full bg-white
          shadow-[0_2px_4px_rgba(0,0,0,0.1),0_0_1px_rgba(0,0,0,0.1)]
          transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${sizes.thumb}
        `}
        style={{
          top: '50%',
          left: checked ? sizes.onPosition : sizes.offPosition,
          transform: `translateY(-50%) ${isPressed ? 'scaleX(1.15) scaleY(0.9)' : 'scale(1)'}`,
          transformOrigin: checked ? 'right' : 'left',
          willChange: 'left, transform',
        }}
      />
    </button>
  );
}

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
      track: 'h-5 w-9', // 36px wide, 20px tall
      thumb: 'h-4 w-4', // 16px
      offPosition: '2px',
      onPosition: '18px', // 36px track - 16px thumb - 2px right padding = 18px
    },
    md: {
      track: 'h-6 w-11', // 44px wide, 24px tall  
      thumb: 'h-5 w-5', // 20px
      offPosition: '2px',
      onPosition: '20px', // Adjusted to ensure full visibility with proper padding
    },
  }[size];

  const handleClick = () => {
    if (disabled) return;
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
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
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50
        ${checked 
          ? 'bg-blue-500 shadow-lg shadow-blue-500/30' 
          : 'bg-gray-300/80 dark:bg-gray-600/50'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${isPressed ? 'scale-95' : 'scale-100'}
        ${sizes.track}
        ${className}
      `}
      style={{
        transition: 'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <span
        className={`
          absolute rounded-full bg-white
          shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${sizes.thumb}
        `}
        style={{
          top: '50%',
          left: checked ? sizes.onPosition : sizes.offPosition,
          transform: `translateY(-50%) ${isPressed ? 'scale(0.95)' : 'scale(1)'}`,
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'left, transform',
        }}
      />
    </button>
  );
}

import React, { useState } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses =
    'font-medium relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:from-orange-600 hover:to-orange-700 active:shadow-md',
    secondary:
      'bg-white/95 backdrop-blur-sm text-gray-900 border border-gray-200/80 shadow-sm hover:bg-white hover:shadow-md hover:border-gray-300 active:shadow-sm',
    ghost:
      'text-gray-700 hover:bg-gray-100/80 border border-transparent active:bg-gray-200/80',
  } as const;

  const sizeClasses = {
    sm: 'px-4 py-2.5 text-sm rounded-2xl',
    md: 'px-6 py-3 text-base rounded-2xl',
    lg: 'px-8 py-4 text-lg rounded-2xl',
  } as const;

  return (
    <button
      onMouseDown={() => !props.disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${isPressed ? 'scale-[0.96]' : 'scale-100'}
        ${className}
      `}
      style={{
        transform: isPressed ? 'scale(0.96)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {variant === 'primary' && (
        <span 
          className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700"
          style={{ transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      )}
    </button>
  );
}


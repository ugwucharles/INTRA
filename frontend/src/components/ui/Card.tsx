import React, { useState } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false, ...props }: CardProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      onMouseDown={() => hover && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        bg-white/95 backdrop-blur-xl
        rounded-3xl border border-gray-200/50
        shadow-lg shadow-black/5
        transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${hover
          ? 'cursor-pointer ios-hover-lift active:scale-[0.98]'
          : ''
        }
        ${isPressed && hover ? 'scale-[0.98] shadow-md' : ''}
        ${className}
      `}
      style={{
        willChange: hover ? 'transform, box-shadow' : 'auto',
        ...props.style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}


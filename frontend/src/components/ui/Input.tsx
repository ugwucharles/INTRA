import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 text-base
          rounded-2xl border border-gray-300 bg-white
          shadow-sm
          focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
          transition-all duration-200
          placeholder:text-gray-400 text-gray-900
          ${error ? 'border-red-500 focus:ring-red-500 bg-red-50' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}


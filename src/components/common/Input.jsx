import React from 'react';

/**
 * Input Component
 * Reusable text input with validation states
 */
const Input = React.forwardRef(({
  type = 'text',
  placeholder = '',
  label,
  error,
  required = false,
  className = '',
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          className={`
            w-full rounded-2xl border bg-white/92 px-4 py-3 text-slate-900 shadow-sm transition-colors duration-200
            placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error 
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100' 
              : 'border-slate-200 focus:border-blue-500'
            }
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

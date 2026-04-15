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
        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
            w-full px-4 py-2.5 rounded-lg border-2 transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-purple-500
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-200 focus:border-purple-500'
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

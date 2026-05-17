import React from 'react';

/**
 * Button Component
 * Supports multiple variants, sizes, and states
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100';
  
  const variants = {
    primary: 'bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.24)] hover:-translate-y-0.5 hover:bg-blue-700 disabled:bg-blue-300',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 disabled:bg-slate-100 disabled:text-slate-400',
    outline: 'border border-slate-300 bg-white/85 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:border-slate-200 disabled:text-slate-400',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
};

export default Button;

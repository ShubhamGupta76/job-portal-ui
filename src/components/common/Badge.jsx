import React from 'react';

/**
 * Badge Component
 * Display tags and labels with different variants
 */
const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-purple-100 text-purple-700',
    success: 'bg-green-100 text-green-700',
    danger: 'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-700',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;

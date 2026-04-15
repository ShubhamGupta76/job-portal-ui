import React from 'react';

/**
 * Card Component
 * Wrapper for content with shadow, padding, and border
 */
const Card = ({
  children,
  className = '',
  variant = 'default',
  hoverable = false,
  ...props
}) => {
  const baseStyles = 'bg-white rounded-lg border transition-all duration-200';
  
  const variants = {
    default: 'border-gray-200 shadow-sm',
    elevated: 'border-gray-100 shadow-md',
    bordered: 'border-2 border-gray-300',
  };

  const hoverStyles = hoverable ? 'hover:shadow-lg hover:border-purple-200 cursor-pointer' : '';

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

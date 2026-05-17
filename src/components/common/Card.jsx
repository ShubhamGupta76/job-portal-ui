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
  const baseStyles = 'rounded-[24px] border border-slate-200/70 bg-white/88 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur transition-all duration-200';
  
  const variants = {
    default: '',
    elevated: 'shadow-[0_28px_70px_rgba(15,23,42,0.12)]',
    bordered: 'border-slate-300 bg-white',
  };

  const hoverStyles = hoverable ? 'cursor-pointer hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_60px_rgba(37,99,235,0.14)]' : '';

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

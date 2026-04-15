/**
 * Utility functions for the application
 */

/**
 * Format currency with Indian numbering system
 */
export const formatCurrency = (value) => {
  if (!value) return '₹0';
  return `₹${value.toLocaleString('en-IN')}`;
};

/**
 * Format date in readable format
 */
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get days ago from a date
 */
export const getDaysAgo = (date) => {
  const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
};

/**
 * Validate email
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /[0-9]/.test(password),
  };
  
  const score = Object.values(requirements).filter(Boolean).length;
  return {
    requirements,
    score,
    strength: score < 2 ? 'Weak' : score < 4 ? 'Medium' : 'Strong',
  };
};

/**
 * Truncate string to specified length
 */
export const truncateString = (str, length = 100) => {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}...` : str;
};

/**
 * Debounce function
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Normalize backend role names to frontend role names
 */
export const normalizeUserRole = (role) => {
  if (!role) return null;

  const normalizedRole = role.toLowerCase().replace(/^role_/, '');

  if (normalizedRole === 'user') return 'candidate';
  if (normalizedRole === 'recruiter') return 'recruiter';
  if (normalizedRole === 'candidate') return 'candidate';

  return normalizedRole;
};

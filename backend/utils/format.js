// src/utils/format.js

/**
 * Safely formats a number to currency with 2 decimal places
 * @param {number|string|null|undefined} amount - The amount to format
 * @param {string} currencySymbol - The currency symbol (default: 'K')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencySymbol = 'K') => {
  const num = Number(amount) || 0;
  return `${currencySymbol}${num.toFixed(2)}`;
};

/**
 * Safely formats a number
 * @param {number|string|null|undefined} number - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string
 */
export const formatNumber = (number, decimals = 2) => {
  const num = Number(number) || 0;
  return num.toFixed(decimals);
};

/**
 * Safely formats mileage
 * @param {number|string|null|undefined} mileage - The mileage to format
 * @returns {string} Formatted mileage string
 */
export const formatMileage = (mileage) => {
  const num = Number(mileage) || 0;
  return num.toLocaleString() + ' miles';
};

/**
 * Safely formats a date
 * @param {string|Date|null|undefined} date - The date to format
 * @param {string} formatString - Date format string (default: 'MMM dd, yyyy')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatString = 'MMM dd, yyyy') => {
  if (!date) return 'No date';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    // You can use date-fns or similar here
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
};
/**
 * Currency formatting utility
 * Default currency: PHP (Philippine Peso)
 */

/**
 * Format amount as Philippine Peso
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'PHP')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'PHP') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₱0.00';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (currency === 'PHP') {
    // Format as Philippine Peso
    return `₱${numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // Fallback to Intl.NumberFormat for other currencies
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

/**
 * Format amount without currency symbol (for charts/graphs)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted number string
 */
export const formatAmount = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

/**
 * Format currency for chart value formatters
 * @param {number} value - The value to format
 * @param {string} currency - Currency code (default: 'PHP')
 * @returns {string} Formatted currency string for charts
 */
export const formatCurrencyForChart = (value, currency = 'PHP') => {
  if (currency === 'PHP') {
    return `₱${formatAmount(value)}`;
  }
  return formatCurrency(value, currency);
};


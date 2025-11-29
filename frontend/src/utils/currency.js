/**
 * Currency formatting utility
 * Default currency: PHP (Philippine Peso)
 */

// Global currency variable that gets updated by CurrencyContext
let globalCurrency = 'PHP';

/**
 * Set the global currency (called by CurrencyContext)
 * @param {string} currency - Currency code
 */
export const setGlobalCurrency = (currency) => {
  globalCurrency = currency || 'PHP';
};

/**
 * Get the current global currency
 * @returns {string} Current currency code
 */
export const getGlobalCurrency = () => {
  return globalCurrency;
};

/**
 * Format amount with currency symbol
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (optional, uses global currency if not provided)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = null) => {
  const currencyToUse = currency || globalCurrency;
  if (amount === null || amount === undefined || isNaN(amount)) {
    // Return default based on currency
    if (currencyToUse === 'PHP') {
      return '₱0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyToUse,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0);
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (currencyToUse === 'PHP') {
    // Format as Philippine Peso
    return `₱${numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // Use Intl.NumberFormat for other currencies
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyToUse,
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
 * @param {string} currency - Currency code (optional, uses global currency if not provided)
 * @returns {string} Formatted currency string for charts
 */
export const formatCurrencyForChart = (value, currency = null) => {
  const currencyToUse = currency || globalCurrency;
  if (currencyToUse === 'PHP') {
    return `₱${formatAmount(value)}`;
  }
  return formatCurrency(value, currencyToUse);
};


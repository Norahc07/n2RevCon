import { useCurrency } from '../contexts/CurrencyContext';
import { formatCurrency as formatCurrencyUtil, formatCurrencyForChart as formatCurrencyForChartUtil } from '../utils/currency';

/**
 * Hook to format currency using the currency from context
 * @returns {Object} Object with formatCurrency and formatCurrencyForChart functions
 */
export const useCurrencyFormat = () => {
  const { currency } = useCurrency();

  const formatCurrency = (amount) => {
    return formatCurrencyUtil(amount, currency);
  };

  const formatCurrencyForChart = (value) => {
    return formatCurrencyForChartUtil(value, currency);
  };

  return {
    currency,
    formatCurrency,
    formatCurrencyForChart,
  };
};


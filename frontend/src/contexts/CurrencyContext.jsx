import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { companyAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { setGlobalCurrency } from '../utils/currency';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState('PHP'); // Default to PHP
  const [loading, setLoading] = useState(true);

  const loadCurrency = useCallback(async () => {
    try {
      const response = await companyAPI.getProfile();
      const companyCurrency = response.data.company?.settings?.currency || 'PHP';
      setCurrency(companyCurrency);
      setGlobalCurrency(companyCurrency); // Update global currency
    } catch (error) {
      console.error('Failed to load currency:', error);
      // Keep default PHP if loading fails
      const defaultCurrency = 'PHP';
      setCurrency(defaultCurrency);
      setGlobalCurrency(defaultCurrency);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load currency from company profile
  useEffect(() => {
    if (user) {
      loadCurrency();
    } else {
      setLoading(false);
    }
  }, [user, loadCurrency]);

  const updateCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    setGlobalCurrency(newCurrency); // Update global currency
  };

  return (
    <CurrencyContext.Provider value={{ currency, updateCurrency, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};


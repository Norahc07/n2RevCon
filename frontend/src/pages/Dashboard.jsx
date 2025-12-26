import { useState, useEffect, useMemo, useCallback } from 'react';
import { dashboardAPI, projectAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { PieChart } from '@mui/x-charts/PieChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import toast from 'react-hot-toast';
import { formatCurrency, formatCurrencyForChart } from '../utils/currency';
import {
  CurrencyDollarIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  BellIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  isPushNotificationSupported,
} from '../utils/pushNotifications';
import { CardSkeleton, ChartSkeleton } from '../components/skeletons';

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [projectStatusViewAll, setProjectStatusViewAll] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [focusedYearDropdown, setFocusedYearDropdown] = useState(false);

  // Define functions before using them in useEffect
  const fetchProjects = useCallback(async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Failed to load projects for year filter:', error);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const params = projectStatusViewAll ? { viewAll: true } : year === 'all' ? { viewAll: true } : { year: parseInt(year) };
      const response = await dashboardAPI.getSummary(params);
      setSummary(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [year, projectStatusViewAll]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Check and show notification permission prompt
  useEffect(() => {
    if (user && isPushNotificationSupported() && 'Notification' in window) {
      // Check if permission is already granted or denied
      if (Notification.permission === 'granted' || Notification.permission === 'denied') {
        return;
      }

      // Only show if permission is 'default' (not yet asked)
      if (Notification.permission !== 'default') {
        return;
      }

      // Check if user previously dismissed the prompt
      const dismissedPrompt = localStorage.getItem('notification-prompt-dismissed');
      if (dismissedPrompt) {
        // Check if it was dismissed today, don't show again until tomorrow
        const dismissedDate = new Date(dismissedPrompt);
        const today = new Date();
        const isSameDay = dismissedDate.toDateString() === today.toDateString();
        if (isSameDay) {
          return;
        }
      }

      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setShowNotificationPrompt(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user]);

  // Handle allow notification
  const handleAllowNotification = async () => {
    try {
      setRequestingPermission(true);
      
      // Request notification permission
      const hasPermission = await requestNotificationPermission();
      
      if (hasPermission) {
        // Subscribe to push notifications
        const userId = user?.id || user?._id;
        if (userId) {
          try {
            await subscribeToPushNotifications(userId);
            toast.success('Notifications enabled! You will receive desktop and mobile notifications.');
          } catch (subscribeError) {
            // If subscription fails but permission is granted, still consider it enabled
            console.warn('Push subscription failed, but permission granted:', subscribeError);
            toast.success('Notification permission granted! You will receive browser notifications.');
          }
        } else {
          toast.success('Notification permission granted! You will receive browser notifications.');
        }
        
        // Hide prompt and clear any dismissal record
        setShowNotificationPrompt(false);
        localStorage.removeItem('notification-prompt-dismissed');
      } else {
        // Permission was denied
        setShowNotificationPrompt(false);
        toast.error('Notification permission was denied. You can enable it later in your browser settings.');
      }
    } catch (error) {
      console.error('Notification permission error:', error);
      
      // Check if error is because permission was denied
      if (error.message && error.message.includes('denied')) {
        setShowNotificationPrompt(false);
        toast.error('Notification permission was denied. You can enable it later in your browser settings.');
      } else {
        toast.error('Failed to enable notifications. Please check your browser settings.');
      }
    } finally {
      setRequestingPermission(false);
    }
  };

  // Handle not now - will show again tomorrow
  const handleNotNow = () => {
    setShowNotificationPrompt(false);
    // Store current date so it shows again tomorrow
    localStorage.setItem('notification-prompt-dismissed', new Date().toISOString());
  };

  // Get available years from projects (exclude 2026 and beyond)
  const availableYears = useMemo(() => {
    if (!projects || projects.length === 0) {
      return [new Date().getFullYear()]; // Fallback to current year
    }
    const years = new Set();
    projects.forEach((project) => {
      if (project.startDate) {
        try {
          const startYear = new Date(project.startDate).getFullYear();
          if (!isNaN(startYear) && startYear <= 2025) {
            years.add(startYear);
          }
        } catch (e) {
          console.warn('Invalid startDate:', project.startDate);
        }
      }
      if (project.endDate) {
        try {
          const endYear = new Date(project.endDate).getFullYear();
          if (!isNaN(endYear) && endYear <= 2025) {
            years.add(endYear);
          }
        } catch (e) {
          console.warn('Invalid endDate:', project.endDate);
        }
      }
      // Also add years in between start and end dates (but cap at 2025)
      if (project.startDate && project.endDate) {
        try {
          const startYear = new Date(project.startDate).getFullYear();
          const endYear = new Date(project.endDate).getFullYear();
          if (!isNaN(startYear) && !isNaN(endYear)) {
            const minYear = Math.min(startYear, endYear);
            const maxYear = Math.min(Math.max(startYear, endYear), 2025); // Cap at 2025
            for (let y = minYear; y <= maxYear; y++) {
              if (y <= 2025) {
                years.add(y);
              }
            }
          }
        } catch (e) {
          console.warn('Invalid date range:', project.startDate, project.endDate);
        }
      }
    });
    const sortedYears = Array.from(years).filter(y => y <= 2025).sort((a, b) => b - a);
    return sortedYears.length > 0 ? sortedYears : [new Date().getFullYear()];
  }, [projects]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton count={4} />
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6 shadow-md">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4 animate-pulse"></div>
            <ChartSkeleton type="pie" height="300px" />
          </div>
          <div className="card p-6 shadow-md">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4 animate-pulse"></div>
            <ChartSkeleton type="bar" height="300px" />
          </div>
        </div>

        {/* Line Chart Skeleton */}
        <div className="card p-6 shadow-md">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <ChartSkeleton type="line" height="350px" />
        </div>
      </div>
    );
  }

  if (!summary) {
    return <div className="text-center text-gray-500">No data available</div>;
  }

  // Consistent color scheme for all analytics
  const COLORS = {
    // Primary brand colors (red gradient)
    primary: '#DC2626',      // Red-600
    primaryLight: '#EF4444',  // Red-500
    primaryLighter: '#F87171', // Red-400
    
    // Success/Positive (green)
    success: '#10B981',       // Emerald-500
    successLight: '#34D399',  // Emerald-400
    successDark: '#059669',   // Emerald-600
    
    // Warning/Neutral (amber/yellow)
    warning: '#F59E0B',       // Amber-500
    warningLight: '#FBBF24',  // Amber-400
    
    // Info/Neutral (blue)
    info: '#3B82F6',         // Blue-500
    infoLight: '#60A5FA',    // Blue-400
    
    // Danger/Negative (red)
    danger: '#EF4444',       // Red-500
    dangerLight: '#F87171',  // Red-400
    
    // Neutral/Gray
    neutral: '#6B7280',       // Gray-500
    neutralLight: '#9CA3AF',  // Gray-400
  };

  // Prepare data for Revenue vs Expenses Line Chart (by project)
  const revenueData = summary.revenueVsExpenses?.revenue || [];
  const expenseData = summary.revenueVsExpenses?.expenses || [];
  
  // Get all unique projects from both revenue and expense data
  const allProjectIds = new Set();
  revenueData.forEach(item => {
    if (item._id) allProjectIds.add(item._id.toString());
  });
  expenseData.forEach(item => {
    if (item._id) allProjectIds.add(item._id.toString());
  });
  
  // Create a map for quick lookup
  const revenueMap = new Map();
  revenueData.forEach(item => {
    if (item._id) {
      revenueMap.set(item._id.toString(), item);
    }
  });
  
  const expenseMap = new Map();
  expenseData.forEach(item => {
    if (item._id) {
      expenseMap.set(item._id.toString(), item);
    }
  });
  
  // Build the chart data
  const revenueVsExpensesData = Array.from(allProjectIds).map(projectId => {
    const revenueItem = revenueMap.get(projectId);
    const expenseItem = expenseMap.get(projectId);
    const projectName = revenueItem?.projectName || expenseItem?.projectName || 'Unknown Project';
    const projectCode = revenueItem?.projectCode || expenseItem?.projectCode || 'N/A';
    const displayName = projectCode !== 'N/A' ? `${projectCode}` : projectName;
    
    return {
      project: displayName,
      projectName: projectName,
      Revenue: revenueItem?.total || 0,
      Expenses: expenseItem?.total || 0,
    };
  }).sort((a, b) => {
    // Sort by total revenue + expenses descending
    const totalA = a.Revenue + a.Expenses;
    const totalB = b.Revenue + b.Expenses;
    return totalB - totalA;
  });

  // Prepare data for Billing Status Pie Chart with consistent colors
  const billingStatusData = [
    { 
      id: 0, 
      value: (summary.billingStatus?.sent?.count || 0) + (summary.billingStatus?.paid?.count || 0), 
      label: 'Billed',
      color: COLORS.success
    },
    { 
      id: 1, 
      value: summary.billingStatus?.draft?.count || 0, 
      label: 'Unbilled',
      color: COLORS.warning
    },
  ].filter(item => item.value > 0);

  // Prepare data for Payment Status Bar Chart (by amount, not count) with colors
  const paymentStatusData = [
    { 
      status: 'Paid', 
      amount: summary.paymentStatus?.paid?.totalAmount || 0,
      color: '#10B981' // Green
    },
    { 
      status: 'Unpaid', 
      amount: summary.paymentStatus?.unpaid?.totalAmount || 0,
      color: '#EF4444' // Red
    },
    { 
      status: 'Uncollectible', 
      amount: summary.paymentStatus?.uncollectible?.totalAmount || 0,
      color: '#F59E0B' // Orange/Amber
    },
  ].filter(item => item.amount > 0);
  
  // Create separate series for each payment status - each series has one bar, others are 0
  // This ensures each bar has its own color
  const paymentStatusSeries = paymentStatusData.map((item, index) => ({
    data: paymentStatusData.map((d, i) => i === index ? d.amount : 0),
    color: item.color,
    valueFormatter: (value) => value > 0 ? formatCurrencyForChart(value) : '',
    label: item.status,
  }));
  
  // Prepare data for Project Status with colors
  const projectStatusDataWithColors = [
    { status: 'Pending', value: summary.projectStatus?.pending || 0, color: '#F59E0B' }, // Orange/Amber
    { status: 'Ongoing', value: summary.projectStatus?.ongoing || 0, color: '#3B82F6' }, // Blue
    { status: 'Completed', value: summary.projectStatus?.completed || 0, color: '#10B981' }, // Green
  ].filter(item => item.value > 0);
  
  // Create separate series for each status - each series has one bar, others are 0
  // This ensures each bar has its own color
  const projectStatusSeries = projectStatusDataWithColors.map((item, index) => ({
    data: projectStatusDataWithColors.map((d, i) => i === index ? d.value : 0),
    color: item.color,
    valueFormatter: (value) => value > 0 ? value.toString() : '',
    label: item.status,
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Notification Permission Prompt */}
      {showNotificationPrompt && user && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4 shadow-lg animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="bg-blue-100 rounded-full p-2">
                <BellIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                Receive Desktop & Mobile Notifications
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Stay updated with project deadlines, billing reminders, and important system notifications even when you're away.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAllowNotification}
                  disabled={requestingPermission}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BellIcon className="w-4 h-4" />
                  {requestingPermission ? 'Enabling...' : 'Allow Notification'}
                </button>
                <button
                  onClick={handleNotNow}
                  disabled={requestingPermission}
                  className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 px-4 py-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Not Now
                </button>
              </div>
            </div>
            <button
              onClick={handleNotNow}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={requestingPermission}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left w-full sm:w-auto">Dashboard</h1>
        <div className="relative w-full sm:w-auto">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-gray-400 pointer-events-none z-10" />
          {focusedYearDropdown ? (
            <ChevronUpIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-gray-400 pointer-events-none z-10" />
          ) : (
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-gray-400 pointer-events-none z-10" />
          )}
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            onFocus={() => setFocusedYearDropdown(true)}
            onBlur={() => setFocusedYearDropdown(false)}
            className="w-full sm:w-auto border-2 border-gray-300 rounded-lg pl-9 xs:pl-10 pr-9 xs:pr-10 py-2 focus:outline-none focus:border-red-600 transition-colors duration-200 text-xs xs:text-sm sm:text-base appearance-none cursor-pointer bg-white"
          >
            <option value="all">All Years</option>
            {availableYears.length > 0 ? (
              availableYears.map((y) => (
                <option key={y} value={y.toString()}>
                  {y}
                </option>
              ))
            ) : (
              // Fallback to current year if no projects found yet
              <option value={new Date().getFullYear().toString()}>
                {new Date().getFullYear()}
              </option>
            )}
          </select>
        </div>
      </div>

      {/* Summary Cards - 4 columns with icons */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
        {/* Total Revenue Card */}
        <div className="card bg-gradient-to-br from-white to-green-50 border-l-4 border-green-500 hover:shadow-lg transition-shadow duration-200 p-3 xs:p-4 sm:p-6">
          <div className="flex flex-col xs:flex-row items-center xs:justify-between gap-2 mb-2">
            <h3 className="text-xs xs:text-sm font-medium text-gray-600 text-center xs:text-left">Total Revenue</h3>
            <div className="p-1.5 xs:p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="w-4 h-4 xs:w-5 xs:h-5 text-green-600" />
            </div>
          </div>
          <p className="text-lg xs:text-xl sm:text-2xl font-bold text-green-600 text-center xs:text-left break-all">
            {formatCurrency(summary.totals?.revenue || 0)}
          </p>
        </div>

        {/* Total Expenses Card */}
        <div className="card bg-gradient-to-br from-white to-red-50 border-l-4 border-red-500 hover:shadow-lg transition-shadow duration-200 p-3 xs:p-4 sm:p-6">
          <div className="flex flex-col xs:flex-row items-center xs:justify-between gap-2 mb-2">
            <h3 className="text-xs xs:text-sm font-medium text-gray-600 text-center xs:text-left">Total Expenses</h3>
            <div className="p-1.5 xs:p-2 bg-red-100 rounded-lg">
              <ArrowTrendingDownIcon className="w-4 h-4 xs:w-5 xs:h-5 text-red-600" />
            </div>
          </div>
          <p className="text-lg xs:text-xl sm:text-2xl font-bold text-red-600 text-center xs:text-left break-all">
            {formatCurrency(summary.totals?.expenses || 0)}
          </p>
        </div>

        {/* Net Profit Card */}
        <div className={`card bg-gradient-to-br from-white ${((summary.totals?.revenue || 0) - (summary.totals?.expenses || 0)) >= 0 ? 'to-green-50 border-l-4 border-green-500' : 'to-red-50 border-l-4 border-red-500'} hover:shadow-lg transition-shadow duration-200 p-3 xs:p-4 sm:p-6`}>
          <div className="flex flex-col xs:flex-row items-center xs:justify-between gap-2 mb-2">
            <h3 className="text-xs xs:text-sm font-medium text-gray-600 text-center xs:text-left">Net Profit</h3>
            <div className={`p-1.5 xs:p-2 rounded-lg ${((summary.totals?.revenue || 0) - (summary.totals?.expenses || 0)) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <ChartBarIcon className={`w-4 h-4 xs:w-5 xs:h-5 ${((summary.totals?.revenue || 0) - (summary.totals?.expenses || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
          <p className={`text-lg xs:text-xl sm:text-2xl font-bold text-center xs:text-left break-all ${((summary.totals?.revenue || 0) - (summary.totals?.expenses || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency((summary.totals?.revenue || 0) - (summary.totals?.expenses || 0))}
          </p>
        </div>

        {/* Total Projects Card */}
        <div className="card bg-gradient-to-br from-white to-blue-50 border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-200 p-3 xs:p-4 sm:p-6">
          <div className="flex flex-col xs:flex-row items-center xs:justify-between gap-2 mb-2">
            <h3 className="text-xs xs:text-sm font-medium text-gray-600 text-center xs:text-left">Total Projects</h3>
            <div className="p-1.5 xs:p-2 bg-blue-100 rounded-lg">
              <BuildingOfficeIcon className="w-4 h-4 xs:w-5 xs:h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-lg xs:text-xl sm:text-2xl font-bold text-blue-600 text-center xs:text-left">
            {(summary.projectStatus?.pending || 0) + (summary.projectStatus?.ongoing || 0) + (summary.projectStatus?.completed || 0)}
          </p>
        </div>
      </div>

      {/* Second Row: Revenue vs Expenses (3 columns) + Billing Status (1 column) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
        {/* Revenue vs Expenses Line Chart - 3 columns */}
        <div className="card lg:col-span-3 p-3 xs:p-4 sm:p-6">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
            <ChartBarIcon className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-gray-700 flex-shrink-0" />
            <h2 className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold truncate text-center sm:text-left">Revenue vs Expenses ({year === 'all' ? 'All Years' : year})</h2>
          </div>
          <div className="w-full overflow-x-auto chart-container" style={{ minHeight: '200px', height: 'clamp(200px, 40vw, 300px)' }}>
            <LineChart
              xAxis={[{
                scaleType: 'point',
                data: revenueVsExpensesData.map(item => item.project),
                label: 'Projects',
              }]}
              series={[
                {
                  data: revenueVsExpensesData.map(item => item.Revenue),
                  label: 'Revenue',
                  color: COLORS.success,
                },
                {
                  data: revenueVsExpensesData.map(item => item.Expenses),
                  label: 'Expenses',
                  color: COLORS.primary,
                },
              ]}
              width={undefined}
              height={250}
            />
          </div>
        </div>

        {/* Billing Status Pie Chart - 1 column (same width as Total Projects) */}
        <div className="card lg:col-span-1 p-3 xs:p-4 sm:p-6">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-4 flex-wrap">
            <DocumentTextIcon className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-gray-700 flex-shrink-0" />
            <h2 className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold truncate text-center sm:text-left">Billing Status ({year === 'all' ? 'All Years' : year})</h2>
          </div>
          {billingStatusData.length > 0 ? (
            <div className="w-full flex flex-col items-center">
              {/* Chart Container - Centered */}
              <div className="w-full flex justify-center items-center relative chart-container" style={{ minHeight: '180px', height: 'clamp(180px, 35vw, 250px)' }}>
                <div className="w-full h-full [&_.MuiChartsLegend-root]:hidden">
                  <PieChart
                    series={[{
                      data: billingStatusData,
                      innerRadius: 20,
                      outerRadius: 60,
                      paddingAngle: 2,
                      cornerRadius: 5,
                    }]}
                    width={undefined}
                    height={200}
                    slotProps={{
                      legend: {
                        hidden: true,
                      },
                    }}
                  />
                </div>
              </div>
              {/* Custom Legend - Centered Under Chart */}
              <div className="w-full mt-3 xs:mt-4 flex justify-center">
                <div className="flex flex-row items-center justify-center gap-3 xs:gap-4 sm:gap-6 flex-wrap">
                  {billingStatusData.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-1 xs:gap-2">
                      <div 
                        className="w-3 h-3 xs:w-4 xs:h-4 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <span className="text-xs xs:text-sm font-medium text-gray-700">{entry.label}</span>
                      <span className="text-[10px] xs:text-xs text-gray-500">
                        ({entry.value})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] xs:h-[250px] sm:h-[300px] text-gray-500 text-sm">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Third Row: Project Status (2 columns) + Payment Status (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 xs:gap-4 sm:gap-6">
        {/* Project Status Bar Chart - 2 columns (same width as Total Revenue + Total Expenses) */}
        <div className="card p-3 xs:p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center gap-2 xs:gap-3 mb-4">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-1 min-w-0">
              <BuildingOfficeIcon className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-gray-700 flex-shrink-0" />
              <h2 className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold truncate text-center sm:text-left">
                Project Status {projectStatusViewAll ? '(All Time)' : `(${year === 'all' ? 'All Years' : year})`}
              </h2>
            </div>
            <button
              onClick={() => setProjectStatusViewAll(!projectStatusViewAll)}
              className="flex items-center gap-1 text-xs xs:text-sm text-primary hover:text-primaryLight font-medium transition-colors duration-200 whitespace-nowrap"
            >
              <ArrowPathIcon className="w-3 h-3 xs:w-4 xs:h-4" />
              {projectStatusViewAll ? `View ${year === 'all' ? 'All Years' : year}` : 'View All'}
            </button>
          </div>
          {projectStatusDataWithColors.length > 0 ? (
            <div className="w-full overflow-x-auto chart-container" style={{ minHeight: '200px', height: 'clamp(200px, 40vw, 300px)' }}>
              <BarChart
                xAxis={[{
                  scaleType: 'band',
                  data: projectStatusDataWithColors.map(item => item.status),
                  categoryGapRatio: 0.3, // Balanced spacing for proper centering
                }]}
                series={projectStatusSeries}
                yAxis={[{
                  valueFormatter: (value) => value.toString(),
                }]}
                slotProps={{
                  bar: {
                    clipPath: 'inset(0px round 4px)',
                  },
                  tooltip: {
                    // Filter out series with value 0 to show only one data point
                    filter: (item) => item.value !== null && item.value !== undefined && item.value !== 0,
                  },
                }}
                width={undefined}
                height={250}
                layout="vertical"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] xs:h-[250px] sm:h-[300px] text-gray-500 text-sm">
              No data available
            </div>
          )}
        </div>

        {/* Payment Status Bar Chart - 2 columns (same width as Project Status) */}
        <div className="card p-3 xs:p-4 sm:p-6">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
            <BanknotesIcon className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-gray-700" />
            <h2 className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-center sm:text-left">Payment Status ({year === 'all' ? 'All Years' : year})</h2>
          </div>
          {paymentStatusData.length > 0 ? (
            <div className="w-full chart-container" style={{ minHeight: '200px', height: 'clamp(200px, 40vw, 300px)' }}>
              <BarChart
                xAxis={[{
                  scaleType: 'band',
                  data: paymentStatusData.map(item => item.status),
                  categoryGapRatio: 0.3, // Balanced spacing for proper centering
                }]}
                series={paymentStatusSeries}
                yAxis={[{
                  valueFormatter: (value) => formatCurrencyForChart(value),
                }]}
                slotProps={{
                  bar: {
                    clipPath: 'inset(0px round 4px)',
                  },
                  tooltip: {
                    // Filter out series with value 0 to show only one data point
                    filter: (item) => item.value !== null && item.value !== undefined && item.value !== 0,
                  },
                }}
                width={undefined}
                height={250}
                layout="vertical"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] xs:h-[250px] sm:h-[300px] text-gray-500 text-sm">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { PieChart } from '@mui/x-charts/PieChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import toast from 'react-hot-toast';
import {
  CurrencyDollarIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [projectStatusViewAll, setProjectStatusViewAll] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [year]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const params = projectStatusViewAll ? { viewAll: true } : { year };
      const response = await dashboardAPI.getSummary(params);
      setSummary(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [projectStatusViewAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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

  // Prepare data for Revenue vs Expenses Line Chart (by month)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueVsExpensesData = months.map((month, index) => {
    const revenueMonth = summary.revenueVsExpenses?.revenue?.find(r => r._id === index + 1);
    const expenseMonth = summary.revenueVsExpenses?.expenses?.find(e => e._id === index + 1);
    return {
      month,
      Revenue: revenueMonth?.total || 0,
      Expenses: expenseMonth?.total || 0,
    };
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
      color: COLORS.success
    },
    { 
      status: 'Unpaid', 
      amount: summary.paymentStatus?.unpaid?.totalAmount || 0,
      color: COLORS.warning
    },
    { 
      status: 'Uncollectible', 
      amount: summary.paymentStatus?.uncollectible?.totalAmount || 0,
      color: COLORS.danger
    },
  ].filter(item => item.amount > 0);
  
  // Prepare data for Project Status with colors
  const projectStatusDataWithColors = [
    { status: 'Pending', value: summary.projectStatus?.pending || 0, color: COLORS.warning },
    { status: 'Ongoing', value: summary.projectStatus?.ongoing || 0, color: COLORS.info },
    { status: 'Completed', value: summary.projectStatus?.completed || 0, color: COLORS.success },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <CalendarIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="input-field w-full sm:w-auto border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 focus:outline-none focus:border-red-600 transition-colors duration-200 text-sm sm:text-base"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards - 4 columns with icons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue Card */}
        <div className="card bg-gradient-to-br from-white to-green-50 border-l-4 border-green-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">
            ${(summary.totals?.revenue || 0).toLocaleString()}
          </p>
        </div>

        {/* Total Expenses Card */}
        <div className="card bg-gradient-to-br from-white to-red-50 border-l-4 border-red-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Expenses</h3>
            <div className="p-2 bg-red-100 rounded-lg">
              <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">
            ${(summary.totals?.expenses || 0).toLocaleString()}
          </p>
        </div>

        {/* Net Profit Card */}
        <div className={`card bg-gradient-to-br from-white ${((summary.totals?.revenue || 0) - (summary.totals?.expenses || 0)) >= 0 ? 'to-green-50 border-l-4 border-green-500' : 'to-red-50 border-l-4 border-red-500'} hover:shadow-lg transition-shadow duration-200`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Net Profit</h3>
            <div className={`p-2 rounded-lg ${((summary.totals?.revenue || 0) - (summary.totals?.expenses || 0)) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <ChartBarIcon className={`w-5 h-5 ${((summary.totals?.revenue || 0) - (summary.totals?.expenses || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${((summary.totals?.revenue || 0) - (summary.totals?.expenses || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${((summary.totals?.revenue || 0) - (summary.totals?.expenses || 0)).toLocaleString()}
          </p>
        </div>

        {/* Total Projects Card */}
        <div className="card bg-gradient-to-br from-white to-blue-50 border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Projects</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {(summary.projectStatus?.pending || 0) + (summary.projectStatus?.ongoing || 0) + (summary.projectStatus?.completed || 0)}
          </p>
        </div>
      </div>

      {/* Second Row: Revenue vs Expenses (3 columns) + Billing Status (1 column) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Revenue vs Expenses Line Chart - 3 columns */}
        <div className="card lg:col-span-3">
          <div className="flex items-center gap-2 mb-4">
            <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-semibold truncate">Revenue vs Expenses ({year})</h2>
          </div>
          <div className="w-full overflow-x-auto" style={{ minHeight: '250px', height: '300px' }}>
            <LineChart
              xAxis={[{
                scaleType: 'point',
                data: revenueVsExpensesData.map(item => item.month),
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
              height={300}
            />
          </div>
        </div>

        {/* Billing Status Pie Chart - 1 column (same width as Total Projects) */}
        <div className="card lg:col-span-1">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <DocumentTextIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-semibold truncate">Billing Status ({year})</h2>
          </div>
          {billingStatusData.length > 0 ? (
            <div className="w-full overflow-x-auto" style={{ minHeight: '250px', height: '300px' }}>
              <PieChart
                series={[{
                  data: billingStatusData,
                  innerRadius: 30,
                  outerRadius: 100,
                  paddingAngle: 2,
                  cornerRadius: 5,
                }]}
                width={undefined}
                height={300}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Third Row: Project Status (2 columns) + Payment Status (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Bar Chart - 2 columns (same width as Total Revenue + Total Expenses) */}
        <div className="card">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <BuildingOfficeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-semibold truncate">
                Project Status {projectStatusViewAll ? '(All Time)' : `(${year})`}
              </h2>
            </div>
            <button
              onClick={() => setProjectStatusViewAll(!projectStatusViewAll)}
              className="flex items-center gap-1 text-sm text-primary hover:text-primaryLight font-medium transition-colors duration-200 whitespace-nowrap"
            >
              <ArrowPathIcon className="w-4 h-4" />
              {projectStatusViewAll ? `View ${year}` : 'View All'}
            </button>
          </div>
          {projectStatusDataWithColors.length > 0 ? (
            <div className="w-full overflow-x-auto" style={{ minHeight: '250px', height: '300px' }}>
              <BarChart
                xAxis={[{
                  scaleType: 'band',
                  data: projectStatusDataWithColors.map(item => item.status),
                }]}
                series={[{
                  data: projectStatusDataWithColors.map(item => item.value),
                  color: COLORS.info,
                }]}
                width={undefined}
                height={300}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Payment Status Bar Chart - 2 columns (same width as Project Status) */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BanknotesIcon className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold">Payment Status ({year})</h2>
          </div>
          {paymentStatusData.length > 0 ? (
            <div className="w-full" style={{ height: '300px' }}>
              <BarChart
                xAxis={[{
                  scaleType: 'band',
                  data: paymentStatusData.map(item => item.status),
                }]}
                series={[{
                  data: paymentStatusData.map(item => item.amount),
                  color: COLORS.primary,
                  valueFormatter: (value) => `$${value.toLocaleString()}`,
                }]}
                yAxis={[{
                  valueFormatter: (value) => `$${value.toLocaleString()}`,
                }]}
                width={undefined}
                height={300}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import { useState, useEffect, useMemo } from 'react';
import { projectAPI, billingAPI, collectionAPI, exportAPI } from '../services/api';
import { formatCurrency } from '../utils/currency';
import {
  CalendarIcon,
  FunnelIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentArrowDownIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

const ProjectsBillingCollections = () => {
  const [projects, setProjects] = useState([]);
  const [allBillings, setAllBillings] = useState([]);
  const [allCollections, setAllCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter states
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({
    year: '',
    month: '',
    project: 'all',
  });
  
  // Dropdown focus states
  const [focusedDropdown, setFocusedDropdown] = useState(null);

  // Table states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(''); // 'billed', 'collected', 'outstanding'
  const [sortOrder, setSortOrder] = useState('desc');
  const [billingStatusFilter, setBillingStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);


  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [projectsRes, billingsRes, collectionsRes] = await Promise.all([
        projectAPI.getAll(),
        billingAPI.getAll(),
        collectionAPI.getAll(),
      ]);
      setProjects(projectsRes.data.projects || []);
      setAllBillings(billingsRes.data.billing || []);
      setAllCollections(collectionsRes.data.collections || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Get available years from projects
  const availableYears = useMemo(() => {
    const years = new Set();
    projects.forEach((project) => {
      const startYear = new Date(project.startDate).getFullYear();
      const endYear = new Date(project.endDate).getFullYear();
      for (let y = startYear; y <= endYear; y++) {
        years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [projects]);

  // Apply filters
  const handleApplyFilters = () => {
    setAppliedFilters({
      year: filterYear,
      month: filterMonth,
      project: selectedProject,
    });
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilterYear('');
    setFilterMonth('');
    setSelectedProject('all');
    setAppliedFilters({
      year: '',
      month: '',
      project: 'all',
    });
    setCurrentPage(1);
  };

  // Filter projects based on applied filters
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (appliedFilters.year) {
      const yearNum = parseInt(appliedFilters.year);
      filtered = filtered.filter((project) => {
        const startYear = new Date(project.startDate).getFullYear();
        const endYear = new Date(project.endDate).getFullYear();
        return startYear <= yearNum && endYear >= yearNum;
      });
    }

    if (appliedFilters.month && appliedFilters.year) {
      const monthNum = parseInt(appliedFilters.month);
      const yearNum = parseInt(appliedFilters.year);
      filtered = filtered.filter((project) => {
        const startDate = new Date(project.startDate);
        const endDate = new Date(project.endDate);
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();
        const startMonth = startDate.getMonth() + 1;
        const endMonth = endDate.getMonth() + 1;

        if (startYear === yearNum && startMonth > monthNum) return false;
        if (endYear === yearNum && endMonth < monthNum) return false;
        return true;
      });
    }

    if (appliedFilters.project !== 'all') {
      filtered = filtered.filter((p) => p._id === appliedFilters.project);
    }

    return filtered;
  }, [projects, appliedFilters]);

  // Prepare table data - combine billing and collection data
  const tableData = useMemo(() => {
    const data = [];

    filteredProjects.forEach((project) => {
      // Get billings for this project
      let projectBillings = allBillings.filter(
        (b) => b.projectId?._id === project._id || b.projectId === project._id
      );
      let projectCollections = allCollections.filter(
        (c) => c.projectId?._id === project._id || c.projectId === project._id
      );

      // Filter by year if applied
      if (appliedFilters.year) {
        const yearNum = parseInt(appliedFilters.year);
        projectBillings = projectBillings.filter((b) => {
          const billingYear = new Date(b.billingDate).getFullYear();
          return billingYear === yearNum;
        });
        projectCollections = projectCollections.filter((c) => {
          const collectionYear = new Date(c.collectionDate).getFullYear();
          return collectionYear === yearNum;
        });
      }

      // Filter by month if applied
      if (appliedFilters.month && appliedFilters.year) {
        const monthNum = parseInt(appliedFilters.month);
        projectBillings = projectBillings.filter((b) => {
          const billingDate = new Date(b.billingDate);
          return billingDate.getMonth() + 1 === monthNum;
        });
        projectCollections = projectCollections.filter((c) => {
          const collectionDate = new Date(c.collectionDate);
          return collectionDate.getMonth() + 1 === monthNum;
        });
      }

      // Calculate totals
      const totalBilled = projectBillings.reduce((sum, b) => sum + (b.totalAmount || b.amount || 0), 0);
      const totalCollected = projectCollections.reduce((sum, c) => sum + (c.amount || 0), 0);
      const outstanding = totalBilled - totalCollected;

      // Determine billing status (if any billing exists)
      let billingStatus = 'unbilled';
      if (projectBillings.length > 0) {
        const hasSent = projectBillings.some((b) => b.status === 'sent' || b.status === 'paid');
        billingStatus = hasSent ? 'billed' : 'draft';
      }

      // Determine payment status
      let paymentStatus = 'unpaid';
      if (totalCollected > 0) {
        if (totalCollected >= totalBilled) {
          paymentStatus = 'paid';
        } else if (totalCollected > 0) {
          paymentStatus = 'partial';
        }
      }

      // Get latest billing and collection for display
      const latestBilling = projectBillings.sort((a, b) => new Date(b.billingDate) - new Date(a.billingDate))[0];
      const latestCollection = projectCollections.sort((a, b) => new Date(b.collectionDate) - new Date(a.collectionDate))[0];

      // Get month and year for display
      const year = appliedFilters.year || new Date(project.startDate).getFullYear();
      const month = appliedFilters.month
        ? new Date(2000, parseInt(appliedFilters.month) - 1).toLocaleString('default', { month: 'long' })
        : 'All Months';

      data.push({
        projectId: project.projectCode || project._id,
        clientName: project.clientName || 'N/A',
        biNo: latestBilling?.invoiceNumber || 'N/A',
        billingStatus: billingStatus,
        billedAmount: totalBilled,
        paymentStatus: paymentStatus,
        checkNo: latestCollection?.checkNumber || 'N/A',
        amountCollected: totalCollected,
        outstandingBalance: outstanding,
        remarks: latestBilling?.notes || latestCollection?.notes || '',
        month: month,
        year: year,
        project: project,
        projectBillings: projectBillings,
        projectCollections: projectCollections,
      });
    });

    return data;
  }, [filteredProjects, allBillings, allCollections, appliedFilters]);

  // Filter and sort table data
  const filteredTableData = useMemo(() => {
    let data = [...tableData];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.projectId.toLowerCase().includes(query) ||
          item.clientName.toLowerCase().includes(query) ||
          item.biNo.toLowerCase().includes(query)
      );
    }

    // Status filters
    if (billingStatusFilter !== 'all') {
      data = data.filter((item) => item.billingStatus === billingStatusFilter);
    }

    if (paymentStatusFilter !== 'all') {
      data = data.filter((item) => item.paymentStatus === paymentStatusFilter);
    }

    // Sort
    if (sortBy) {
      data.sort((a, b) => {
        let aVal, bVal;
        if (sortBy === 'billed') {
          aVal = a.billedAmount;
          bVal = b.billedAmount;
        } else if (sortBy === 'collected') {
          aVal = a.amountCollected;
          bVal = b.amountCollected;
        } else if (sortBy === 'outstanding') {
          aVal = a.outstandingBalance;
          bVal = b.outstandingBalance;
        } else {
          return 0;
        }

        if (sortOrder === 'asc') {
          return aVal - bVal;
        } else {
          return bVal - aVal;
        }
      });
    }

    return data;
  }, [tableData, searchQuery, billingStatusFilter, paymentStatusFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredTableData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTableData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTableData, currentPage, itemsPerPage]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredTableData.reduce(
      (acc, item) => {
        acc.billed += item.billedAmount;
        acc.collected += item.amountCollected;
        acc.outstanding += item.outstandingBalance;
        return acc;
      },
      { billed: 0, collected: 0, outstanding: 0 }
    );
  }, [filteredTableData]);

  // Prepare chart data
  const billingStatusChartData = useMemo(() => {
    const billed = filteredTableData.filter((item) => item.billingStatus === 'billed').reduce((sum, item) => sum + item.billedAmount, 0);
    const unbilled = filteredTableData.filter((item) => item.billingStatus === 'unbilled' || item.billingStatus === 'draft').reduce((sum, item) => sum + item.billedAmount, 0);
    
    return [
      { name: 'Billed', value: billed },
      { name: 'Unbilled', value: unbilled },
    ].filter(item => item.value > 0);
  }, [filteredTableData]);

  const collectionStatusChartData = useMemo(() => {
    const paid = filteredTableData.filter((item) => item.paymentStatus === 'paid').reduce((sum, item) => sum + item.amountCollected, 0);
    const unpaid = filteredTableData.filter((item) => item.paymentStatus === 'unpaid').reduce((sum, item) => sum + item.outstandingBalance, 0);
    const uncollectible = filteredTableData.filter((item) => item.paymentStatus === 'uncollectible').reduce((sum, item) => sum + item.outstandingBalance, 0);
    
    return [
      { name: 'Paid', value: paid },
      { name: 'Unpaid', value: unpaid },
      { name: 'Uncollectible', value: uncollectible },
    ].filter(item => item.value > 0);
  }, [filteredTableData]);


  // Handle sort
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Export functions
  const handleExportCurrentFilter = async () => {
    try {
      setExporting(true);
      // Note: The export endpoint doesn't support filters yet, so we export all data
      // In a real implementation, you'd filter the data on the backend
      const response = await exportAPI.exportBillingCollections();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = appliedFilters.year
        ? `Billing_Collections_${appliedFilters.year}${appliedFilters.month ? `_${appliedFilters.month}` : ''}.xlsx`
        : `Billing_Collections_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export started');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleExportMonthlyReport = async () => {
    if (!appliedFilters.year || !appliedFilters.month) {
      toast.error('Please select both year and month first');
      return;
    }
    try {
      setExporting(true);
      const response = await exportAPI.exportBillingCollections();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Monthly_Billing_Report_${appliedFilters.year}_${appliedFilters.month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export started');
    } catch (error) {
      toast.error('Failed to export monthly report');
    } finally {
      setExporting(false);
    }
  };

  const handleExportAgingReport = async () => {
    if (!appliedFilters.year) {
      toast.error('Please select a year first');
      return;
    }
    try {
      setExporting(true);
      const response = await exportAPI.exportBillingCollections();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Collection_Aging_Report_${appliedFilters.year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export started');
    } catch (error) {
      toast.error('Failed to export aging report');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPerProject = async (projectId) => {
    try {
      setExporting(true);
      const response = await exportAPI.exportBillingCollections();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Project_Billing_Collection_${projectId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export started');
    } catch (error) {
      toast.error('Failed to export project report');
    } finally {
      setExporting(false);
    }
  };

  const COLORS = {
    billed: '#10B981',
    unbilled: '#F59E0B',
    paid: '#10B981',
    unpaid: '#EF4444',
    uncollectible: '#6B7280',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Billings & Collections</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCurrentFilter}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Export Current Filter
          </button>
          {appliedFilters.year && appliedFilters.month && (
            <button
              onClick={handleExportMonthlyReport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              Monthly Report
            </button>
          )}
          {appliedFilters.year && (
            <button
              onClick={handleExportAgingReport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              Aging Report
            </button>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="card p-6 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
            <div className="relative">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                onFocus={() => setFocusedDropdown('year')}
                onBlur={() => setFocusedDropdown(null)}
                className="w-full px-4 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer"
              >
                <option value="">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {focusedDropdown === 'year' ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
            <div className="relative">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                onFocus={() => setFocusedDropdown('month')}
                onBlur={() => setFocusedDropdown(null)}
                disabled={!filterYear}
                className="w-full px-4 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none cursor-pointer"
              >
                <option value="">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              {focusedDropdown === 'month' ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Project</label>
            <div className="relative">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                onFocus={() => setFocusedDropdown('project')}
                onBlur={() => setFocusedDropdown(null)}
                className="w-full px-4 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.projectName} ({project.projectCode})
                  </option>
                ))}
              </select>
              {focusedDropdown === 'project' ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              )}
            </div>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleApplyFilters}
              className="flex-1 bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Apply Filter
            </button>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Billed Amount</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <BanknotesIcon className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.billed)}</p>
          <div className="mt-2 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-500">Billed</span>
          </div>
        </div>
        <div className="card shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Collected Amount</h3>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.collected)}</p>
          <div className="mt-2 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-500">Collected</span>
          </div>
        </div>
        <div className="card shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Outstanding Balance</h3>
            <div className="p-2 bg-red-100 rounded-lg">
              <ClockIcon className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${totals.outstanding >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(totals.outstanding)}
          </p>
          <div className="mt-2 flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${totals.outstanding >= 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <span className="text-xs text-gray-500">Outstanding</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billing Status Pie Chart */}
        <div className="card shadow-md p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4">Billing Status</h2>
          {billingStatusChartData.length > 0 ? (
            <div className="w-full flex flex-col items-center">
              {/* Chart Container - Centered and Responsive */}
              <div className="w-full flex justify-center items-center py-4">
                <div className="w-full max-w-md mx-auto" style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={billingStatusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius="70%"
                        innerRadius="30%"
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {billingStatusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'Billed' ? COLORS.billed : COLORS.unbilled} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Legend - Centered Under Chart */}
              <div className="w-full mt-4 flex justify-center">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                  {billingStatusChartData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: entry.name === 'Billed' ? COLORS.billed : COLORS.unbilled }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                      <span className="text-xs text-gray-500">
                        ({formatCurrency(entry.value)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">No data available</div>
          )}
        </div>

        {/* Collection Status Bar Chart */}
        <div className="card shadow-md overflow-hidden">
          <h2 className="text-xl font-semibold mb-4">Collection Status</h2>
          {collectionStatusChartData.length > 0 ? (
            <div className="w-full" style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height={300} minHeight={250}>
                <BarChart data={collectionStatusChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                  />
                  <Bar dataKey="value">
                    {collectionStatusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Paid' ? COLORS.paid : entry.name === 'Unpaid' ? COLORS.unpaid : COLORS.uncollectible} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">No data available</div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Project Billing & Collection Breakdown</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Project ID, Client, or BI No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 w-full sm:w-64"
              />
            </div>
            <select
              value={billingStatusFilter}
              onChange={(e) => setBillingStatusFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
            >
              <option value="all">All Billing Status</option>
              <option value="billed">Billed</option>
              <option value="unbilled">Unbilled</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
            >
              <option value="all">All Payment Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Project ID</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Client Name</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">BI No.</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Billing Status</th>
                <th
                  className="border border-gray-300 px-4 py-3 text-left font-semibold cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('billed')}
                >
                  <div className="flex items-center gap-1">
                    Billed Amount
                    {sortBy === 'billed' && (
                      sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Payment Status</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Check No.</th>
                <th
                  className="border border-gray-300 px-4 py-3 text-left font-semibold cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('collected')}
                >
                  <div className="flex items-center gap-1">
                    Amount Collected
                    {sortBy === 'collected' && (
                      sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th
                  className="border border-gray-300 px-4 py-3 text-left font-semibold cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('outstanding')}
                >
                  <div className="flex items-center gap-1">
                    Outstanding Balance
                    {sortBy === 'outstanding' && (
                      sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Remarks</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Month</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Year</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="13" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                    No data found
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="border border-gray-300 px-4 py-3">{item.projectId}</td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">{item.clientName}</td>
                    <td className="border border-gray-300 px-4 py-3">{item.biNo}</td>
                    <td className="border border-gray-300 px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.billingStatus === 'billed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.billingStatus}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-blue-600 font-semibold">
                      {formatCurrency(item.billedAmount)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : item.paymentStatus === 'partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.paymentStatus}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3">{item.checkNo}</td>
                    <td className="border border-gray-300 px-4 py-3 text-green-600 font-semibold">
                      {formatCurrency(item.amountCollected)}
                    </td>
                    <td
                      className={`border border-gray-300 px-4 py-3 font-semibold ${
                        item.outstandingBalance >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {formatCurrency(item.outstandingBalance)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">{item.remarks || '-'}</td>
                    <td className="border border-gray-300 px-4 py-3">{item.month}</td>
                    <td className="border border-gray-300 px-4 py-3">{item.year}</td>
                    <td className="border border-gray-300 px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportPerProject(item.project._id);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Export Project Report"
                      >
                        <DocumentArrowDownIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTableData.length)} of {filteredTableData.length} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ProjectsBillingCollections;

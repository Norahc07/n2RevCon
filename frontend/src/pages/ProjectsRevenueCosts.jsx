import { useState, useEffect, useMemo } from 'react';
import { projectAPI, revenueAPI, expenseAPI, exportAPI } from '../services/api';
import { formatCurrency } from '../utils/currency';
import {
  CalendarIcon,
  FunnelIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import {
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

const ProjectsRevenueCosts = () => {
  const [projects, setProjects] = useState([]);
  const [allRevenues, setAllRevenues] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
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
  const [sortBy, setSortBy] = useState(''); // 'revenue', 'expenses', 'net'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Chart view state
  const [chartView, setChartView] = useState('project'); // 'project' or 'month'

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [projectsRes, revenuesRes, expensesRes] = await Promise.all([
        projectAPI.getAll(),
        revenueAPI.getAll(),
        expenseAPI.getAll(),
      ]);
      setProjects(projectsRes.data.projects || []);
      setAllRevenues(revenuesRes.data.revenue || []);
      setAllExpenses(expensesRes.data.expenses || []);
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
    setCurrentPage(1); // Reset to first page when filters reset
  };

  // Filter projects based on applied filters
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filter by year
    if (appliedFilters.year) {
      const yearNum = parseInt(appliedFilters.year);
      filtered = filtered.filter((project) => {
        const startYear = new Date(project.startDate).getFullYear();
        const endYear = new Date(project.endDate).getFullYear();
        return startYear <= yearNum && endYear >= yearNum;
      });
    }

    // Filter by month
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

    // Filter by project
    if (appliedFilters.project !== 'all') {
      filtered = filtered.filter((p) => p._id === appliedFilters.project);
    }

    return filtered;
  }, [projects, appliedFilters]);

  // Calculate financial data for each project
  const projectFinancialData = useMemo(() => {
    return filteredProjects.map((project) => {
      // Filter revenues and expenses for this project
      let projectRevenues = allRevenues.filter((r) => r.projectId?._id === project._id || r.projectId === project._id);
      let projectExpenses = allExpenses.filter((e) => e.projectId?._id === project._id || e.projectId === project._id);

      // Filter by year if applied
      if (appliedFilters.year) {
        const yearNum = parseInt(appliedFilters.year);
        projectRevenues = projectRevenues.filter((r) => {
          const revenueYear = new Date(r.date).getFullYear();
          return revenueYear === yearNum;
        });
        projectExpenses = projectExpenses.filter((e) => {
          const expenseYear = new Date(e.date).getFullYear();
          return expenseYear === yearNum;
        });
      }

      // Filter by month if applied
      if (appliedFilters.month && appliedFilters.year) {
        const monthNum = parseInt(appliedFilters.month);
        projectRevenues = projectRevenues.filter((r) => {
          const revenueDate = new Date(r.date);
          return revenueDate.getMonth() + 1 === monthNum;
        });
        projectExpenses = projectExpenses.filter((e) => {
          const expenseDate = new Date(e.date);
          return expenseDate.getMonth() + 1 === monthNum;
        });
      }

      const totalRevenue = projectRevenues.reduce((sum, r) => sum + (r.amount || 0), 0);
      const totalExpenses = projectExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const netIncome = totalRevenue - totalExpenses;

      // Get year and month for display
      const year = appliedFilters.year || new Date(project.startDate).getFullYear();
      const month = appliedFilters.month
        ? new Date(2000, parseInt(appliedFilters.month) - 1).toLocaleString('default', { month: 'long' })
        : 'All Months';

      return {
        projectId: project.projectCode || project._id,
        projectName: project.projectName,
        clientName: project.clientName || 'N/A',
        year,
        month,
        totalRevenue,
        totalExpenses,
        netIncome,
        status: project.status,
        project: project,
      };
    });
  }, [filteredProjects, allRevenues, allExpenses, appliedFilters]);

  // Filter and sort table data
  const tableData = useMemo(() => {
    let data = [...projectFinancialData];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.projectId.toLowerCase().includes(query) ||
          item.projectName.toLowerCase().includes(query) ||
          item.clientName.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      data = data.filter((item) => item.status === statusFilter);
    }

    // Sort
    if (sortBy) {
      data.sort((a, b) => {
        let aVal, bVal;
        if (sortBy === 'revenue') {
          aVal = a.totalRevenue;
          bVal = b.totalRevenue;
        } else if (sortBy === 'expenses') {
          aVal = a.totalExpenses;
          bVal = b.totalExpenses;
        } else if (sortBy === 'net') {
          aVal = a.netIncome;
          bVal = b.netIncome;
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
  }, [projectFinancialData, searchQuery, statusFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return tableData.slice(startIndex, startIndex + itemsPerPage);
  }, [tableData, currentPage, itemsPerPage]);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    return tableData.reduce(
      (acc, item) => {
        acc.revenue += item.totalRevenue;
        acc.expenses += item.totalExpenses;
        acc.net += item.netIncome;
        return acc;
      },
      { revenue: 0, expenses: 0, net: 0 }
    );
  }, [tableData]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (chartView === 'project') {
      // Group by project
      return tableData.map((item) => ({
        name: item.projectName.length > 15 ? item.projectName.substring(0, 15) + '...' : item.projectName,
        Revenue: item.totalRevenue,
        Expenses: item.totalExpenses,
      }));
    } else {
      // Group by month
      const monthMap = {};
      tableData.forEach((item) => {
        const month = item.month;
        if (!monthMap[month]) {
          monthMap[month] = { Revenue: 0, Expenses: 0 };
        }
        monthMap[month].Revenue += item.totalRevenue;
        monthMap[month].Expenses += item.totalExpenses;
      });
      return Object.entries(monthMap).map(([month, data]) => ({
        name: month,
        ...data,
      }));
    }
  }, [tableData, chartView]);


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
  const handleExportCurrentView = async () => {
    try {
      setExporting(true);
      const params = {};
      
      // Convert year/month to startDate/endDate
      if (appliedFilters.year) {
        const yearNum = parseInt(appliedFilters.year);
        if (appliedFilters.month) {
          const monthNum = parseInt(appliedFilters.month);
          params.startDate = new Date(yearNum, monthNum - 1, 1).toISOString();
          params.endDate = new Date(yearNum, monthNum, 0, 23, 59, 59).toISOString();
        } else {
          params.startDate = new Date(yearNum, 0, 1).toISOString();
          params.endDate = new Date(yearNum, 11, 31, 23, 59, 59).toISOString();
        }
      }
      
      const response = await exportAPI.exportRevenueCosts(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Revenue_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  const handleExportAllForYear = async () => {
    if (!appliedFilters.year) {
      toast.error('Please select a year first');
      return;
    }
    try {
      setExporting(true);
      const yearNum = parseInt(appliedFilters.year);
      const params = {
        startDate: new Date(yearNum, 0, 1).toISOString(),
        endDate: new Date(yearNum, 11, 31, 23, 59, 59).toISOString(),
      };
      const response = await exportAPI.exportRevenueCosts(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Revenue_Expenses_${appliedFilters.year}.xlsx`);
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

  const handleExportSingleProject = async (projectId) => {
    try {
      setExporting(true);
      const response = await exportAPI.exportProject(projectId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Project_Financial_Report_${projectId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export started');
    } catch (error) {
      toast.error('Failed to export project');
    } finally {
      setExporting(false);
    }
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Revenue vs. Expenses</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportCurrentView}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Export Current View
          </button>
          {appliedFilters.year && (
            <button
              onClick={handleExportAllForYear}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Export All {appliedFilters.year}
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Year
            </label>
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Month
            </label>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.revenue)}</p>
        </div>
        <div className="card shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.expenses)}</p>
        </div>
        <div className="card shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Net Income</h3>
          <p className={`text-2xl font-bold ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totals.net)}
          </p>
        </div>
      </div>

      {/* Analytics Section - Bar Chart */}
      <div className="card shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Analytics</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChartView('project')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                chartView === 'project'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Per Project
            </button>
            <button
              onClick={() => setChartView('month')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                chartView === 'month'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Per Month
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="Revenue" fill="#EF4444" />
            <Bar dataKey="Expenses" fill="#374151" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Project Financial Table */}
      <div className="card shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Project Revenue & Cost Breakdown</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Project ID or Client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 w-full sm:w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Project ID</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Project Name</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Year</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Month</th>
                <th
                  className="border border-gray-300 px-4 py-3 text-left font-semibold cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('revenue')}
                >
                  <div className="flex items-center gap-1">
                    Total Revenue
                    {sortBy === 'revenue' && (
                      sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th
                  className="border border-gray-300 px-4 py-3 text-left font-semibold cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('expenses')}
                >
                  <div className="flex items-center gap-1">
                    Total Expenses
                    {sortBy === 'expenses' && (
                      sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th
                  className="border border-gray-300 px-4 py-3 text-left font-semibold cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('net')}
                >
                  <div className="flex items-center gap-1">
                    Net Income
                    {sortBy === 'net' && (
                      sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Status</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                    No projects found
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="border border-gray-300 px-4 py-3">{item.projectId}</td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">{item.projectName}</td>
                    <td className="border border-gray-300 px-4 py-3">{item.year}</td>
                    <td className="border border-gray-300 px-4 py-3">{item.month}</td>
                    <td className="border border-gray-300 px-4 py-3 text-green-600 font-semibold">
                      {formatCurrency(item.totalRevenue)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-red-600 font-semibold">
                      {formatCurrency(item.totalExpenses)}
                    </td>
                    <td
                      className={`border border-gray-300 px-4 py-3 font-semibold ${
                        item.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(item.netIncome)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'ongoing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportSingleProject(item.project._id);
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
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, tableData.length)} of {tableData.length} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default ProjectsRevenueCosts;

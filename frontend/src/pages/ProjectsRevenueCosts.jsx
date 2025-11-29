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
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ProjectsRevenueCosts = () => {
  const navigate = useNavigate();
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Edit modal states
  const [editingProject, setEditingProject] = useState(null);
  const [editingRevenue, setEditingRevenue] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

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
  }, [projectFinancialData, searchQuery, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return tableData.slice(startIndex, startIndex + itemsPerPage);
  }, [tableData, currentPage, itemsPerPage]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  // Handle edit project - open modal with revenue/expense records
  const handleEditProject = (project, e) => {
    e.stopPropagation();
    setEditingProject(project);
    setShowEditModal(true);
  };

  // Get revenue and expense records for editing project
  const projectRevenues = useMemo(() => {
    if (!editingProject) return [];
    return allRevenues.filter((r) => {
      const projectId = r.projectId?._id || r.projectId;
      return projectId === editingProject._id;
    });
  }, [allRevenues, editingProject]);

  const projectExpenses = useMemo(() => {
    if (!editingProject) return [];
    return allExpenses.filter((e) => {
      const projectId = e.projectId?._id || e.projectId;
      return projectId === editingProject._id;
    });
  }, [allExpenses, editingProject]);

  // Handle edit revenue
  const handleEditRevenue = (revenue) => {
    setEditingRevenue({
      ...revenue,
      date: revenue.date ? new Date(revenue.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
  };

  // Handle edit expense
  const handleEditExpense = (expense) => {
    setEditingExpense({
      ...expense,
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
  };

  // Handle update revenue
  const handleUpdateRevenue = async (e) => {
    e.preventDefault();
    try {
      await revenueAPI.update(editingRevenue._id, {
        revenueCode: editingRevenue.revenueCode,
        description: editingRevenue.description,
        amount: parseFloat(editingRevenue.amount),
        date: editingRevenue.date,
        category: editingRevenue.category,
        status: editingRevenue.status,
        notes: editingRevenue.notes || undefined,
      });
      toast.success('Revenue record updated');
      setEditingRevenue(null);
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update revenue record');
    }
  };

  // Handle update expense
  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    try {
      await expenseAPI.update(editingExpense._id, {
        expenseCode: editingExpense.expenseCode,
        description: editingExpense.description,
        amount: parseFloat(editingExpense.amount),
        date: editingExpense.date,
        category: editingExpense.category,
        status: editingExpense.status,
        notes: editingExpense.notes || undefined,
      });
      toast.success('Expense record updated');
      setEditingExpense(null);
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update expense record');
    }
  };

  // Handle delete revenue
  const handleDeleteRevenue = async (revenueId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this revenue record?')) {
      return;
    }
    try {
      await revenueAPI.delete(revenueId);
      toast.success('Revenue record deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete revenue record');
    }
  };

  // Handle delete expense
  const handleDeleteExpense = async (expenseId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this expense record?')) {
      return;
    }
    try {
      await expenseAPI.delete(expenseId);
      toast.success('Expense record deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete expense record');
    }
  };

  // Handle delete project
  const handleDelete = async (projectId, projectName, e) => {
    e.stopPropagation();
    const confirmMessage = `Are you sure you want to delete "${projectName}"?\n\nThis project will be moved to "Recently Deleted" and can be restored within 30 days. After 30 days, it will be permanently deleted.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await projectAPI.delete(projectId);
      toast.success('Project moved to Recently Deleted. It will be permanently deleted after 30 days.');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete project');
      console.error('Delete error:', error);
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
      </div>

      {/* Filter Section */}
      <div className="card p-4 shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <FunnelIcon className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Year
            </label>
            <div className="relative">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                onFocus={() => setFocusedDropdown('year')}
                onBlur={() => setFocusedDropdown(null)}
                className="w-full px-3 pr-8 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer bg-white"
              >
                <option value="">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {focusedDropdown === 'year' ? (
                <ChevronUpIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Month
            </label>
            <div className="relative">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                onFocus={() => setFocusedDropdown('month')}
                onBlur={() => setFocusedDropdown(null)}
                disabled={!filterYear}
                className="w-full px-3 pr-8 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none cursor-pointer bg-white"
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
                <ChevronUpIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Project</label>
            <div className="relative">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                onFocus={() => setFocusedDropdown('project')}
                onBlur={() => setFocusedDropdown(null)}
                className="w-full px-3 pr-8 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer bg-white"
              >
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.projectName} ({project.projectCode})
                  </option>
                ))}
              </select>
              {focusedDropdown === 'project' ? (
                <ChevronUpIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              )}
            </div>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
            <button
              onClick={handleApplyFilters}
              className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-4 py-2 text-sm rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg h-[38px] flex items-center justify-center"
            >
              Apply Filter
            </button>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
            <button
              onClick={handleExportCurrentView}
              disabled={exporting || tableData.length === 0}
              className="w-full items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex h-[38px]"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span className="hidden sm:inline">Exporting...</span>
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Export to Excel</span>
                  <span className="sm:hidden">Export</span>
                </>
              )}
            </button>
            <button
              onClick={handleResetFilters}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors h-[38px]"
              title="Reset Filters"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
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

      {/* Project Financial Table */}
      <div className="card shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Project Revenue & Cost Breakdown</h2>
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
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
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
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleEditProject(item.project, e)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(item.project._id, item.projectName, e)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
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

      {/* Edit Project Modal - Shows Revenue & Expense Records */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Records - {editingProject.projectName}</h2>
              <button onClick={() => {
                setShowEditModal(false);
                setEditingProject(null);
                setEditingRevenue(null);
                setEditingExpense(null);
              }} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Revenue Records Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-green-600">Revenue Records</h3>
              {projectRevenues.length === 0 ? (
                <p className="text-gray-500 text-sm">No revenue records found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Code</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Description</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Amount</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Date</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectRevenues.map((rev) => (
                        <tr key={rev._id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2 text-sm">{rev.revenueCode}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{rev.description}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm font-semibold text-green-600">{formatCurrency(rev.amount)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{new Date(rev.date).toLocaleDateString()}</td>
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditRevenue(rev)}
                                className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteRevenue(rev._id, e)}
                                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Expense Records Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-600">Expense Records</h3>
              {projectExpenses.length === 0 ? (
                <p className="text-gray-500 text-sm">No expense records found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Code</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Description</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Amount</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Date</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectExpenses.map((exp) => (
                        <tr key={exp._id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2 text-sm">{exp.expenseCode}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{exp.description}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm font-semibold text-red-600">{formatCurrency(exp.amount)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{new Date(exp.date).toLocaleDateString()}</td>
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditExpense(exp)}
                                className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteExpense(exp._id, e)}
                                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Revenue Modal - Same structure as Add Revenue Modal */}
      {editingRevenue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Revenue Record</h2>
              <button onClick={() => setEditingRevenue(null)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateRevenue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Revenue Code *</label>
                <input
                  type="text"
                  value={editingRevenue.revenueCode || ''}
                  onChange={(e) => setEditingRevenue({ ...editingRevenue, revenueCode: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <input
                  type="text"
                  value={editingRevenue.description || ''}
                  onChange={(e) => setEditingRevenue({ ...editingRevenue, description: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingRevenue.amount || ''}
                  onChange={(e) => setEditingRevenue({ ...editingRevenue, amount: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  value={editingRevenue.date || ''}
                  onChange={(e) => setEditingRevenue({ ...editingRevenue, date: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={editingRevenue.category || 'service'}
                  onChange={(e) => setEditingRevenue({ ...editingRevenue, category: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                >
                  <option value="service">Service</option>
                  <option value="product">Product</option>
                  <option value="consultation">Consultation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editingRevenue.status || 'recorded'}
                  onChange={(e) => setEditingRevenue({ ...editingRevenue, status: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                >
                  <option value="recorded">Recorded</option>
                  <option value="confirmed">Confirmed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={editingRevenue.notes || ''}
                  onChange={(e) => setEditingRevenue({ ...editingRevenue, notes: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  rows="3"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold">
                  Update Revenue
                </button>
                <button type="button" onClick={() => setEditingRevenue(null)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal - Same structure as Add Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Expense Record</h2>
              <button onClick={() => setEditingExpense(null)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Expense Code *</label>
                <input
                  type="text"
                  value={editingExpense.expenseCode || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, expenseCode: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <input
                  type="text"
                  value={editingExpense.description || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingExpense.amount || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  value={editingExpense.date || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={editingExpense.category || 'other'}
                  onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                >
                  <option value="labor">Labor</option>
                  <option value="materials">Materials</option>
                  <option value="equipment">Equipment</option>
                  <option value="travel">Travel</option>
                  <option value="overhead">Overhead</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editingExpense.status || 'pending'}
                  onChange={(e) => setEditingExpense({ ...editingExpense, status: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={editingExpense.notes || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, notes: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  rows="3"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold">
                  Update Expense
                </button>
                <button type="button" onClick={() => setEditingExpense(null)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsRevenueCosts;

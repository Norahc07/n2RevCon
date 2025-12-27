import { useState, useEffect, useMemo } from 'react';
import { projectAPI, revenueAPI, expenseAPI, exportAPI } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { usePermissions } from '../hooks/usePermissions';
import PermissionWrapper from '../components/PermissionWrapper';
import { ACTIONS, ROLES } from '../config/permissions';
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
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PlusIcon,
  CurrencyDollarIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { TableSkeleton, FilterSkeleton, CardSkeleton } from '../components/skeletons';

const ProjectsRevenueCosts = () => {
  const navigate = useNavigate();
  const { canAccessRevenue, canAccessExpenses, canViewReports, canDeleteProject, role } = usePermissions();
  // Only Master Admin and System Admin can edit projects
  const canCreateEditProject = role === 'master_admin' || role === 'system_admin';
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
  const [generalSearchQuery, setGeneralSearchQuery] = useState(''); // Search for general expenses/revenues
  const [sortBy, setSortBy] = useState(''); // 'revenue', 'expenses', 'net'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('projects'); // 'projects' or 'general'
  
  // Projects tab filter visibility
  const [showProjectsFilters, setShowProjectsFilters] = useState(false);
  
  // General tab filter states
  const [generalFilters, setGeneralFilters] = useState({
    type: 'all', // 'all', 'revenue', 'expense'
    revenueCategory: '',
    expenseCategory: '',
    revenueStatus: '',
    expenseStatus: '',
    dateFrom: '',
    dateTo: '',
  });
  const [showGeneralFilters, setShowGeneralFilters] = useState(false);
  
  // General tab table view states
  const [showAllRevenues, setShowAllRevenues] = useState(false);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const GENERAL_TABLE_LIMIT = 10;

  // Edit modal states
  const [editingProject, setEditingProject] = useState(null);
  const [editingRevenue, setEditingRevenue] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Add modal states
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showAddRevenueModal, setShowAddRevenueModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newRevenue, setNewRevenue] = useState({
    projectId: '',
    revenueCode: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'service',
    status: 'recorded',
    notes: '',
  });
  const [newExpense, setNewExpense] = useState({
    projectId: '',
    expenseCode: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'other',
    status: 'pending',
    notes: '',
  });

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

  // Get available years from projects (exclude 2026 and beyond)
  const availableYears = useMemo(() => {
    const years = new Set();
    projects.forEach((project) => {
      const startYear = new Date(project.startDate).getFullYear();
      const endYear = new Date(project.endDate).getFullYear();
      const minYear = Math.min(startYear, endYear);
      const maxYear = Math.min(Math.max(startYear, endYear), 2025); // Cap at 2025
      for (let y = minYear; y <= maxYear; y++) {
        if (y <= 2025) {
          years.add(y);
        }
      }
    });
    return Array.from(years).filter(y => y <= 2025).sort((a, b) => b - a);
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

  // Pagination logic
  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = useMemo(() => {
    return tableData.slice(startIndex, endIndex);
  }, [tableData, startIndex, endIndex]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, appliedFilters]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const handleExportGeneralView = async () => {
    try {
      setExporting(true);
      const params = {
        generalOnly: true, // Flag to indicate we want general expenses/revenues only
      };
      
      // Add date range if specified
      if (generalFilters.dateFrom) {
        params.startDate = new Date(generalFilters.dateFrom).toISOString();
      }
      if (generalFilters.dateTo) {
        const endDate = new Date(generalFilters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        params.endDate = endDate.toISOString();
      }
      
      // For now, we'll export all general expenses/revenues
      // The backend can filter based on the generalOnly flag
      const response = await exportAPI.exportRevenueCosts(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `General_Expenses_Revenue_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  // General expenses (expenses without a project) - filtered by search and filters
  const generalExpenses = useMemo(() => {
    let filtered = allExpenses.filter((e) => {
      const projectId = e.projectId?._id || e.projectId;
      return !projectId || projectId === null;
    });
    
    // Apply search filter
    if (generalSearchQuery) {
      const query = generalSearchQuery.toLowerCase();
      filtered = filtered.filter((e) => {
        return (
          e.expenseCode?.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query)
        );
      });
    }
    
    // Apply category filter
    if (generalFilters.expenseCategory) {
      filtered = filtered.filter((e) => e.category === generalFilters.expenseCategory);
    }
    
    // Apply status filter
    if (generalFilters.expenseStatus) {
      filtered = filtered.filter((e) => e.status === generalFilters.expenseStatus);
    }
    
    // Apply date range filter
    if (generalFilters.dateFrom) {
      filtered = filtered.filter((e) => {
        const expenseDate = new Date(e.date);
        return expenseDate >= new Date(generalFilters.dateFrom);
      });
    }
    if (generalFilters.dateTo) {
      filtered = filtered.filter((e) => {
        const expenseDate = new Date(e.date);
        expenseDate.setHours(23, 59, 59, 999); // Include the entire end date
        return expenseDate <= new Date(generalFilters.dateTo);
      });
    }
    
    return filtered;
  }, [allExpenses, generalSearchQuery, generalFilters]);

  // General revenues (revenues without a project) - filtered by search and filters
  const generalRevenues = useMemo(() => {
    let filtered = allRevenues.filter((r) => {
      const projectId = r.projectId?._id || r.projectId;
      return !projectId || projectId === null;
    });
    
    // Apply search filter
    if (generalSearchQuery) {
      const query = generalSearchQuery.toLowerCase();
      filtered = filtered.filter((r) => {
        return (
          r.revenueCode?.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query)
        );
      });
    }
    
    // Apply category filter
    if (generalFilters.revenueCategory) {
      filtered = filtered.filter((r) => r.category === generalFilters.revenueCategory);
    }
    
    // Apply status filter
    if (generalFilters.revenueStatus) {
      filtered = filtered.filter((r) => r.status === generalFilters.revenueStatus);
    }
    
    // Apply date range filter
    if (generalFilters.dateFrom) {
      filtered = filtered.filter((r) => {
        const revenueDate = new Date(r.date);
        return revenueDate >= new Date(generalFilters.dateFrom);
      });
    }
    if (generalFilters.dateTo) {
      filtered = filtered.filter((r) => {
        const revenueDate = new Date(r.date);
        revenueDate.setHours(23, 59, 59, 999); // Include the entire end date
        return revenueDate <= new Date(generalFilters.dateTo);
      });
    }
    
    return filtered;
  }, [allRevenues, generalSearchQuery, generalFilters]);

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
        projectId: editingRevenue.projectId || null, // Allow null for general revenues
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
        projectId: editingExpense.projectId || null, // Allow null for general expenses
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

  // Handle add general expense to project
  const handleAddExpenseToProject = async (expenseId, projectId) => {
    try {
      await expenseAPI.update(expenseId, {
        projectId: projectId,
      });
      toast.success('Expense added to project successfully');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to add expense to project');
    }
  };

  // Handle add general revenue to project
  const handleAddRevenueToProject = async (revenueId, projectId) => {
    try {
      await revenueAPI.update(revenueId, {
        projectId: projectId,
      });
      toast.success('Revenue added to project successfully');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to add revenue to project');
    }
  };

  // Handle add revenue
  const handleAddRevenue = async (e) => {
    e.preventDefault();
    try {
      await revenueAPI.create({
        projectId: newRevenue.projectId || null, // Allow null for general revenues
        revenueCode: newRevenue.revenueCode,
        description: newRevenue.description,
        amount: parseFloat(newRevenue.amount),
        date: newRevenue.date,
        category: newRevenue.category,
        status: newRevenue.status,
        notes: newRevenue.notes || undefined,
      });
      toast.success('Revenue record added successfully');
      setShowAddRevenueModal(false);
      setNewRevenue({
        projectId: '',
        revenueCode: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'service',
        status: 'recorded',
        notes: '',
      });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to add revenue record');
    }
  };

  // Handle add expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await expenseAPI.create({
        projectId: newExpense.projectId || null, // Allow null for general expenses
        expenseCode: newExpense.expenseCode,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        date: newExpense.date,
        category: newExpense.category,
        status: newExpense.status,
        notes: newExpense.notes || undefined,
      });
      toast.success('Expense record added successfully');
      setShowAddExpenseModal(false);
      setNewExpense({
        projectId: '',
        expenseCode: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'other',
        status: 'pending',
        notes: '',
      });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to add expense record');
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
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="h-9 w-64 bg-gray-200 rounded animate-pulse"></div>
        
        {/* Filter Skeleton */}
        <FilterSkeleton />
        
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton count={3} />
        </div>
        
        {/* Table Skeleton */}
        <div className="card p-6 shadow-md">
          <TableSkeleton rows={10} columns={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Revenue vs. Expenses</h1>
        {/* Add Button - Role-specific behavior */}
        {role === ROLES.REVENUE_OFFICER && canAccessRevenue && (
          <button
            onClick={() => setShowAddRevenueModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Add Revenue</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
        {role === ROLES.DISBURSING_OFFICER && canAccessExpenses && (
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
        {/* Master Admin and users with both permissions see type selection modal */}
        {(role === ROLES.MASTER_ADMIN || (canAccessRevenue && canAccessExpenses)) && (
          <button
            onClick={() => setShowAddTypeModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Add Revenue/Expense</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
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

      {/* Project Financial Table / General Expenses & Revenue View */}
      <div className="card shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {viewMode === 'projects' ? 'Project Revenue & Expenses Breakdown' : 'General Expenses/Revenue (Not Tied to Projects)'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex gap-2 border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('projects')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'projects'
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Projects
              </button>
              <button
                onClick={() => setViewMode('general')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'general'
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                General
              </button>
            </div>
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
                placeholder={viewMode === 'projects' ? "Search by Project ID or Client..." : "Search by Code or Description..."}
                value={viewMode === 'projects' ? searchQuery : generalSearchQuery}
                onChange={(e) => viewMode === 'projects' ? setSearchQuery(e.target.value) : setGeneralSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 w-full sm:w-64"
            />
            </div>
          </div>
        </div>

        {/* Projects Tab Filters */}
        {viewMode === 'projects' && (
          <div className="mb-4 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-800">Filters</h3>
                <button
                  onClick={() => setShowProjectsFilters(!showProjectsFilters)}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  {showProjectsFilters ? 'Hide' : 'Show'} Filters
                </button>
        </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCurrentView}
                  disabled={exporting || tableData.length === 0}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed h-[38px]"
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
                {(appliedFilters.year || appliedFilters.month || appliedFilters.project !== 'all') && (
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors h-[38px]"
                    title="Reset Filters"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>
            </div>
            {showProjectsFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
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
                <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-4 py-2 text-sm rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg h-[38px] flex items-center justify-center"
            >
              Apply Filter
            </button>
          </div>
              </div>
            )}
          </div>
        )}

        {/* General Tab Filters */}
        {viewMode === 'general' && (
          <div className="mb-4 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-5 h-5 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-800">Filters</h3>
            <button
                  onClick={() => setShowGeneralFilters(!showGeneralFilters)}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  {showGeneralFilters ? 'Hide' : 'Show'} Filters
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportGeneralView}
                  disabled={exporting || (generalRevenues.length === 0 && generalExpenses.length === 0)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed h-[38px]"
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
                {(generalFilters.type !== 'all' || 
                  generalFilters.revenueCategory || 
                  generalFilters.expenseCategory || 
                  generalFilters.revenueStatus || 
                  generalFilters.expenseStatus || 
                  generalFilters.dateFrom || 
                  generalFilters.dateTo) && (
            <button
                    onClick={() => {
                      setGeneralFilters({
                        type: 'all',
                        revenueCategory: '',
                        expenseCategory: '',
                        revenueStatus: '',
                        expenseStatus: '',
                        dateFrom: '',
                        dateTo: '',
                      });
                    }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors h-[38px]"
              title="Reset Filters"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
                )}
          </div>
        </div>
            {showGeneralFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type</label>
                  <div className="relative">
                    <select
                      value={generalFilters.type}
                      onChange={(e) => setGeneralFilters({ ...generalFilters, type: e.target.value })}
                      onFocus={() => setFocusedDropdown('generalType')}
                      onBlur={() => setFocusedDropdown(null)}
                      className="w-full px-3 pr-8 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer bg-white"
                    >
                      <option value="all">All (Revenue & Expense)</option>
                      <option value="revenue">Revenue Only</option>
                      <option value="expense">Expense Only</option>
                    </select>
                    {focusedDropdown === 'generalType' ? (
                      <ChevronUpIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                    )}
      </div>
        </div>
                {generalFilters.type !== 'expense' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Revenue Category</label>
                    <div className="relative">
                      <select
                        value={generalFilters.revenueCategory}
                        onChange={(e) => setGeneralFilters({ ...generalFilters, revenueCategory: e.target.value })}
                        onFocus={() => setFocusedDropdown('generalRevenueCategory')}
                        onBlur={() => setFocusedDropdown(null)}
                        className="w-full px-3 pr-8 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer bg-white"
                      >
                        <option value="">All Categories</option>
                        <option value="service">Service</option>
                        <option value="product">Product</option>
                        <option value="consultation">Consultation</option>
                        <option value="other">Other</option>
                      </select>
                      {focusedDropdown === 'generalRevenueCategory' ? (
                        <ChevronUpIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      )}
        </div>
        </div>
                )}
                {generalFilters.type !== 'revenue' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Expense Category</label>
                    <div className="relative">
                      <select
                        value={generalFilters.expenseCategory}
                        onChange={(e) => setGeneralFilters({ ...generalFilters, expenseCategory: e.target.value })}
                        onFocus={() => setFocusedDropdown('generalExpenseCategory')}
                        onBlur={() => setFocusedDropdown(null)}
                        className="w-full px-3 pr-8 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer bg-white"
                      >
                        <option value="">All Categories</option>
                        <option value="labor">Labor</option>
                        <option value="materials">Materials</option>
                        <option value="equipment">Equipment</option>
                        <option value="travel">Travel</option>
                        <option value="overhead">Overhead</option>
                        <option value="other">Other</option>
                      </select>
                      {focusedDropdown === 'generalExpenseCategory' ? (
                        <ChevronUpIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      )}
      </div>
                  </div>
                )}
                {generalFilters.type !== 'expense' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Revenue Status</label>
          <div className="relative">
                      <select
                        value={generalFilters.revenueStatus}
                        onChange={(e) => setGeneralFilters({ ...generalFilters, revenueStatus: e.target.value })}
                        onFocus={() => setFocusedDropdown('generalRevenueStatus')}
                        onBlur={() => setFocusedDropdown(null)}
                        className="w-full px-3 pr-8 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer bg-white"
                      >
                        <option value="">All Statuses</option>
                        <option value="recorded">Recorded</option>
                        <option value="confirmed">Confirmed</option>
                      </select>
                      {focusedDropdown === 'generalRevenueStatus' ? (
                        <ChevronUpIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      )}
                    </div>
                  </div>
                )}
                {generalFilters.type !== 'revenue' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Expense Status</label>
                    <div className="relative">
                      <select
                        value={generalFilters.expenseStatus}
                        onChange={(e) => setGeneralFilters({ ...generalFilters, expenseStatus: e.target.value })}
                        onFocus={() => setFocusedDropdown('generalExpenseStatus')}
                        onBlur={() => setFocusedDropdown(null)}
                        className="w-full px-3 pr-8 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer bg-white"
                      >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      {focusedDropdown === 'generalExpenseStatus' ? (
                        <ChevronUpIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date From</label>
            <input
                    type="date"
                    value={generalFilters.dateFrom}
                    onChange={(e) => setGeneralFilters({ ...generalFilters, dateFrom: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
            />
          </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date To</label>
                  <input
                    type="date"
                    value={generalFilters.dateTo}
                    onChange={(e) => setGeneralFilters({ ...generalFilters, dateTo: e.target.value })}
                    min={generalFilters.dateFrom || undefined}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  />
        </div>
                <div className="flex items-end">
                  <button
                    onClick={() => toast.success('Filters applied')}
                    className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-4 py-2 text-sm rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg h-[38px] flex items-center justify-center"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          {viewMode === 'projects' ? (
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
                        {/* Edit button - Only Master Admin and System Admin can edit projects */}
                        {canCreateEditProject && (
                          <button
                            onClick={(e) => handleEditProject(item.project, e)}
                            className="p-2 text-black hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                        )}
                        {/* Delete button - requires DELETE_PROJECT permission (Master Admin only) */}
                        {canDeleteProject && (
                          <button
                            onClick={(e) => handleDelete(item.project._id, item.projectName, e)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          ) : (
            <div className="space-y-6">
              {/* General Revenues Section - Show if type is 'all' or 'revenue' */}
              {(generalFilters.type === 'all' || generalFilters.type === 'revenue') && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-green-600">General Revenues (Not Tied to Projects)</h3>
                    {generalRevenues.length > GENERAL_TABLE_LIMIT && (
                      <button
                        onClick={() => setShowAllRevenues(!showAllRevenues)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        {showAllRevenues ? 'Show Less' : `View All (${generalRevenues.length})`}
                      </button>
                    )}
                  </div>
                  {generalRevenues.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4">No general revenue records found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-300">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Code</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Description</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Amount</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Date</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Category</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Status</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(showAllRevenues ? generalRevenues : generalRevenues.slice(0, GENERAL_TABLE_LIMIT)).map((rev) => (
                            <tr key={rev._id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-3 py-2 text-sm">{rev.revenueCode}</td>
                              <td className="border border-gray-300 px-3 py-2 text-sm">{rev.description}</td>
                              <td className="border border-gray-300 px-3 py-2 text-sm font-semibold text-green-600">{formatCurrency(rev.amount)}</td>
                              <td className="border border-gray-300 px-3 py-2 text-sm">{new Date(rev.date).toLocaleDateString()}</td>
                              <td className="border border-gray-300 px-3 py-2 text-sm capitalize">{rev.category || 'N/A'}</td>
                              <td className="border border-gray-300 px-3 py-2 text-sm capitalize">{rev.status || 'N/A'}</td>
                              <td className="border border-gray-300 px-3 py-2">
                                <div className="flex gap-2">
                                  {canAccessRevenue && (
                                    <>
                                      <button
                                        onClick={() => handleEditRevenue(rev)}
                                        className="p-1 text-black hover:text-gray-700 hover:bg-gray-50 rounded"
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
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* General Expenses Section - Show if type is 'all' or 'expense' */}
              {(generalFilters.type === 'all' || generalFilters.type === 'expense') && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-red-600">General Expenses (Not Tied to Projects)</h3>
                    {generalExpenses.length > GENERAL_TABLE_LIMIT && (
                      <button
                        onClick={() => setShowAllExpenses(!showAllExpenses)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        {showAllExpenses ? 'Show Less' : `View All (${generalExpenses.length})`}
                      </button>
                    )}
                  </div>
                  {generalExpenses.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4">No general expense records found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-300">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Code</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Description</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Amount</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Date</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Category</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Status</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(showAllExpenses ? generalExpenses : generalExpenses.slice(0, GENERAL_TABLE_LIMIT)).map((exp) => (
                            <tr key={exp._id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-3 py-2 text-sm">{exp.expenseCode}</td>
                              <td className="border border-gray-300 px-3 py-2 text-sm">{exp.description}</td>
                              <td className="border border-gray-300 px-3 py-2 text-sm font-semibold text-red-600">{formatCurrency(exp.amount)}</td>
                              <td className="border border-gray-300 px-3 py-2 text-sm">{new Date(exp.date).toLocaleDateString()}</td>
                              <td className="border border-gray-300 px-3 py-2 text-sm capitalize">{exp.category || 'N/A'}</td>
                              <td className="border border-gray-300 px-3 py-2 text-sm capitalize">{exp.status || 'N/A'}</td>
                              <td className="border border-gray-300 px-3 py-2">
                                <div className="flex gap-2">
                                  {canAccessExpenses && (
                                    <>
                                      <button
                                        onClick={() => handleEditExpense(exp)}
                                        className="p-1 text-black hover:text-gray-700 hover:bg-gray-50 rounded"
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
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table Footer with Summary and Pagination */}
        {viewMode === 'projects' && (
        <div className="bg-gray-50 border-t-2 border-gray-200 px-3 sm:px-4 py-2 sm:py-3 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs sm:text-sm text-gray-600">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <span className="text-center sm:text-left">
                Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
                <span className="font-semibold text-gray-900">{Math.min(endIndex, tableData.length)}</span> of{' '}
                <span className="font-semibold text-gray-900">{tableData.length}</span> projects
              </span>
              
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-red-600"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-gray-600">per page</span>
              </div>
            </div>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[40px] ${
                        currentPage === pageNum
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Edit Project Modal - Shows Revenue & Expense Records */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
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
                                className="p-1 text-black hover:text-gray-700 hover:bg-gray-50 rounded"
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

            {/* General Revenues Section - Show all general revenues (not tied to any project) */}
            {generalRevenues.length > 0 && (
              <div className="mt-6 pt-6 border-t-2 border-gray-300">
                <h3 className="text-lg font-semibold mb-3 text-orange-600">General Revenues (Not Tied to Projects)</h3>
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
                      {generalRevenues.map((rev) => (
                        <tr key={rev._id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2 text-sm">{rev.revenueCode}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{rev.description}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm font-semibold text-green-600">{formatCurrency(rev.amount)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{new Date(rev.date).toLocaleDateString()}</td>
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAddRevenueToProject(rev._id, editingProject._id)}
                                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                                title="Add to Project"
                              >
                                <PlusIcon className="w-4 h-4" />
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
              </div>
            )}

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
                                className="p-1 text-black hover:text-gray-700 hover:bg-gray-50 rounded"
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

            {/* General Expenses Section - Show all general expenses (not tied to any project) */}
            {generalExpenses.length > 0 && (
              <div className="mt-6 pt-6 border-t-2 border-gray-300">
                <h3 className="text-lg font-semibold mb-3 text-orange-600">General Expenses (Not Tied to Projects)</h3>
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
                      {generalExpenses.map((exp) => (
                        <tr key={exp._id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2 text-sm">{exp.expenseCode}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{exp.description}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm font-semibold text-red-600">{formatCurrency(exp.amount)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{new Date(exp.date).toLocaleDateString()}</td>
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAddExpenseToProject(exp._id, editingProject._id)}
                                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                                title="Add to Project"
                              >
                                <PlusIcon className="w-4 h-4" />
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Revenue Modal - Same structure as Add Revenue Modal */}
      {editingRevenue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Revenue Record</h2>
              <button onClick={() => setEditingRevenue(null)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateRevenue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project</label>
                <select
                  value={editingRevenue.projectId || ''}
                  onChange={(e) => setEditingRevenue({ ...editingRevenue, projectId: e.target.value || '' })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                >
                  <option value="">General Revenue (No Project)</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.projectName} ({project.projectCode})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Leave as "General Revenue" for revenues not tied to a specific project</p>
              </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Expense Record</h2>
              <button onClick={() => setEditingExpense(null)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project</label>
                <select
                  value={editingExpense.projectId || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, projectId: e.target.value || '' })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                >
                  <option value="">General Expense (No Project)</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.projectName} ({project.projectCode})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Leave as "General Expense" for expenses not tied to a specific project</p>
              </div>
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

      {/* Add Type Selection Modal */}
      {showAddTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Add New Record</h2>
              <button onClick={() => setShowAddTypeModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-6 text-center">What would you like to add?</p>
            <div className="grid grid-cols-2 gap-4">
              {canAccessRevenue && (
                <button
                  onClick={() => {
                    setShowAddTypeModal(false);
                    setShowAddRevenueModal(true);
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-green-200 rounded-xl hover:bg-green-50 hover:border-green-400 transition-all duration-200 group"
                >
                  <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                    <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <span className="font-semibold text-gray-700">Add Revenue</span>
                </button>
              )}
              {canAccessExpenses && (
                <button
                  onClick={() => {
                    setShowAddTypeModal(false);
                    setShowAddExpenseModal(true);
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-red-200 rounded-xl hover:bg-red-50 hover:border-red-400 transition-all duration-200 group"
                >
                  <div className="p-3 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors">
                    <ArrowTrendingDownIcon className="w-8 h-8 text-red-600" />
                  </div>
                  <span className="font-semibold text-gray-700">Add Expense</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Revenue Modal */}
      {showAddRevenueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-600">Add Revenue Record</h2>
              <button onClick={() => setShowAddRevenueModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddRevenue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project</label>
                <select
                  value={newRevenue.projectId}
                  onChange={(e) => setNewRevenue({ ...newRevenue, projectId: e.target.value || '' })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                >
                  <option value="">General Revenue (No Project)</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.projectName} ({project.projectCode})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Leave as "General Revenue" for revenues not tied to a specific project</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Revenue Code *</label>
                <input
                  type="text"
                  value={newRevenue.revenueCode}
                  onChange={(e) => setNewRevenue({ ...newRevenue, revenueCode: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  placeholder="e.g., REV-001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <input
                  type="text"
                  value={newRevenue.description}
                  onChange={(e) => setNewRevenue({ ...newRevenue, description: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  placeholder="Revenue description"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newRevenue.amount}
                  onChange={(e) => setNewRevenue({ ...newRevenue, amount: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  value={newRevenue.date}
                  onChange={(e) => setNewRevenue({ ...newRevenue, date: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={newRevenue.category}
                  onChange={(e) => setNewRevenue({ ...newRevenue, category: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
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
                  value={newRevenue.status}
                  onChange={(e) => setNewRevenue({ ...newRevenue, status: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                >
                  <option value="recorded">Recorded</option>
                  <option value="confirmed">Confirmed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={newRevenue.notes}
                  onChange={(e) => setNewRevenue({ ...newRevenue, notes: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold">
                  Add Revenue
                </button>
                <button type="button" onClick={() => setShowAddRevenueModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-400 transition-colors font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600">Add Expense Record</h2>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project</label>
                <select
                  value={newExpense.projectId}
                  onChange={(e) => setNewExpense({ ...newExpense, projectId: e.target.value || '' })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                >
                  <option value="">General Expense (No Project)</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.projectName} ({project.projectCode})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Leave as "General Expense" for expenses not tied to a specific project</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expense Code *</label>
                <input
                  type="text"
                  value={newExpense.expenseCode}
                  onChange={(e) => setNewExpense({ ...newExpense, expenseCode: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  placeholder="e.g., EXP-001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  placeholder="Expense description"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
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
                  value={newExpense.status}
                  onChange={(e) => setNewExpense({ ...newExpense, status: e.target.value })}
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
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors font-semibold">
                  Add Expense
                </button>
                <button type="button" onClick={() => setShowAddExpenseModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-400 transition-colors font-medium">
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

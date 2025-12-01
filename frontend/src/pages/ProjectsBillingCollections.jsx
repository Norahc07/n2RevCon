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
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PlusIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { TableSkeleton, FilterSkeleton, CardSkeleton } from '../components/skeletons';

const ProjectsBillingCollections = () => {
  const navigate = useNavigate();
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
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingBilling, setEditingBilling] = useState(null);
  const [editingCollection, setEditingCollection] = useState(null);

  // Add modal states
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showAddBillingModal, setShowAddBillingModal] = useState(false);
  const [showAddCollectionModal, setShowAddCollectionModal] = useState(false);
  const [newBilling, setNewBilling] = useState({
    projectId: '',
    invoiceNumber: '',
    billingDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    amount: '',
    tax: '0',
    totalAmount: '',
    status: 'draft',
    description: '',
    notes: '',
  });
  const [newCollection, setNewCollection] = useState({
    projectId: '',
    billingId: '',
    collectionNumber: '',
    collectionDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMethod: 'bank_transfer',
    status: 'paid',
    checkNumber: '',
    notes: '',
  });
  const [selectedProjectBillings, setSelectedProjectBillings] = useState([]);

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

  // Pagination logic
  const totalPages = Math.ceil(filteredTableData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = useMemo(() => {
    return filteredTableData.slice(startIndex, endIndex);
  }, [filteredTableData, startIndex, endIndex]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, billingStatusFilter, paymentStatusFilter, appliedFilters]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      const params = {};
      
      if (appliedFilters.year) {
        params.year = appliedFilters.year;
      }
      if (appliedFilters.month) {
        params.month = appliedFilters.month;
      }
      if (appliedFilters.project && appliedFilters.project !== 'all') {
        params.projectId = appliedFilters.project;
      }
      
      const response = await exportAPI.exportBillingCollections(params);
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
      const params = {
        year: appliedFilters.year,
        month: appliedFilters.month,
      };
      if (appliedFilters.project && appliedFilters.project !== 'all') {
        params.projectId = appliedFilters.project;
      }
      const response = await exportAPI.exportBillingCollections(params);
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
      const params = {
        year: appliedFilters.year,
      };
      if (appliedFilters.project && appliedFilters.project !== 'all') {
        params.projectId = appliedFilters.project;
      }
      const response = await exportAPI.exportBillingCollections(params);
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
      const params = {
        projectId: projectId,
      };
      if (appliedFilters.year) {
        params.year = appliedFilters.year;
      }
      if (appliedFilters.month) {
        params.month = appliedFilters.month;
      }
      const response = await exportAPI.exportBillingCollections(params);
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

  // Handle edit project - open modal with billing/collection records
  const handleEditProject = (project, e) => {
    e.stopPropagation();
    setEditingProject(project);
    setShowEditModal(true);
  };

  // Get billing and collection records for editing project
  const projectBillings = useMemo(() => {
    if (!editingProject) return [];
    return allBillings.filter((b) => {
      const projectId = b.projectId?._id || b.projectId;
      return projectId === editingProject._id;
    });
  }, [allBillings, editingProject]);

  const projectCollections = useMemo(() => {
    if (!editingProject) return [];
    return allCollections.filter((c) => {
      const projectId = c.projectId?._id || c.projectId;
      return projectId === editingProject._id;
    });
  }, [allCollections, editingProject]);

  // Handle edit billing
  const handleEditBilling = (billing) => {
    setEditingBilling({
      ...billing,
      billingDate: billing.billingDate ? new Date(billing.billingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: billing.dueDate ? new Date(billing.dueDate).toISOString().split('T')[0] : '',
      amount: billing.amount || (billing.totalAmount ? (billing.totalAmount - (billing.tax || 0)).toString() : ''),
      tax: billing.tax || '0',
      totalAmount: billing.totalAmount || billing.amount || '',
    });
  };

  // Handle edit collection
  const handleEditCollection = (collection) => {
    setEditingCollection({
      ...collection,
      collectionDate: collection.collectionDate ? new Date(collection.collectionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      billingId: collection.billingId?._id || collection.billingId || '',
    });
  };

  // Handle update billing
  const handleUpdateBilling = async (e) => {
    e.preventDefault();
    try {
      await billingAPI.update(editingBilling._id, {
        invoiceNumber: editingBilling.invoiceNumber,
        billingDate: editingBilling.billingDate,
        dueDate: editingBilling.dueDate,
        amount: parseFloat(editingBilling.amount),
        tax: parseFloat(editingBilling.tax) || 0,
        totalAmount: parseFloat(editingBilling.totalAmount),
        status: editingBilling.status,
        description: editingBilling.description || undefined,
        notes: editingBilling.notes || undefined,
      });
      toast.success('Billing record updated');
      setEditingBilling(null);
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update billing record');
    }
  };

  // Handle update collection
  const handleUpdateCollection = async (e) => {
    e.preventDefault();
    try {
      await collectionAPI.update(editingCollection._id, {
        billingId: editingCollection.billingId,
        collectionNumber: editingCollection.collectionNumber,
        collectionDate: editingCollection.collectionDate,
        amount: parseFloat(editingCollection.amount),
        paymentMethod: editingCollection.paymentMethod,
        status: editingCollection.status,
        checkNumber: editingCollection.checkNumber || undefined,
        notes: editingCollection.notes || undefined,
      });
      toast.success('Collection record updated');
      setEditingCollection(null);
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update collection record');
    }
  };

  // Handle delete billing
  const handleDeleteBilling = async (billingId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this billing record?')) {
      return;
    }
    try {
      await billingAPI.delete(billingId);
      toast.success('Billing record deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete billing record');
    }
  };

  // Handle delete collection
  const handleDeleteCollection = async (collectionId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this collection record?')) {
      return;
    }
    try {
      await collectionAPI.delete(collectionId);
      toast.success('Collection record deleted');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete collection record');
    }
  };

  // Handle project selection for collection (to get billings)
  const handleProjectSelectForCollection = (projectId) => {
    setNewCollection({ ...newCollection, projectId, billingId: '' });
    if (projectId) {
      const billings = allBillings.filter((b) => {
        const pId = b.projectId?._id || b.projectId;
        return pId === projectId;
      });
      setSelectedProjectBillings(billings);
    } else {
      setSelectedProjectBillings([]);
    }
  };

  // Handle add billing
  const handleAddBilling = async (e) => {
    e.preventDefault();
    if (!newBilling.projectId) {
      toast.error('Please select a project');
      return;
    }
    try {
      await billingAPI.create({
        projectId: newBilling.projectId,
        invoiceNumber: newBilling.invoiceNumber,
        billingDate: newBilling.billingDate,
        dueDate: newBilling.dueDate || undefined,
        amount: parseFloat(newBilling.amount),
        tax: parseFloat(newBilling.tax) || 0,
        totalAmount: parseFloat(newBilling.totalAmount),
        status: newBilling.status,
        description: newBilling.description || undefined,
        notes: newBilling.notes || undefined,
      });
      toast.success('Billing record added successfully');
      setShowAddBillingModal(false);
      setNewBilling({
        projectId: '',
        invoiceNumber: '',
        billingDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        amount: '',
        tax: '0',
        totalAmount: '',
        status: 'draft',
        description: '',
        notes: '',
      });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to add billing record');
    }
  };

  // Handle add collection
  const handleAddCollection = async (e) => {
    e.preventDefault();
    if (!newCollection.projectId) {
      toast.error('Please select a project');
      return;
    }
    if (!newCollection.billingId) {
      toast.error('Please select a billing record');
      return;
    }
    try {
      await collectionAPI.create({
        projectId: newCollection.projectId,
        billingId: newCollection.billingId,
        collectionNumber: newCollection.collectionNumber,
        collectionDate: newCollection.collectionDate,
        amount: parseFloat(newCollection.amount),
        paymentMethod: newCollection.paymentMethod,
        status: newCollection.status,
        checkNumber: newCollection.checkNumber || undefined,
        notes: newCollection.notes || undefined,
      });
      toast.success('Collection record added successfully');
      setShowAddCollectionModal(false);
      setNewCollection({
        projectId: '',
        billingId: '',
        collectionNumber: '',
        collectionDate: new Date().toISOString().split('T')[0],
        amount: '',
        paymentMethod: 'bank_transfer',
        status: 'paid',
        checkNumber: '',
        notes: '',
      });
      setSelectedProjectBillings([]);
      fetchAllData();
    } catch (error) {
      toast.error('Failed to add collection record');
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
          <TableSkeleton rows={10} columns={10} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Billings & Collections</h1>
        <button
          onClick={() => setShowAddTypeModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <PlusIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Add Billing/Collection</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Filter Section */}
      <div className="card p-4 shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <FunnelIcon className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Year</label>
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
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Month</label>
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
              onClick={handleExportCurrentFilter}
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

        {/* Table Footer with Summary and Pagination */}
        <div className="bg-gray-50 border-t-2 border-gray-200 px-3 sm:px-4 py-2 sm:py-3 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs sm:text-sm text-gray-600">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <span className="text-center sm:text-left">
                Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
                <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredTableData.length)}</span> of{' '}
                <span className="font-semibold text-gray-900">{filteredTableData.length}</span> projects
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
      </div>

      {/* Edit Project Modal - Shows Billing & Collection Records */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Records - {editingProject.projectName}</h2>
              <button onClick={() => {
                setShowEditModal(false);
                setEditingProject(null);
                setEditingBilling(null);
                setEditingCollection(null);
              }} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Billing Records Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-600">Billing Records</h3>
              {projectBillings.length === 0 ? (
                <p className="text-gray-500 text-sm">No billing records found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Invoice #</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Billing Date</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Due Date</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Amount</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Status</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectBillings.map((bill) => (
                        <tr key={bill._id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2 text-sm">{bill.invoiceNumber}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{new Date(bill.billingDate).toLocaleDateString()}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm font-semibold">{formatCurrency(bill.totalAmount || bill.amount)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                              bill.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                              bill.status === 'overdue' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {bill.status}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditBilling(bill)}
                                className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteBilling(bill._id, e)}
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

            {/* Collection Records Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-600">Collection Records</h3>
              {projectCollections.length === 0 ? (
                <p className="text-gray-500 text-sm">No collection records found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Collection #</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Date</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Amount</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Method</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Status</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectCollections.map((col) => (
                        <tr key={col._id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2 text-sm">{col.collectionNumber}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{new Date(col.collectionDate).toLocaleDateString()}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm font-semibold text-green-600">{formatCurrency(col.amount)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{col.paymentMethod}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              col.status === 'paid' ? 'bg-green-100 text-green-800' :
                              col.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              col.status === 'uncollectible' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {col.status}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditCollection(col)}
                                className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteCollection(col._id, e)}
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

      {/* Edit Billing Modal - Same structure as Add Billing Modal */}
      {editingBilling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Billing Record</h2>
              <button onClick={() => setEditingBilling(null)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateBilling} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Number *</label>
                <input
                  type="text"
                  value={editingBilling.invoiceNumber || ''}
                  onChange={(e) => setEditingBilling({ ...editingBilling, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Billing Date *</label>
                <input
                  type="date"
                  value={editingBilling.billingDate || ''}
                  onChange={(e) => setEditingBilling({ ...editingBilling, billingDate: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={editingBilling.dueDate || ''}
                  onChange={(e) => setEditingBilling({ ...editingBilling, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingBilling.amount || ''}
                  onChange={(e) => {
                    const amount = e.target.value;
                    const tax = parseFloat(editingBilling.tax) || 0;
                    const total = parseFloat(amount) - tax;
                    setEditingBilling({ ...editingBilling, amount, totalAmount: total.toString() });
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingBilling.tax || '0'}
                  onChange={(e) => {
                    const tax = e.target.value;
                    const amount = parseFloat(editingBilling.amount) || 0;
                    const total = amount - parseFloat(tax);
                    setEditingBilling({ ...editingBilling, tax, totalAmount: total.toString() });
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Amount (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingBilling.totalAmount || ''}
                  readOnly
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  value={editingBilling.status || 'draft'}
                  onChange={(e) => setEditingBilling({ ...editingBilling, status: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  value={editingBilling.description || ''}
                  onChange={(e) => setEditingBilling({ ...editingBilling, description: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  rows="3"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  Update Billing
                </button>
                <button type="button" onClick={() => setEditingBilling(null)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Collection Modal - Same structure as Add Collection Modal */}
      {editingCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Collection Record</h2>
              <button onClick={() => setEditingCollection(null)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateCollection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Billing Record *</label>
                <select
                  value={editingCollection.billingId || ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, billingId: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                >
                  <option value="">Select a billing record</option>
                  {projectBillings.map((bill) => (
                    <option key={bill._id} value={bill._id}>
                      {bill.invoiceNumber} - {formatCurrency(bill.totalAmount || bill.amount)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Collection Number *</label>
                <input
                  type="text"
                  value={editingCollection.collectionNumber || ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, collectionNumber: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Collection Date *</label>
                <input
                  type="date"
                  value={editingCollection.collectionDate || ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, collectionDate: e.target.value })}
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
                  value={editingCollection.amount || ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, amount: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method *</label>
                <select
                  value={editingCollection.paymentMethod || 'bank_transfer'}
                  onChange={(e) => setEditingCollection({ ...editingCollection, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  value={editingCollection.status || 'paid'}
                  onChange={(e) => setEditingCollection({ ...editingCollection, status: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                >
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="uncollectible">Uncollectible</option>
                </select>
              </div>
              {editingCollection.paymentMethod === 'check' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Check Number</label>
                  <input
                    type="text"
                    value={editingCollection.checkNumber || ''}
                    onChange={(e) => setEditingCollection({ ...editingCollection, checkNumber: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={editingCollection.notes || ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, notes: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  rows="3"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold">
                  Update Collection
                </button>
                <button type="button" onClick={() => setEditingCollection(null)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Type Selection Modal */}
      {showAddTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Add New Record</h2>
              <button onClick={() => setShowAddTypeModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-6 text-center">What would you like to add?</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setShowAddTypeModal(false);
                  setShowAddBillingModal(true);
                }}
                className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 group"
              >
                <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                  <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-700">Add Billing</span>
              </button>
              <button
                onClick={() => {
                  setShowAddTypeModal(false);
                  setShowAddCollectionModal(true);
                }}
                className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-green-200 rounded-xl hover:bg-green-50 hover:border-green-400 transition-all duration-200 group"
              >
                <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                  <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
                </div>
                <span className="font-semibold text-gray-700">Add Collection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Billing Modal */}
      {showAddBillingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-600">Add Billing Record</h2>
              <button onClick={() => setShowAddBillingModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddBilling} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project *</label>
                <select
                  value={newBilling.projectId}
                  onChange={(e) => setNewBilling({ ...newBilling, projectId: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.projectName} ({project.projectCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Number *</label>
                <input
                  type="text"
                  value={newBilling.invoiceNumber}
                  onChange={(e) => setNewBilling({ ...newBilling, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  placeholder="e.g., INV-001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Billing Date *</label>
                <input
                  type="date"
                  value={newBilling.billingDate}
                  onChange={(e) => setNewBilling({ ...newBilling, billingDate: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={newBilling.dueDate}
                  onChange={(e) => setNewBilling({ ...newBilling, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newBilling.amount}
                  onChange={(e) => {
                    const amount = e.target.value;
                    const tax = parseFloat(newBilling.tax) || 0;
                    const total = parseFloat(amount) - tax;
                    setNewBilling({ ...newBilling, amount, totalAmount: total.toString() });
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newBilling.tax}
                  onChange={(e) => {
                    const tax = e.target.value;
                    const amount = parseFloat(newBilling.amount) || 0;
                    const total = amount - parseFloat(tax);
                    setNewBilling({ ...newBilling, tax, totalAmount: total.toString() });
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Amount (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newBilling.totalAmount}
                  readOnly
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  value={newBilling.status}
                  onChange={(e) => setNewBilling({ ...newBilling, status: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  value={newBilling.description}
                  onChange={(e) => setNewBilling({ ...newBilling, description: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  rows="3"
                  placeholder="Billing description..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  Add Billing
                </button>
                <button type="button" onClick={() => setShowAddBillingModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-400 transition-colors font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Collection Modal */}
      {showAddCollectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-600">Add Collection Record</h2>
              <button onClick={() => {
                setShowAddCollectionModal(false);
                setSelectedProjectBillings([]);
              }} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddCollection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project *</label>
                <select
                  value={newCollection.projectId}
                  onChange={(e) => handleProjectSelectForCollection(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.projectName} ({project.projectCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Billing Record *</label>
                <select
                  value={newCollection.billingId}
                  onChange={(e) => setNewCollection({ ...newCollection, billingId: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  disabled={!newCollection.projectId}
                  required
                >
                  <option value="">Select a billing record</option>
                  {selectedProjectBillings.map((bill) => (
                    <option key={bill._id} value={bill._id}>
                      {bill.invoiceNumber} - {formatCurrency(bill.totalAmount || bill.amount)}
                    </option>
                  ))}
                </select>
                {newCollection.projectId && selectedProjectBillings.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">No billing records found for this project. Add a billing first.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Collection Number *</label>
                <input
                  type="text"
                  value={newCollection.collectionNumber}
                  onChange={(e) => setNewCollection({ ...newCollection, collectionNumber: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  placeholder="e.g., COL-001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Collection Date *</label>
                <input
                  type="date"
                  value={newCollection.collectionDate}
                  onChange={(e) => setNewCollection({ ...newCollection, collectionDate: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newCollection.amount}
                  onChange={(e) => setNewCollection({ ...newCollection, amount: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method *</label>
                <select
                  value={newCollection.paymentMethod}
                  onChange={(e) => setNewCollection({ ...newCollection, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  required
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {newCollection.paymentMethod === 'check' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Check Number</label>
                  <input
                    type="text"
                    value={newCollection.checkNumber}
                    onChange={(e) => setNewCollection({ ...newCollection, checkNumber: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                    placeholder="Check number"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  value={newCollection.status}
                  onChange={(e) => setNewCollection({ ...newCollection, status: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  required
                >
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="uncollectible">Uncollectible</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={newCollection.notes}
                  onChange={(e) => setNewCollection({ ...newCollection, notes: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold">
                  Add Collection
                </button>
                <button type="button" onClick={() => {
                  setShowAddCollectionModal(false);
                  setSelectedProjectBillings([]);
                }} className="flex-1 bg-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-400 transition-colors font-medium">
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

export default ProjectsBillingCollections;

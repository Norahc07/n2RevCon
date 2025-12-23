import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, revenueAPI, expenseAPI, billingAPI, collectionAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';
import { PencilIcon, TrashIcon, XMarkIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { TableSkeleton, CardSkeleton, SkeletonBox } from '../components/skeletons';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [revenues, setRevenues] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [billings, setBillings] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination states for each table
  const [revenuePage, setRevenuePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [billingPage, setBillingPage] = useState(1);
  const [collectionPage, setCollectionPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Edit modal states
  const [editingRevenue, setEditingRevenue] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingBilling, setEditingBilling] = useState(null);
  const [editingCollection, setEditingCollection] = useState(null);
  
  // Add modal states
  const [showAddRevenueModal, setShowAddRevenueModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddBillingModal, setShowAddBillingModal] = useState(false);
  const [showAddCollectionModal, setShowAddCollectionModal] = useState(false);
  const [newRevenue, setNewRevenue] = useState({
    revenueCode: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'service',
    status: 'recorded',
    notes: ''
  });
  const [newExpense, setNewExpense] = useState({
    expenseCode: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'other',
    status: 'pending',
    notes: ''
  });
  const [newBilling, setNewBilling] = useState({
    invoiceNumber: '',
    billingDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    amount: '',
    tax: '0',
    totalAmount: '',
    status: 'draft',
    description: '',
    notes: ''
  });
  const [newCollection, setNewCollection] = useState({
    billingId: '',
    collectionNumber: '',
    collectionDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMethod: 'bank_transfer',
    status: 'paid',
    checkNumber: '',
    notes: ''
  });

  useEffect(() => {
    fetchProject();
    if (activeTab === 'revenue') {
      fetchRevenues();
      fetchExpenses(); // Also fetch expenses when on Revenue & Expenses tab
    }
    if (activeTab === 'billing') {
      fetchBillings();
      fetchCollections();
    }
  }, [id, activeTab]);

  // Pagination calculations - must be before any conditional returns
  const revenueTotalPages = Math.ceil(revenues.length / itemsPerPage);
  const revenueStartIndex = (revenuePage - 1) * itemsPerPage;
  const revenueEndIndex = revenueStartIndex + itemsPerPage;
  const paginatedRevenues = useMemo(() => {
    return revenues.slice(revenueStartIndex, revenueEndIndex);
  }, [revenues, revenueStartIndex, revenueEndIndex]);

  const expenseTotalPages = Math.ceil(expenses.length / itemsPerPage);
  const expenseStartIndex = (expensePage - 1) * itemsPerPage;
  const expenseEndIndex = expenseStartIndex + itemsPerPage;
  const paginatedExpenses = useMemo(() => {
    return expenses.slice(expenseStartIndex, expenseEndIndex);
  }, [expenses, expenseStartIndex, expenseEndIndex]);

  const billingTotalPages = Math.ceil(billings.length / itemsPerPage);
  const billingStartIndex = (billingPage - 1) * itemsPerPage;
  const billingEndIndex = billingStartIndex + itemsPerPage;
  const paginatedBillings = useMemo(() => {
    return billings.slice(billingStartIndex, billingEndIndex);
  }, [billings, billingStartIndex, billingEndIndex]);

  const collectionTotalPages = Math.ceil(collections.length / itemsPerPage);
  const collectionStartIndex = (collectionPage - 1) * itemsPerPage;
  const collectionEndIndex = collectionStartIndex + itemsPerPage;
  const paginatedCollections = useMemo(() => {
    return collections.slice(collectionStartIndex, collectionEndIndex);
  }, [collections, collectionStartIndex, collectionEndIndex]);

  // Reset pages when data changes
  useEffect(() => {
    setRevenuePage(1);
    setExpensePage(1);
    setBillingPage(1);
    setCollectionPage(1);
  }, [revenues.length, expenses.length, billings.length, collections.length]);

  const fetchProject = async () => {
    try {
      const response = await projectAPI.getById(id);
      setProject(response.data.project);
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenues = async () => {
    try {
      const response = await revenueAPI.getAll({ projectId: id });
      setRevenues(response.data.revenue);
    } catch (error) {
      toast.error('Failed to load revenue');
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await expenseAPI.getAll({ projectId: id });
      setExpenses(response.data.expenses);
    } catch (error) {
      toast.error('Failed to load expenses');
    }
  };

  const fetchBillings = async () => {
    try {
      const response = await billingAPI.getAll({ projectId: id });
      setBillings(response.data.billing);
    } catch (error) {
      toast.error('Failed to load billing');
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await collectionAPI.getAll({ projectId: id });
      setCollections(response.data.collections);
    } catch (error) {
      toast.error('Failed to load collections');
    }
  };

  // Delete handlers
  const handleDeleteRevenue = async (revenueId) => {
    if (!window.confirm('Are you sure you want to delete this revenue record?')) return;
    try {
      await revenueAPI.delete(revenueId);
      toast.success('Revenue record deleted');
      fetchRevenues();
    } catch (error) {
      toast.error('Failed to delete revenue record');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await expenseAPI.delete(expenseId);
      toast.success('Expense record deleted');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expense record');
    }
  };

  const handleDeleteBilling = async (billingId) => {
    if (!window.confirm('Are you sure you want to delete this billing record?')) return;
    try {
      await billingAPI.delete(billingId);
      toast.success('Billing record deleted');
      fetchBillings();
    } catch (error) {
      toast.error('Failed to delete billing record');
    }
  };

  const handleDeleteCollection = async (collectionId) => {
    if (!window.confirm('Are you sure you want to delete this collection record?')) return;
    try {
      await collectionAPI.delete(collectionId);
      toast.success('Collection record deleted');
      fetchCollections();
    } catch (error) {
      toast.error('Failed to delete collection record');
    }
  };

  // Update handlers
  const handleUpdateRevenue = async (e) => {
    e.preventDefault();
    try {
      await revenueAPI.update(editingRevenue._id, {
        revenueCode: editingRevenue.revenueCode,
        description: editingRevenue.description,
        amount: parseFloat(editingRevenue.amount),
        date: editingRevenue.date,
      });
      toast.success('Revenue record updated');
      setEditingRevenue(null);
      fetchRevenues();
    } catch (error) {
      toast.error('Failed to update revenue record');
    }
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    try {
      await expenseAPI.update(editingExpense._id, {
        expenseCode: editingExpense.expenseCode,
        description: editingExpense.description,
        amount: parseFloat(editingExpense.amount),
        date: editingExpense.date,
      });
      toast.success('Expense record updated');
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to update expense record');
    }
  };

  const handleUpdateBilling = async (e) => {
    e.preventDefault();
    try {
      const amount = parseFloat(editingBilling.amount) || 0;
      const tax = parseFloat(editingBilling.tax) || 0;
      const totalAmount = amount - tax; // Amount minus Tax equals Total Amount
      
      await billingAPI.update(editingBilling._id, {
        invoiceNumber: editingBilling.invoiceNumber,
        billingDate: editingBilling.billingDate,
        dueDate: editingBilling.dueDate,
        amount: amount,
        tax: tax,
        totalAmount: totalAmount,
        status: editingBilling.status,
        description: editingBilling.description || undefined,
        notes: editingBilling.notes || undefined,
      });
      toast.success('Billing record updated');
      setEditingBilling(null);
      fetchBillings();
    } catch (error) {
      toast.error('Failed to update billing record');
    }
  };

  const handleUpdateCollection = async (e) => {
    e.preventDefault();
    try {
      await collectionAPI.update(editingCollection._id, {
        collectionNumber: editingCollection.collectionNumber,
        collectionDate: editingCollection.collectionDate,
        amount: parseFloat(editingCollection.amount),
        paymentMethod: editingCollection.paymentMethod,
        status: editingCollection.status,
      });
      toast.success('Collection record updated');
      setEditingCollection(null);
      fetchCollections();
    } catch (error) {
      toast.error('Failed to update collection record');
    }
  };

  // Create handlers
  const handleCreateRevenue = async (e) => {
    e.preventDefault();
    try {
      await revenueAPI.create({
        projectId: id,
        revenueCode: newRevenue.revenueCode,
        description: newRevenue.description,
        amount: parseFloat(newRevenue.amount),
        date: newRevenue.date,
        category: newRevenue.category,
        status: newRevenue.status,
        notes: newRevenue.notes || undefined,
      });
      toast.success('Revenue record created successfully');
      setShowAddRevenueModal(false);
      setNewRevenue({
        revenueCode: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'service',
        status: 'recorded',
        notes: ''
      });
      fetchRevenues();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create revenue record');
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await expenseAPI.create({
        projectId: id,
        expenseCode: newExpense.expenseCode,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        date: newExpense.date,
        category: newExpense.category,
        status: newExpense.status,
        notes: newExpense.notes || undefined,
      });
      toast.success('Expense record created successfully');
      setShowAddExpenseModal(false);
      setNewExpense({
        expenseCode: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'other',
        status: 'pending',
        notes: ''
      });
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create expense record');
    }
  };

  const handleCreateBilling = async (e) => {
    e.preventDefault();
    try {
      const amount = parseFloat(newBilling.amount) || 0;
      const tax = parseFloat(newBilling.tax) || 0;
      const totalAmount = amount - tax;
      
      await billingAPI.create({
        projectId: id,
        invoiceNumber: newBilling.invoiceNumber,
        billingDate: newBilling.billingDate,
        dueDate: newBilling.dueDate,
        amount: amount,
        tax: tax,
        totalAmount: totalAmount,
        status: newBilling.status,
        description: newBilling.description || undefined,
        notes: newBilling.notes || undefined,
      });
      toast.success('Billing record created successfully');
      setShowAddBillingModal(false);
      setNewBilling({
        invoiceNumber: '',
        billingDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        amount: '',
        tax: '0',
        totalAmount: '',
        status: 'draft',
        description: '',
        notes: ''
      });
      fetchBillings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create billing record');
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    try {
      if (!newCollection.billingId) {
        toast.error('Please select a billing record');
        return;
      }
      
      await collectionAPI.create({
        billingId: newCollection.billingId,
        collectionNumber: newCollection.collectionNumber,
        collectionDate: newCollection.collectionDate,
        amount: parseFloat(newCollection.amount),
        paymentMethod: newCollection.paymentMethod,
        status: newCollection.status,
        checkNumber: newCollection.checkNumber || undefined,
        notes: newCollection.notes || undefined,
      });
      toast.success('Collection record created successfully');
      setShowAddCollectionModal(false);
      setNewCollection({
        billingId: '',
        collectionNumber: '',
        collectionDate: new Date().toISOString().split('T')[0],
        amount: '',
        paymentMethod: 'bank_transfer',
        status: 'paid',
        checkNumber: '',
        notes: ''
      });
      fetchCollections();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create collection record');
    }
  };

  if (loading || !project) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <SkeletonBox width="300px" height="32px" />
            <SkeletonBox width="200px" height="20px" />
          </div>
          <SkeletonBox width="100px" height="40px" />
        </div>
        
        {/* Tabs Skeleton */}
        <div className="flex gap-2 border-b-2 border-gray-200">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBox key={i} width="120px" height="40px" className="mb-[-2px]" />
          ))}
        </div>
        
        {/* Content Skeleton */}
        <div className="card p-6 shadow-md">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <SkeletonBox width="150px" height="20px" />
                <SkeletonBox width="200px" height="20px" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Table Skeleton */}
        <div className="card p-6 shadow-md">
          <TableSkeleton rows={5} columns={6} />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'revenue', label: 'Revenue & Expenses' },
    { id: 'billing', label: 'Billing & Collections' },
  ];

  // Pagination helper function
  const renderPagination = (currentPage, totalPages, onPageChange, startIndex, endIndex, totalItems, itemsPerPage) => {
    if (totalPages <= 1) return null;

    return (
      <div className="bg-gray-50 border-t-2 border-gray-200 px-3 sm:px-4 py-2 sm:py-3 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs sm:text-sm text-gray-600">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span className="text-center sm:text-left">
              Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-gray-900">{Math.min(endIndex, totalItems)}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalItems}</span> records
            </span>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  onPageChange(1);
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
        
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200">
          <button
            onClick={() => onPageChange(currentPage - 1)}
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
                  onClick={() => onPageChange(pageNum)}
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
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const totalRevenue = revenues.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="text-primary hover:underline mb-2"
          >
            ← Back to Projects
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{project.projectName}</h1>
          <p className="text-gray-600">{project.projectCode}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Navigate to AddProject with edit mode
              navigate(`/projects/${id}/edit`);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
          >
            <PencilIcon className="w-5 h-5" />
            Edit Project
          </button>
          <button
            onClick={async () => {
              const confirmMessage = `Are you sure you want to delete "${project.projectName}"?\n\nThis project will be moved to "Recently Deleted" and can be restored within 30 days. After 30 days, it will be permanently deleted.`;
              if (window.confirm(confirmMessage)) {
                try {
                  await projectAPI.delete(id);
                  toast.success('Project moved to Recently Deleted. It will be permanently deleted after 30 days.');
                  navigate('/projects');
                } catch (error) {
                  toast.error('Failed to delete project');
                }
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
            Delete Project
          </button>
        </div>
      </div>

      {/* Project Info Card */}
      <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <span className="text-sm text-gray-600">Client</span>
          <p className="font-semibold">{project.clientName}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Status</span>
          <p className="font-semibold capitalize">{project.status}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Transaction Price</span>
          <p className="font-semibold">{formatCurrency(project.budget)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b-2 border-gray-200 mb-4">
          <div className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-4 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'description' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{project.description || 'No description provided'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Start Date</span>
                <p>{new Date(project.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">End Date</span>
                <p>{new Date(project.endDate).toLocaleDateString()}</p>
              </div>
              {project.location && (
                <div>
                  <span className="text-sm text-gray-600">Location</span>
                  <p>{project.location}</p>
                </div>
              )}
              {project.projectManager && (
                <div>
                  <span className="text-sm text-gray-600">Project Manager</span>
                  <p>{project.projectManager}</p>
                </div>
              )}
            </div>
            {project.tags && project.tags.length > 0 && (
              <div>
                <span className="text-sm text-gray-600">Tags</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {project.tags.map((tag, index) => (
                    <span key={index} className="bg-primary text-white px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {project.notes && (
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-gray-700">{project.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="card">
                <h3 className="text-sm text-gray-600 mb-1">Total Revenue</h3>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="card">
                <h3 className="text-sm text-gray-600 mb-1">Total Expenses</h3>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Revenue Records</h3>
                <button
                  onClick={() => setShowAddRevenueModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Revenue
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Code</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Description</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Amount</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Date</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenues.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500 border border-gray-300">
                          No revenue records found. Click "Add Revenue" to create one.
                        </td>
                      </tr>
                    ) : (
                      paginatedRevenues.map((rev) => (
                        <tr key={rev._id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 border border-gray-300">{rev.revenueCode}</td>
                          <td className="px-4 py-3 border border-gray-300">{rev.description}</td>
                          <td className="px-4 py-3 border border-gray-300 font-semibold text-green-600">{formatCurrency(rev.amount)}</td>
                          <td className="px-4 py-3 border border-gray-300">{new Date(rev.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 border border-gray-300">
                            <div className="flex gap-3">
                              <button
                                onClick={() => setEditingRevenue({ ...rev })}
                                className="p-2 text-black hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRevenue(rev._id)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
                {renderPagination(revenuePage, revenueTotalPages, setRevenuePage, revenueStartIndex, revenueEndIndex, revenues.length, itemsPerPage)}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Expense Records</h3>
                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Expense
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Code</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Description</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Amount</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Date</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500 border border-gray-300">
                          No expense records found. Click "Add Expense" to create one.
                        </td>
                      </tr>
                    ) : (
                      paginatedExpenses.map((exp) => (
                        <tr key={exp._id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 border border-gray-300">{exp.expenseCode}</td>
                          <td className="px-4 py-3 border border-gray-300">{exp.description}</td>
                          <td className="px-4 py-3 border border-gray-300 font-semibold text-red-600">{formatCurrency(exp.amount)}</td>
                          <td className="px-4 py-3 border border-gray-300">{new Date(exp.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 border border-gray-300">
                            <div className="flex gap-3">
                              <button
                                onClick={() => setEditingExpense({ ...exp })}
                                className="p-2 text-black hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp._id)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
                {renderPagination(expensePage, expenseTotalPages, setExpensePage, expenseStartIndex, expenseEndIndex, expenses.length, itemsPerPage)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Billing Records</h3>
                <button
                  onClick={() => setShowAddBillingModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Billing
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Invoice #</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Billing Date</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Due Date</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Amount</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Tax</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Total Amount</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Status</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billings.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-gray-500 border border-gray-300">
                          No billing records found. Click "Add Billing" to create one.
                        </td>
                      </tr>
                    ) : (
                      paginatedBillings.map((bill) => (
                        <tr key={bill._id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 border border-gray-300">{bill.invoiceNumber}</td>
                          <td className="px-4 py-3 border border-gray-300">{new Date(bill.billingDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 border border-gray-300">{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3 border border-gray-300 font-semibold text-blue-600">{formatCurrency(bill.amount || 0)}</td>
                          <td className="px-4 py-3 border border-gray-300 font-semibold text-orange-600">{formatCurrency(bill.tax || 0)}</td>
                          <td className="px-4 py-3 border border-gray-300 font-semibold text-green-600">{formatCurrency(bill.totalAmount || 0)}</td>
                          <td className="px-4 py-3 border border-gray-300">
                            <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
                              bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                              bill.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                              bill.status === 'overdue' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {bill.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 border border-gray-300">
                            <div className="flex gap-3">
              <button
                onClick={() => setEditingBilling({
                  ...bill,
                  billingDate: bill.billingDate ? new Date(bill.billingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                  dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : '',
                  amount: (bill.amount || 0).toString(),
                  tax: (bill.tax || 0).toString(),
                  totalAmount: (bill.totalAmount || 0).toString(),
                })}
                className="p-2 text-black hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                title="Edit"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
                              <button
                                onClick={() => handleDeleteBilling(bill._id)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
                {renderPagination(billingPage, billingTotalPages, setBillingPage, billingStartIndex, billingEndIndex, billings.length, itemsPerPage)}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Collection Records</h3>
                <button
                  onClick={() => setShowAddCollectionModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Collection
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Collection #</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Date</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Amount</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Method</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Status</th>
                      <th className="text-left px-4 py-3 font-semibold border border-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collections.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500 border border-gray-300">
                          No collection records found. Click "Add Collection" to create one.
                        </td>
                      </tr>
                    ) : (
                      paginatedCollections.map((col) => (
                        <tr key={col._id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 border border-gray-300">{col.collectionNumber}</td>
                          <td className="px-4 py-3 border border-gray-300">{new Date(col.collectionDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 border border-gray-300 font-semibold text-green-600">{formatCurrency(col.amount)}</td>
                          <td className="px-4 py-3 border border-gray-300 capitalize">{col.paymentMethod?.replace('_', ' ') || 'N/A'}</td>
                          <td className="px-4 py-3 border border-gray-300">
                            <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
                              col.status === 'paid' ? 'bg-green-100 text-green-800' :
                              col.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              col.status === 'uncollectible' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {col.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 border border-gray-300">
                            <div className="flex gap-3">
                              <button
                                onClick={() => setEditingCollection({ ...col })}
                                className="p-2 text-black hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCollection(col._id)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
                {renderPagination(collectionPage, collectionTotalPages, setCollectionPage, collectionStartIndex, collectionEndIndex, collections.length, itemsPerPage)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Modals */}
      {/* Add Revenue Modal */}
      {showAddRevenueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Revenue Record</h2>
              <button onClick={() => setShowAddRevenueModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateRevenue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Revenue Code *</label>
                <input
                  type="text"
                  value={newRevenue.revenueCode}
                  onChange={(e) => setNewRevenue({ ...newRevenue, revenueCode: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
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
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  placeholder="e.g., Payment for services rendered"
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
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
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
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={newRevenue.category}
                  onChange={(e) => setNewRevenue({ ...newRevenue, category: e.target.value })}
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
                  value={newRevenue.status}
                  onChange={(e) => setNewRevenue({ ...newRevenue, status: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
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
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold">
                  Add Revenue
                </button>
                <button type="button" onClick={() => setShowAddRevenueModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Expense Record</h2>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateExpense} className="space-y-4">
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
                  placeholder="e.g., Office supplies purchase"
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
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold">
                  Add Expense
                </button>
                <button type="button" onClick={() => setShowAddExpenseModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modals */}
      {/* Revenue Edit Modal */}
      {editingRevenue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Revenue Record</h2>
              <button onClick={() => setEditingRevenue(null)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateRevenue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Revenue Code</label>
                <input
                  type="text"
                  value={editingRevenue.revenueCode || ''}
                  onChange={(e) => setEditingRevenue({ ...editingRevenue, revenueCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={editingRevenue.description || ''}
                  onChange={(e) => setEditingRevenue({ ...editingRevenue, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingRevenue.amount || ''}
                  onChange={(e) => setEditingRevenue({ ...editingRevenue, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={editingRevenue.date ? new Date(editingRevenue.date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingRevenue({ ...editingRevenue, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Update
                </button>
                <button type="button" onClick={() => setEditingRevenue(null)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Edit Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Expense Record</h2>
              <button onClick={() => setEditingExpense(null)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Expense Code</label>
                <input
                  type="text"
                  value={editingExpense.expenseCode || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, expenseCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={editingExpense.description || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingExpense.amount || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={editingExpense.date ? new Date(editingExpense.date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Update
                </button>
                <button type="button" onClick={() => setEditingExpense(null)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Billing Edit Modal */}
      {editingBilling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Billing Record</h2>
              <button onClick={() => setEditingBilling(null)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateBilling} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={editingBilling.invoiceNumber || ''}
                  onChange={(e) => setEditingBilling({ ...editingBilling, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Billing Date</label>
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
                  value={editingBilling.tax || '0'}
                  onChange={(e) => {
                    const tax = e.target.value;
                    const amount = parseFloat(editingBilling.amount) || 0;
                    const total = amount - parseFloat(tax);
                    setEditingBilling({ ...editingBilling, tax, totalAmount: total.toString() });
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  placeholder="0.00"
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
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Calculated as: Amount - Tax</p>
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
                  placeholder="Additional description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={editingBilling.notes || ''}
                  onChange={(e) => setEditingBilling({ ...editingBilling, notes: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Update
                </button>
                <button type="button" onClick={() => setEditingBilling(null)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Billing Modal */}
      {showAddBillingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Billing Record</h2>
              <button onClick={() => setShowAddBillingModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateBilling} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Number *</label>
                <input
                  type="text"
                  value={newBilling.invoiceNumber}
                  onChange={(e) => setNewBilling({ ...newBilling, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
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
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date *</label>
                <input
                  type="date"
                  value={newBilling.dueDate}
                  onChange={(e) => setNewBilling({ ...newBilling, dueDate: e.target.value })}
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
                  value={newBilling.amount}
                  onChange={(e) => {
                    const amount = e.target.value;
                    const tax = parseFloat(newBilling.tax) || 0;
                    const total = parseFloat(amount) - tax;
                    setNewBilling({ ...newBilling, amount, totalAmount: total.toString() });
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
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
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
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
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  value={newBilling.status}
                  onChange={(e) => setNewBilling({ ...newBilling, status: e.target.value })}
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
                  value={newBilling.description}
                  onChange={(e) => setNewBilling({ ...newBilling, description: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  rows="3"
                  placeholder="Additional description..."
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  Add Billing
                </button>
                <button type="button" onClick={() => setShowAddBillingModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Collection Modal */}
      {showAddCollectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Collection Record</h2>
              <button onClick={() => setShowAddCollectionModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Billing Record *</label>
                <select
                  value={newCollection.billingId}
                  onChange={(e) => setNewCollection({ ...newCollection, billingId: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                >
                  <option value="">Select a billing record</option>
                  {billings.map((bill) => (
                    <option key={bill._id} value={bill._id}>
                      {bill.invoiceNumber} - {formatCurrency(bill.totalAmount)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Collection Number *</label>
                <input
                  type="text"
                  value={newCollection.collectionNumber}
                  onChange={(e) => setNewCollection({ ...newCollection, collectionNumber: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
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
                  value={newCollection.amount}
                  onChange={(e) => setNewCollection({ ...newCollection, amount: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method *</label>
                <select
                  value={newCollection.paymentMethod}
                  onChange={(e) => setNewCollection({ ...newCollection, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="bank_transfer">Bank Transfer</option>
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
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                    placeholder="Check number"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  value={newCollection.status}
                  onChange={(e) => setNewCollection({ ...newCollection, status: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  required
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="uncollectible">Uncollectible</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={newCollection.notes}
                  onChange={(e) => setNewCollection({ ...newCollection, notes: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold">
                  Add Collection
                </button>
                <button type="button" onClick={() => setShowAddCollectionModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collection Edit Modal */}
      {editingCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Collection Record</h2>
              <button onClick={() => setEditingCollection(null)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateCollection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Collection Number</label>
                <input
                  type="text"
                  value={editingCollection.collectionNumber || ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, collectionNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Collection Date</label>
                <input
                  type="date"
                  value={editingCollection.collectionDate ? new Date(editingCollection.collectionDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, collectionDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingCollection.amount || ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select
                  value={editingCollection.paymentMethod || 'cash'}
                  onChange={(e) => setEditingCollection({ ...editingCollection, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="online_payment">Online Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editingCollection.status || 'unpaid'}
                  onChange={(e) => setEditingCollection({ ...editingCollection, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="uncollectible">Uncollectible</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Update
                </button>
                <button type="button" onClick={() => setEditingCollection(null)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
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

export default ProjectDetails;

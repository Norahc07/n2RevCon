import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, revenueAPI, expenseAPI, billingAPI, collectionAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';
import { PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
  
  // Edit modal states
  const [editingRevenue, setEditingRevenue] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingBilling, setEditingBilling] = useState(null);
  const [editingCollection, setEditingCollection] = useState(null);
  
  // Add modal states
  const [showAddRevenueModal, setShowAddRevenueModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
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
    category: 'operational',
    status: 'recorded',
    notes: ''
  });

  useEffect(() => {
    fetchProject();
    if (activeTab === 'revenue') fetchRevenues();
    if (activeTab === 'expenses') fetchExpenses();
    if (activeTab === 'billing') {
      fetchBillings();
      fetchCollections();
    }
  }, [id, activeTab]);

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
      await billingAPI.update(editingBilling._id, {
        invoiceNumber: editingBilling.invoiceNumber,
        billingDate: editingBilling.billingDate,
        dueDate: editingBilling.dueDate,
        totalAmount: parseFloat(editingBilling.totalAmount),
        status: editingBilling.status,
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
        category: 'operational',
        status: 'recorded',
        notes: ''
      });
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create expense record');
    }
  };

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'revenue', label: 'Revenue & Expenses' },
    { id: 'billing', label: 'Billing & Collections' },
  ];

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
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          <span className="text-sm text-gray-600">Budget</span>
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
              <div 
                className="card cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setShowAddRevenueModal(true)}
                title="Click to add revenue"
              >
                <h3 className="text-sm text-gray-600 mb-1">Total Revenue</h3>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">Click to add revenue</p>
              </div>
              <div 
                className="card cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setShowAddExpenseModal(true)}
                title="Click to add expense"
              >
                <h3 className="text-sm text-gray-600 mb-1">Total Expenses</h3>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                <p className="text-xs text-gray-500 mt-1">Click to add expense</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Revenue Records</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left p-2">Code</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenues.map((rev) => (
                      <tr key={rev._id} className="border-b">
                        <td className="p-2">{rev.revenueCode}</td>
                        <td className="p-2">{rev.description}</td>
                        <td className="p-2">{formatCurrency(rev.amount)}</td>
                        <td className="p-2">{new Date(rev.date).toLocaleDateString()}</td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingRevenue({ ...rev })}
                              className="text-blue-600 hover:text-blue-700"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRevenue(rev._id)}
                              className="text-red-600 hover:text-red-700"
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
            <div>
              <h3 className="font-semibold mb-4">Expense Records</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left p-2">Code</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp) => (
                      <tr key={exp._id} className="border-b">
                        <td className="p-2">{exp.expenseCode}</td>
                        <td className="p-2">{exp.description}</td>
                        <td className="p-2">{formatCurrency(exp.amount)}</td>
                        <td className="p-2">{new Date(exp.date).toLocaleDateString()}</td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingExpense({ ...exp })}
                              className="text-blue-600 hover:text-blue-700"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(exp._id)}
                              className="text-red-600 hover:text-red-700"
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
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Billing Records</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left p-2">Invoice #</th>
                      <th className="text-left p-2">Billing Date</th>
                      <th className="text-left p-2">Due Date</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billings.map((bill) => (
                      <tr key={bill._id} className="border-b">
                        <td className="p-2">{bill.invoiceNumber}</td>
                        <td className="p-2">{new Date(bill.billingDate).toLocaleDateString()}</td>
                        <td className="p-2">{new Date(bill.dueDate).toLocaleDateString()}</td>
                        <td className="p-2">{formatCurrency(bill.totalAmount)}</td>
                        <td className="p-2 capitalize">{bill.status}</td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingBilling({ ...bill })}
                              className="text-blue-600 hover:text-blue-700"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBilling(bill._id)}
                              className="text-red-600 hover:text-red-700"
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
            <div>
              <h3 className="font-semibold mb-4">Collection Records</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left p-2">Collection #</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Method</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collections.map((col) => (
                      <tr key={col._id} className="border-b">
                        <td className="p-2">{col.collectionNumber}</td>
                        <td className="p-2">{new Date(col.collectionDate).toLocaleDateString()}</td>
                        <td className="p-2">{formatCurrency(col.amount)}</td>
                        <td className="p-2 capitalize">{col.paymentMethod?.replace('_', ' ') || 'N/A'}</td>
                        <td className="p-2 capitalize">{col.status}</td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingCollection({ ...col })}
                              className="text-blue-600 hover:text-blue-700"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCollection(col._id)}
                              className="text-red-600 hover:text-red-700"
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
                  <option value="operational">Operational</option>
                  <option value="material">Material</option>
                  <option value="labor">Labor</option>
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
                  <option value="recorded">Recorded</option>
                  <option value="confirmed">Confirmed</option>
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
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Billing Date</label>
                <input
                  type="date"
                  value={editingBilling.billingDate ? new Date(editingBilling.billingDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingBilling({ ...editingBilling, billingDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={editingBilling.dueDate ? new Date(editingBilling.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingBilling({ ...editingBilling, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingBilling.totalAmount || ''}
                  onChange={(e) => setEditingBilling({ ...editingBilling, totalAmount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editingBilling.status || 'draft'}
                  onChange={(e) => setEditingBilling({ ...editingBilling, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                </select>
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

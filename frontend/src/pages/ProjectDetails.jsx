import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, revenueAPI, expenseAPI, billingAPI, collectionAPI } from '../services/api';
import toast from 'react-hot-toast';

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

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'revenue', label: 'Revenue & Costs' },
    { id: 'billing', label: 'Billing & Collections' },
  ];

  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

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
          <p className="font-semibold">${project.budget.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="card">
                <h3 className="text-sm text-gray-600 mb-1">Total Expenses</h3>
                <p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
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
                    </tr>
                  </thead>
                  <tbody>
                    {revenues.map((rev) => (
                      <tr key={rev._id} className="border-b">
                        <td className="p-2">{rev.revenueCode}</td>
                        <td className="p-2">{rev.description}</td>
                        <td className="p-2">${rev.amount.toLocaleString()}</td>
                        <td className="p-2">{new Date(rev.date).toLocaleDateString()}</td>
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
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp) => (
                      <tr key={exp._id} className="border-b">
                        <td className="p-2">{exp.expenseCode}</td>
                        <td className="p-2">{exp.description}</td>
                        <td className="p-2">${exp.amount.toLocaleString()}</td>
                        <td className="p-2">{new Date(exp.date).toLocaleDateString()}</td>
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
                    </tr>
                  </thead>
                  <tbody>
                    {billings.map((bill) => (
                      <tr key={bill._id} className="border-b">
                        <td className="p-2">{bill.invoiceNumber}</td>
                        <td className="p-2">{new Date(bill.billingDate).toLocaleDateString()}</td>
                        <td className="p-2">{new Date(bill.dueDate).toLocaleDateString()}</td>
                        <td className="p-2">${bill.totalAmount.toLocaleString()}</td>
                        <td className="p-2 capitalize">{bill.status}</td>
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
                    </tr>
                  </thead>
                  <tbody>
                    {collections.map((col) => (
                      <tr key={col._id} className="border-b">
                        <td className="p-2">{col.collectionNumber}</td>
                        <td className="p-2">{new Date(col.collectionDate).toLocaleDateString()}</td>
                        <td className="p-2">${col.amount.toLocaleString()}</td>
                        <td className="p-2 capitalize">{col.paymentMethod.replace('_', ' ')}</td>
                        <td className="p-2 capitalize">{col.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;


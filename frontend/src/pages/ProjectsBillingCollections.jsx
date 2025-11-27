import { useState, useEffect } from 'react';
import { projectAPI, billingAPI, collectionAPI } from '../services/api';
import { formatCurrency } from '../utils/currency';
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
  const [selectedProject, setSelectedProject] = useState('');
  const [billings, setBillings] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchBillingAndCollections();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getAll();
      setProjects(response.data.projects || []);
      if (response.data.projects && response.data.projects.length > 0) {
        setSelectedProject(response.data.projects[0]._id);
      }
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingAndCollections = async () => {
    try {
      const [billingRes, collectionRes] = await Promise.all([
        billingAPI.getAll({ projectId: selectedProject }),
        collectionAPI.getAll({ projectId: selectedProject })
      ]);
      setBillings(billingRes.data.billing || []);
      setCollections(collectionRes.data.collections || []);
    } catch (error) {
      toast.error('Failed to load billing and collections data');
    }
  };

  // Prepare chart data
  const billingStatusData = [
    { name: 'Billed', value: billings.filter(b => b.status === 'sent' || b.status === 'paid').length },
    { name: 'Unbilled', value: billings.filter(b => b.status === 'draft').length },
  ].filter(item => item.value > 0);

  const collectionStatusData = [
    { name: 'Paid', value: collections.filter(c => c.status === 'paid').length },
    { name: 'Unpaid', value: collections.filter(c => c.status === 'unpaid').length },
    { name: 'Uncollectible', value: collections.filter(c => c.status === 'uncollectible').length },
  ].filter(item => item.value > 0);

  const totalBilled = billings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalCollected = collections.reduce((sum, c) => sum + (c.amount || 0), 0);
  const outstanding = totalBilled - totalCollected;

  const COLORS = ['#DC2626', '#EF4444', '#F87171', '#FCA5A5'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Billings & Collections</h1>
      </div>

      {projects.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No projects found</p>
        </div>
      ) : (
        <>
          <div className="card">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
            >
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.projectName} ({project.projectCode})
                </option>
              ))}
            </select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Billed</h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalBilled)}
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Collected</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalCollected)}
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Outstanding</h3>
              <p className={`text-2xl font-bold ${outstanding >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(outstanding)}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Billing Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={billingStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {billingStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Collection Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={collectionStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#DC2626" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectsBillingCollections;


import { useState, useEffect } from 'react';
import { projectAPI, revenueAPI, expenseAPI } from '../services/api';
import {
  LineChart,
  Line,
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
  const [selectedProject, setSelectedProject] = useState('');
  const [revenues, setRevenues] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchRevenueAndCosts();
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

  const fetchRevenueAndCosts = async () => {
    try {
      const [revenueRes, expenseRes] = await Promise.all([
        revenueAPI.getAll({ projectId: selectedProject }),
        expenseAPI.getAll({ projectId: selectedProject })
      ]);
      setRevenues(revenueRes.data.revenue || []);
      setExpenses(expenseRes.data.expenses || []);
    } catch (error) {
      toast.error('Failed to load revenue and costs data');
    }
  };

  // Prepare chart data
  const chartData = revenues.map((rev, index) => ({
    name: `Period ${index + 1}`,
    Revenue: rev.amount || 0,
    Costs: expenses[index]?.amount || 0,
  }));

  const totalRevenue = revenues.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalCosts = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalCosts;

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
        <h1 className="text-3xl font-bold text-gray-800">Revenue Vs. Costs</h1>
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
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Revenue</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Costs</h3>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalCosts)}
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Net Profit</h3>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Revenue vs Costs (Line Chart)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Costs"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={{ fill: '#EF4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Revenue vs Costs (Bar Chart)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="Revenue" fill="#10B981" />
                  <Bar dataKey="Costs" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectsRevenueCosts;


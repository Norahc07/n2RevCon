import { useState, useEffect, useMemo } from 'react';
import { projectAPI, revenueAPI, expenseAPI } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { CalendarIcon } from '@heroicons/react/24/outline';
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
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
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

  // Filter projects by year and month
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (filterYear) {
      const yearNum = parseInt(filterYear);
      filtered = filtered.filter((project) => {
        const startYear = new Date(project.startDate).getFullYear();
        const endYear = new Date(project.endDate).getFullYear();
        const startMonth = new Date(project.startDate).getMonth() + 1;
        const endMonth = new Date(project.endDate).getMonth() + 1;
        
        // Check if project spans the selected year
        const spansYear = startYear <= yearNum && endYear >= yearNum;
        
        if (!spansYear) return false;
        
        // If month is selected, check if project is active in that month
        if (filterMonth) {
          const monthNum = parseInt(filterMonth);
          // Project is active in the month if:
          // - It starts before or during the month in the selected year
          // - It ends after or during the month in the selected year
          if (startYear === yearNum && startMonth > monthNum) return false;
          if (endYear === yearNum && endMonth < monthNum) return false;
        }
        
        return true;
      });
    }

    return filtered;
  }, [projects, filterYear, filterMonth]);

  // Update selected project when filters change
  useEffect(() => {
    if (filteredProjects.length > 0) {
      // If current selected project is not in filtered list, select first filtered project
      if (!filteredProjects.find(p => p._id === selectedProject)) {
        setSelectedProject(filteredProjects[0]._id);
      }
    } else if (filteredProjects.length === 0 && selectedProject) {
      setSelectedProject('');
    }
  }, [filteredProjects, selectedProject]);

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
          <div className="card space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Filter by Year
                </label>
                <select
                  value={filterYear}
                  onChange={(e) => {
                    setFilterYear(e.target.value);
                    setFilterMonth(''); // Reset month when year changes
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
                >
                  <option value="">All Years</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Filter by Month
                </label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  disabled={!filterYear}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Project
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
                >
                  {filteredProjects.length === 0 ? (
                    <option value="">No projects found</option>
                  ) : (
                    filteredProjects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.projectName} ({project.projectCode})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            {(filterYear || filterMonth) && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredProjects.length}</span> of{' '}
                  <span className="font-semibold text-gray-900">{projects.length}</span> projects
                  {filterYear && ` in ${filterYear}`}
                  {filterMonth && ` - ${new Date(2000, parseInt(filterMonth) - 1).toLocaleString('default', { month: 'long' })}`}
                </p>
                <button
                  onClick={() => {
                    setFilterYear('');
                    setFilterMonth('');
                  }}
                  className="text-sm text-primary hover:text-red-700 font-medium transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            )}
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


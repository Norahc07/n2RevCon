import { useState, useEffect, useMemo } from 'react';
import { projectAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';
import {
  CalendarIcon,
  PlusIcon,
  EyeIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { exportAPI } from '../services/api';

const ProjectsDescription = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('');
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getAll();
      setProjects(response.data.projects || []);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Filter projects by year
  const filteredProjects = useMemo(() => {
    if (!year || year === '') return projects;
    
    const yearNum = parseInt(year);
    return projects.filter((project) => {
      const startYear = new Date(project.startDate).getFullYear();
      const endYear = new Date(project.endDate).getFullYear();
      return startYear === yearNum || endYear === yearNum || (startYear <= yearNum && endYear >= yearNum);
    });
  }, [projects, year]);

  // Get status badge styling
  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      ongoing: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  import { formatCurrency } from '../utils/currency';

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

  // Handle Excel export
  const handleExport = async () => {
    try {
      setExporting(true);
      const params = year && year !== '' ? { year: parseInt(year) } : {};
      const response = await exportAPI.exportProjects(params);
      
      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const filename = year 
        ? `projects_${year}_${Date.now()}.xlsx`
        : `projects_all_${Date.now()}.xlsx`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Projects exported successfully!');
    } catch (error) {
      toast.error('Failed to export projects');
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Title, Year Filter, and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <BuildingOfficeIcon className="w-8 h-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-800">Projects Description</h1>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          {/* Year Filter */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <CalendarIcon className="w-5 h-5 text-gray-600" />
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600 transition-colors duration-200 bg-white"
            >
              <option value="">All Years</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting || filteredProjects.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                <span className="hidden sm:inline">Exporting...</span>
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Export to Excel</span>
                <span className="sm:hidden">Export</span>
              </>
            )}
          </button>

          {/* Add Project Button */}
          <Link
            to="/projects/new"
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Add Project</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </div>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
        <div className="card text-center py-12">
          <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2 text-lg font-medium">
            {year ? `No projects found for ${year}` : 'No projects found'}
          </p>
          <p className="text-gray-400 mb-4 text-sm">
            {year ? 'Try selecting a different year or add a new project' : 'Create your first project to get started'}
          </p>
          <Link
            to="/projects/new"
            className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
          >
            <PlusIcon className="w-5 h-5" />
            Create New Project
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">Project Code</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Project Name</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Client</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Location</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Budget</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Start Date</th>
                  <th className="text-left p-4 font-semibold text-gray-700">End Date</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProjects.map((project, index) => (
                  <tr
                    key={project._id}
                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => navigate(`/projects/${project._id}`)}
                  >
                    <td className="p-4">
                      <span className="font-medium text-gray-900">{project.projectCode}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{project.projectName}</span>
                        {project.description && (
                          <span className="text-sm text-gray-500 line-clamp-1 mt-1">
                            {project.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-700">{project.clientName || 'N/A'}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{project.location || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                          project.status
                        )}`}
                      >
                        {project.status?.charAt(0).toUpperCase() + project.status?.slice(1) || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-gray-700">
                        <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{formatCurrency(project.budget || 0)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-600 text-sm">
                        {new Date(project.startDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-600 text-sm">
                        {new Date(project.endDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${project._id}`);
                        }}
                        className="flex items-center gap-1 text-primary hover:text-red-700 font-medium transition-colors duration-200"
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span className="hidden lg:inline">View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Summary */}
          <div className="bg-gray-50 border-t-2 border-gray-200 px-4 py-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-600">
              <span>
                Showing <span className="font-semibold text-gray-900">{filteredProjects.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{projects.length}</span> projects
                {year && ` for ${year}`}
              </span>
              {year && (
                <button
                  onClick={() => setYear('')}
                  className="text-primary hover:text-red-700 font-medium transition-colors duration-200"
                >
                  Clear Year Filter
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsDescription;


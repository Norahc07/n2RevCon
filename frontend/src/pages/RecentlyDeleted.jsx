import { useState, useEffect } from 'react';
import { projectAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';
import { usePermissions } from '../hooks/usePermissions';
import {
  TrashIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const RecentlyDeleted = () => {
  const [deletedProjects, setDeletedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);
  const [permanentlyDeleting, setPermanentlyDeleting] = useState(null);
  const navigate = useNavigate();
  const { canDeleteProject } = usePermissions();

  useEffect(() => {
    fetchDeletedProjects();
  }, []);

  const fetchDeletedProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getDeleted();
      setDeletedProjects(response.data.projects || []);
    } catch (error) {
      toast.error('Failed to load deleted projects');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to restore "${projectName}"?`)) {
      return;
    }

    try {
      setRestoring(projectId);
      await projectAPI.restore(projectId);
      toast.success('Project restored successfully');
      fetchDeletedProjects();
    } catch (error) {
      toast.error('Failed to restore project');
    } finally {
      setRestoring(null);
    }
  };

  const handlePermanentDelete = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${projectName}"? This action cannot be undone and all associated data will be lost.`)) {
      return;
    }

    try {
      setPermanentlyDeleting(projectId);
      await projectAPI.permanentDelete(projectId);
      toast.success('Project permanently deleted');
      fetchDeletedProjects();
    } catch (error) {
      toast.error('Failed to permanently delete project');
    } finally {
      setPermanentlyDeleting(null);
    }
  };

  const getDaysUntilPermanentDelete = (deletedAt) => {
    if (!deletedAt) return 0;
    const deletedDate = new Date(deletedAt);
    const now = new Date();
    const daysDiff = Math.ceil((30 * 24 * 60 * 60 * 1000 - (now - deletedDate)) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysDiff);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Recently Deleted</h1>
            <p className="text-sm text-gray-500 mt-1">Projects deleted in the last 30 days</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
        >
          <XMarkIcon className="w-5 h-5" />
          Back to Projects
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-800 mb-1">About Recently Deleted</h3>
            <p className="text-sm text-blue-700">
              Deleted projects are moved here and can be restored within 30 days. After 30 days, they will be automatically permanently deleted. You can also permanently delete them manually at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      {deletedProjects.length === 0 ? (
        <div className="card text-center py-12">
          <TrashIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2 text-lg font-medium">No deleted projects</p>
          <p className="text-gray-400 mb-4 text-sm">Deleted projects will appear here</p>
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
          >
            Go to Projects
          </button>
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
                  <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Budget</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Deleted Date</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Days Remaining</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deletedProjects.map((project) => {
                  const daysRemaining = getDaysUntilPermanentDelete(project.deletedAt);
                  return (
                    <tr key={project._id} className="hover:bg-gray-50 transition-colors duration-150">
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
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-800 border-gray-200 capitalize">
                          {project.status || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-gray-700">{formatCurrency(project.budget || 0)}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-600 text-sm">
                          {new Date(project.deletedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          daysRemaining <= 7 
                            ? 'bg-red-100 text-red-800' 
                            : daysRemaining <= 14 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/projects/${project._id}`)}
                            className="flex items-center gap-1 text-black hover:text-gray-700 font-medium transition-colors duration-200"
                            title="View"
                          >
                            <EyeIcon className="w-4 h-4" />
                            <span className="hidden lg:inline">View</span>
                          </button>
                          <button
                            onClick={() => handleRestore(project._id, project.projectName)}
                            disabled={restoring === project._id}
                            className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium transition-colors duration-200 disabled:opacity-50"
                            title="Restore"
                          >
                            {restoring === project._id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-600"></div>
                            ) : (
                              <ArrowPathIcon className="w-4 h-4" />
                            )}
                            <span className="hidden lg:inline">Restore</span>
                          </button>
                          {canDeleteProject && (
                            <button
                              onClick={() => handlePermanentDelete(project._id, project.projectName)}
                              disabled={permanentlyDeleting === project._id}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium transition-colors duration-200 disabled:opacity-50"
                              title="Permanently Delete"
                            >
                              {permanentlyDeleting === project._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                              ) : (
                                <TrashIcon className="w-4 h-4" />
                              )}
                              <span className="hidden lg:inline">Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-gray-50 border-t-2 border-gray-200 px-4 py-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-600">
              <span>
                Showing <span className="font-semibold text-gray-900">{deletedProjects.length}</span> deleted project(s)
              </span>
              <span className="text-xs text-gray-500">
                Projects will be automatically permanently deleted after 30 days
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentlyDeleted;


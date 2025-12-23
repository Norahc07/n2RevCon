import { useState, useEffect, useMemo } from 'react';
import { projectAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';
import { usePermissions } from '../hooks/usePermissions';
import PermissionWrapper from '../components/PermissionWrapper';
import { ACTIONS } from '../config/permissions';
import {
  CalendarIcon,
  PlusIcon,
  EyeIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { exportAPI } from '../services/api';
import { TableSkeleton, FilterSkeleton } from '../components/skeletons';

const ProjectsDescription = () => {
  const { canViewReports, canCloseLockProject } = usePermissions();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const [focusedYearDropdown, setFocusedYearDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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

  // Filter projects by year and search query
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filter by year
    if (year && year !== '') {
      const yearNum = parseInt(year);
      filtered = filtered.filter((project) => {
        const startYear = new Date(project.startDate).getFullYear();
        const endYear = new Date(project.endDate).getFullYear();
        return startYear === yearNum || endYear === yearNum || (startYear <= yearNum && endYear >= yearNum);
      });
    }

    // Filter by search query (project name, code, client name)
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((project) => {
        const projectName = (project.projectName || '').toLowerCase();
        const projectCode = (project.projectCode || '').toLowerCase();
        const clientName = (project.clientName || '').toLowerCase();
        return projectName.includes(query) || projectCode.includes(query) || clientName.includes(query);
      });
    }

    return filtered;
  }, [projects, year, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [year, searchQuery]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      fetchProjects();
    } catch (error) {
      toast.error('Failed to delete project');
      console.error('Delete error:', error);
    }
  };

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
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-9 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Filter Skeleton */}
        <FilterSkeleton />
        
        {/* Table Skeleton */}
        <div className="card p-6 shadow-md">
          <TableSkeleton rows={10} columns={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Title, Year Filter, and Add Button */}
      <div className="flex flex-col gap-3 xs:gap-4">
        {/* Title Row */}
        <div className="flex items-center justify-center sm:justify-start">
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">Projects Description</h1>
        </div>
        
        {/* Filters and Actions Row */}
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 xs:gap-3 w-full flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0 xs:min-w-[150px] sm:min-w-[200px]">
            <MagnifyingGlassIcon className="w-4 h-4 xs:w-5 xs:h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg pl-9 xs:pl-10 pr-3 xs:pr-4 py-2 text-sm xs:text-base focus:outline-none focus:border-red-600 transition-colors duration-200 bg-white"
            />
          </div>

          {/* Year Filter */}
          <div className="relative flex-1 xs:flex-initial xs:w-auto">
            <CalendarIcon className="w-4 h-4 xs:w-5 xs:h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10" />
            {focusedYearDropdown ? (
              <ChevronUpIcon className="w-4 h-4 xs:w-5 xs:h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 xs:w-5 xs:h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10" />
            )}
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              onFocus={() => setFocusedYearDropdown(true)}
              onBlur={() => setFocusedYearDropdown(false)}
              className="w-full border-2 border-gray-300 rounded-lg pl-9 xs:pl-10 pr-9 xs:pr-10 py-2 text-sm xs:text-base focus:outline-none focus:border-red-600 transition-colors duration-200 bg-white appearance-none cursor-pointer"
            >
              <option value="">All Years</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 w-full xs:w-auto">
            {/* Export Button - Requires VIEW_REPORTS permission */}
            {canViewReports && (
              <button
                onClick={handleExport}
                disabled={exporting || filteredProjects.length === 0}
                className="flex-1 xs:flex-initial flex items-center justify-center gap-1 xs:gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-3 xs:px-4 py-2 rounded-lg font-semibold text-sm xs:text-base transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 xs:h-5 xs:w-5 border-t-2 border-b-2 border-white"></div>
                  <span className="hidden xs:inline">Exporting...</span>
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-4 h-4 xs:w-5 xs:h-5" />
                  <span className="hidden sm:inline">Export to Excel</span>
                  <span className="xs:hidden sm:hidden">Export</span>
                </>
              )}
              </button>
            )}

            {/* Add Project Button - Requires VIEW_REPORTS permission */}
            {canViewReports && (
              <Link
                to="/projects/new"
                className="flex-1 xs:flex-initial flex items-center justify-center gap-1 xs:gap-2 bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-3 xs:px-4 py-2 rounded-lg font-semibold text-sm xs:text-base transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <PlusIcon className="w-4 h-4 xs:w-5 xs:h-5" />
                <span className="hidden sm:inline">Add Project</span>
                <span className="sm:hidden">Add</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Projects Table / Mobile Cards */}
      {filteredProjects.length === 0 ? (
        <div className="card text-center py-8 xs:py-12">
          <BuildingOfficeIcon className="w-12 h-12 xs:w-16 xs:h-16 text-gray-300 mx-auto mb-3 xs:mb-4" />
          <p className="text-gray-500 mb-2 text-base xs:text-lg font-medium">
            {year ? `No projects found for ${year}` : 'No projects found'}
          </p>
          <p className="text-gray-400 mb-4 text-xs xs:text-sm px-4">
            {year ? 'Try selecting a different year or add a new project' : 'Create your first project to get started'}
          </p>
          {canViewReports && (
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 text-primary hover:underline font-semibold text-sm xs:text-base"
            >
              <PlusIcon className="w-4 h-4 xs:w-5 xs:h-5" />
              Create New Project
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card View - Visible on small screens */}
          <div className="sm:hidden space-y-3">
            {paginatedProjects.map((project) => (
              <div
                key={project._id}
                className="mobile-data-card cursor-pointer active:bg-gray-50"
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-3 pb-3 border-b border-gray-200">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {project.projectCode}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                          project.status
                        )}`}
                      >
                        {project.status?.charAt(0).toUpperCase() + project.status?.slice(1) || 'N/A'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{project.projectName}</h3>
                  </div>
                </div>

                {/* Card Body - Data Rows */}
                <div className="space-y-2">
                  <div className="data-row">
                    <span className="data-label">Client</span>
                    <span className="data-value text-xs">{project.clientName || 'N/A'}</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Location</span>
                    <span className="data-value text-xs flex items-center gap-1">
                      <MapPinIcon className="w-3 h-3 text-gray-400" />
                      {project.location || 'N/A'}
                    </span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Transaction Price</span>
                    <span className="data-value text-xs text-green-600">
                      {formatCurrency(project.budget || 0)}
                    </span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Duration</span>
                    <span className="data-value text-xs">
                      {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      {' - '}
                      {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Card Footer - Actions */}
                <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${project._id}`);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 p-2 text-primary hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 text-xs font-medium"
                  >
                    <EyeIcon className="w-4 h-4" />
                    View
                  </button>
                  {canViewReports && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${project._id}/edit`);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 text-xs font-medium"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  {canCloseLockProject && (
                    <button
                      onClick={(e) => handleDelete(project._id, project.projectName, e)}
                      className="flex-1 flex items-center justify-center gap-1 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 text-xs font-medium"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Mobile Footer with Summary and Pagination */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2 space-y-2">
              <div className="flex flex-col items-center gap-2 text-xs text-gray-600">
                <span className="text-center">
                  Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredProjects.length)}</span> of{' '}
                  <span className="font-semibold text-gray-900">{filteredProjects.length}</span> projects
                  {year && ` for ${year}`}
                </span>
                {(year || searchQuery) && (
                  <button
                    onClick={() => {
                      setYear('');
                      setSearchQuery('');
                    }}
                    className="text-primary hover:text-red-700 font-medium transition-colors duration-200"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-red-600 text-white'
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
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Table View - Hidden on small screens */}
          <div className="hidden sm:block card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left p-3 sm:p-4 font-semibold text-gray-700 text-sm">Project Code</th>
                    <th className="text-left p-3 sm:p-4 font-semibold text-gray-700 text-sm">Project Name</th>
                    <th className="text-left p-3 sm:p-4 font-semibold text-gray-700 text-sm">Client</th>
                    <th className="text-left p-3 sm:p-4 font-semibold text-gray-700 text-sm hidden md:table-cell">Location</th>
                    <th className="text-left p-3 sm:p-4 font-semibold text-gray-700 text-sm">Status</th>
                    <th className="text-left p-3 sm:p-4 font-semibold text-gray-700 text-sm hidden lg:table-cell">Transaction Price</th>
                    <th className="text-left p-3 sm:p-4 font-semibold text-gray-700 text-sm hidden lg:table-cell">Start Date</th>
                    <th className="text-left p-3 sm:p-4 font-semibold text-gray-700 text-sm hidden lg:table-cell">End Date</th>
                    <th className="text-left p-3 sm:p-4 font-semibold text-gray-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedProjects.map((project, index) => (
                    <tr
                      key={project._id}
                      className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                      onClick={() => navigate(`/projects/${project._id}`)}
                    >
                      <td className="p-3 sm:p-4">
                        <span className="font-medium text-gray-900 text-sm">{project.projectCode}</span>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 text-sm">{project.projectName}</span>
                          {project.description && (
                            <span className="text-xs text-gray-500 line-clamp-1 mt-1">
                              {project.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <span className="text-gray-700 text-sm">{project.clientName || 'N/A'}</span>
                      </td>
                      <td className="p-3 sm:p-4 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">{project.location || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <span
                          className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                            project.status
                          )}`}
                        >
                          {project.status?.charAt(0).toUpperCase() + project.status?.slice(1) || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-gray-700">
                          <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-sm">{formatCurrency(project.budget || 0)}</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 hidden lg:table-cell">
                        <span className="text-gray-600 text-xs sm:text-sm">
                          {new Date(project.startDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 hidden lg:table-cell">
                        <span className="text-gray-600 text-xs sm:text-sm">
                          {new Date(project.endDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-1 sm:gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/projects/${project._id}`);
                            }}
                            className="p-1.5 sm:p-2 text-primary hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="View"
                          >
                            <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          {canViewReports && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/projects/${project._id}/edit`);
                              }}
                              className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          )}
                          {canCloseLockProject && (
                            <button
                              onClick={(e) => handleDelete(project._id, project.projectName, e)}
                              className="p-1.5 sm:p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Summary and Pagination */}
            <div className="bg-gray-50 border-t-2 border-gray-200 px-3 sm:px-4 py-2 sm:py-3 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs sm:text-sm text-gray-600">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <span className="text-center sm:text-left">
                    Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredProjects.length)}</span> of{' '}
                    <span className="font-semibold text-gray-900">{filteredProjects.length}</span> projects
                    {year && ` for ${year}`}
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
                
                {(year || searchQuery) && (
                  <button
                    onClick={() => {
                      setYear('');
                      setSearchQuery('');
                    }}
                    className="text-primary hover:text-red-700 font-medium transition-colors duration-200"
                  >
                    Clear Filters
                  </button>
                )}
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
        </>
      )}
    </div>
  );
};

export default ProjectsDescription;


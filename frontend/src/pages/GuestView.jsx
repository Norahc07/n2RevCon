import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guestAPI, dashboardAPI, projectAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  ChartBarIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const GuestView = () => {
  const { type, token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [guestInfo, setGuestInfo] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      setLoading(true);
      const response = await guestAPI.verifyToken(token);
      setVerified(true);
      setGuestInfo(response.data.guestLink);
      
      // Store guest token for API calls (for client type only)
      if (type === 'client') {
        sessionStorage.setItem('guestToken', token);
        await loadClientData();
      } else {
        // For researcher view, show demo data (no actual data access)
        await loadDemoData();
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Invalid or inactive guest link');
      } else if (error.response?.status === 410) {
        toast.error('This guest link has expired');
      } else {
        toast.error('Failed to verify guest link');
      }
      setVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const loadClientData = async () => {
    try {
      // Load actual dashboard data using guest token
      const dashboardResponse = await dashboardAPI.getSummary();
      const dashboard = dashboardResponse.data;
      
      // Calculate summary from dashboard data
      const projectStatus = dashboard.projectStatus || {};
      const totals = dashboard.totals || {};
      const totalProjects = Object.values(projectStatus).reduce((sum, count) => sum + (count || 0), 0);
      
      setDashboardData({
        summary: {
          totalProjects: totalProjects,
          activeProjects: (projectStatus.ongoing || 0) + (projectStatus.pending || 0),
          completedProjects: projectStatus.completed || 0,
          totalRevenue: totals.revenue || 0,
          totalExpenses: totals.expenses || 0,
          netIncome: (totals.revenue || 0) - (totals.expenses || 0)
        },
        projectStatusChart: projectStatus,
        paymentStatusChart: dashboard.paymentStatus || {}
      });

      // Load actual projects (limited view)
      const projectsResponse = await projectAPI.getAll({ limit: 20 });
      setProjects(projectsResponse.data.projects || []);
    } catch (error) {
      console.error('Error loading client data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Access denied. Please check your guest link.');
      } else {
        toast.error('Failed to load data. Please try again.');
      }
      // Fallback to empty state
      setDashboardData({
        summary: {
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          netIncome: 0
        }
      });
      setProjects([]);
    }
  };

  const loadDemoData = async () => {
    // Demo data for researchers - no actual company data
    setDashboardData({
      summary: {
        totalProjects: 5,
        activeProjects: 3,
        completedProjects: 2,
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0
      },
      projectStatusChart: {
        pending: 1,
        ongoing: 2,
        completed: 2
      },
      paymentStatusChart: {
        paid: 2,
        unpaid: 1,
        partial: 1
      }
    });

    // Demo projects
    setProjects([
      {
        _id: 'demo1',
        projectId: 'DEMO-2025-01-15-001',
        projectName: 'Sample Project 1',
        status: 'ongoing',
        startDate: '2025-01-01',
        endDate: '2025-06-30',
        description: 'This is a demo project for demonstration purposes only.'
      },
      {
        _id: 'demo2',
        projectId: 'DEMO-2025-01-16-002',
        projectName: 'Sample Project 2',
        status: 'completed',
        startDate: '2024-07-01',
        endDate: '2024-12-31',
        description: 'This is another demo project showing completed status.'
      }
    ]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Verifying guest access...</p>
        </div>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            This guest link is invalid, expired, or has been deactivated.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">N2 RevCon System</h1>
              <p className="text-sm text-gray-500 mt-1">
                {type === 'researcher' 
                  ? 'Demo View - For Research Purposes Only' 
                  : 'Guest View - View Only Access'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{guestInfo?.name}</p>
              {guestInfo?.description && (
                <p className="text-xs text-gray-500">{guestInfo.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      {type === 'researcher' && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Demo Mode:</strong> This is a demonstration view with sample data only. 
                  No actual company information is displayed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Summary */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {dashboardData.summary?.totalProjects || 0}
                  </p>
                </div>
                <DocumentTextIcon className="w-10 h-10 text-red-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {dashboardData.summary?.activeProjects || 0}
                  </p>
                </div>
                <ChartBarIcon className="w-10 h-10 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed Projects</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {dashboardData.summary?.completedProjects || 0}
                  </p>
                </div>
                <BanknotesIcon className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Net Income</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {type === 'researcher' 
                      ? 'Demo' 
                      : `₱${(dashboardData.summary?.netIncome || 0).toLocaleString()}`}
                  </p>
                </div>
                <ChartBarIcon className="w-10 h-10 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Projects List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Projects</h2>
            <p className="text-sm text-gray-500 mt-1">
              {type === 'researcher' 
                ? 'Sample projects for demonstration purposes' 
                : 'View-only access to project information'}
            </p>
          </div>
          <div className="p-6">
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No projects available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project._id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">{project.projectName}</h3>
                        <p className="text-sm text-gray-500 mt-1">{project.projectId}</p>
                        {project.description && (
                          <p className="text-sm text-gray-600 mt-2">{project.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            project.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : project.status === 'ongoing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Notice */}
        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <p className="text-sm text-yellow-800">
            <strong>View Only Access (Viewer Role):</strong> Parehong researchers at clients ay may viewer role na may view-only permissions. 
            {type === 'researcher' 
              ? ' Ang data na makikita ay sample/demo data lang para sa research purposes at hindi actual company information.'
              : ' Ang data na makikita ay actual system data pero view-only lang - hindi pwedeng mag-edit, mag-add, o mag-delete.'}
          </p>
        </div>
        
      </div>
    </div>
  );
};

export default GuestView;


import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  FolderIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BanknotesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onClose, onToggle }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [projectsOpen, setProjectsOpen] = useState(false);

  // Check if current path is under projects
  const isProjectsActive = location.pathname.startsWith('/projects');

  // Projects subcategories with icons
  const projectsSubcategories = [
    { path: '/projects', label: 'Description', icon: DocumentTextIcon },
    { path: '/projects/revenue-costs', label: 'Revenue Vs. Costs', icon: ChartBarIcon },
    { path: '/projects/billing-collections', label: 'Billings & Collections', icon: BanknotesIcon },
    { path: '/projects/deleted', label: 'Recently Deleted', icon: TrashIcon },
  ];

  // Handle navigation with sidebar expansion
  const handleNavClick = (path, e) => {
    // If sidebar is collapsed, expand it first
    if (!isOpen && onToggle) {
      onToggle();
    }
    // Navigation will happen via NavLink
  };

  // Handle Projects button click
  const handleProjectsClick = () => {
    // If sidebar is collapsed, expand it first
    if (!isOpen && onToggle) {
      onToggle();
      // Wait for sidebar to expand, then open dropdown
      setTimeout(() => {
        setProjectsOpen(true);
      }, 300);
    } else if (isOpen) {
      // If already expanded, just toggle dropdown
      setProjectsOpen(!projectsOpen);
    }
  };

  // Handle subcategory click
  const handleSubcategoryClick = (path) => {
    // If sidebar is collapsed, expand it first
    if (!isOpen && onToggle) {
      onToggle();
    }
    navigate(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop Sidebar - Only menu items expand, behind navbar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-screen bg-white border-r-2 border-gray-200 transition-all duration-300 ease-in-out ${
          isOpen ? 'w-64' : 'w-20'
        } hidden lg:block`}
      >
        <div className="h-full flex flex-col">
          {/* Spacer to align sidebar icons with navbar burger icon - matches navbar height */}
          <div className="pt-16">
            {/* Empty space to align sidebar icons with navbar burger icon */}
          </div>

          {/* Navigation - Icons stay in fixed positions */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {/* Dashboard */}
            <NavLink
              to="/dashboard"
              onClick={(e) => handleNavClick('/dashboard', e)}
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                } ${!isOpen ? 'justify-center' : 'gap-3'}`}
              title={!isOpen ? 'Dashboard' : ''}
            >
              <HomeIcon className="w-6 h-6 flex-shrink-0" style={{ minWidth: '24px' }} />
              {isOpen && <span className="font-medium whitespace-nowrap">Dashboard</span>}
            </NavLink>

            {/* Projects with Dropdown */}
            <div className="space-y-1">
              <button
                onClick={handleProjectsClick}
                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                  isProjectsActive
                    ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                } ${!isOpen ? 'justify-center' : 'gap-3'}`}
                title={!isOpen ? 'Projects' : ''}
              >
                <FolderIcon className="w-6 h-6 flex-shrink-0" style={{ minWidth: '24px' }} />
                {isOpen && (
                  <>
                    <span className="font-medium flex-1 text-left whitespace-nowrap">Projects</span>
                    {projectsOpen ? (
                      <ChevronDownIcon className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 flex-shrink-0" />
                    )}
                  </>
                )}
              </button>

              {/* Projects Subcategories Dropdown */}
              {isOpen && projectsOpen && (
                <div className="ml-4 space-y-1 animate-fade-in">
                  {projectsSubcategories.map((sub) => {
                    const IconComponent = sub.icon;
                    return (
                      <button
                        key={sub.path}
                        onClick={() => handleSubcategoryClick(sub.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm text-left ${
                          location.pathname === sub.path
                            ? 'bg-red-50 text-red-600 font-semibold border-l-2 border-red-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <IconComponent className="w-4 h-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Settings */}
            <NavLink
              to="/settings/account"
              onClick={(e) => handleNavClick('/settings/account', e)}
              className={({ isActive }) => {
                const isSettingsActive = location.pathname.startsWith('/settings');
                return `flex items-center p-3 rounded-lg transition-all duration-200 ${
                  isSettingsActive
                    ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                } ${!isOpen ? 'justify-center' : 'gap-3'}`;
              }}
              title={!isOpen ? 'Settings' : ''}
            >
              <Cog6ToothIcon className="w-6 h-6 flex-shrink-0" style={{ minWidth: '24px' }} />
              {isOpen && <span className="font-medium whitespace-nowrap">Settings</span>}
            </NavLink>
          </nav>

          {/* User Info - Only show when expanded */}
              {isOpen && (
                <div className="p-4 border-t-2 border-gray-200">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                </div>
              )}
        </div>
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r-2 border-gray-200 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:hidden`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b-2 border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/n2RevConLogo.png" 
                alt="N2 RevCon Logo" 
                className="h-8 w-auto"
              />
              <h1 className="text-xl font-bold text-accent">N2 RevCon</h1>
            </div>
            <button onClick={onClose} className="lg:hidden">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {/* Dashboard */}
            <NavLink
              to="/dashboard"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <HomeIcon className="w-6 h-6" />
              <span className="font-medium">Dashboard</span>
            </NavLink>

            {/* Projects with Dropdown */}
            <div className="space-y-1">
              <button
                onClick={() => setProjectsOpen(!projectsOpen)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  isProjectsActive
                    ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FolderIcon className="w-6 h-6" />
                <span className="font-medium flex-1 text-left">Projects</span>
                {projectsOpen ? (
                  <ChevronDownIcon className="w-5 h-5" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5" />
                )}
              </button>

              {/* Projects Subcategories Dropdown */}
              {projectsOpen && (
                <div className="ml-4 space-y-1">
                  {projectsSubcategories.map((sub) => {
                    const IconComponent = sub.icon;
                    return (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                            isActive
                              ? 'bg-red-50 text-red-600 font-semibold border-l-2 border-red-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`
                        }
                      >
                        <IconComponent className="w-4 h-4 flex-shrink-0" />
                        <span>{sub.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Settings */}
            <NavLink
              to="/settings/account"
              onClick={onClose}
              className={({ isActive }) => {
                const isSettingsActive = location.pathname.startsWith('/settings');
                return `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  isSettingsActive
                    ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`;
              }}
            >
              <Cog6ToothIcon className="w-6 h-6" />
              <span className="font-medium">Settings</span>
            </NavLink>
          </nav>

          <div className="p-4 border-t-2 border-gray-200">
            <div className="text-sm text-gray-600">
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

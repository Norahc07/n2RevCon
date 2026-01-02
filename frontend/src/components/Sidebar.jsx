import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { getRoleDisplayName } from '../config/permissions';
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
  UserIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  DevicePhoneMobileIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  BellIcon,
  CloudArrowDownIcon,
  ClipboardDocumentListIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onClose, onToggle }) => {
  const { user } = useAuth();
  const permissions = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [systemSettingsOpen, setSystemSettingsOpen] = useState(false);

  // Check if current path is under projects
  const isProjectsActive = location.pathname.startsWith('/projects');
  // Check if current path is under settings
  const isSettingsActive = location.pathname.startsWith('/settings');

  // Auto-open dropdowns when on their respective pages
  useEffect(() => {
    if (isProjectsActive && isOpen) {
      setProjectsOpen(true);
    }
    if (isSettingsActive && isOpen) {
      setSettingsOpen(true);
      // Auto-open account or system settings if on their pages
      if (location.pathname.startsWith('/settings/account')) {
        setAccountSettingsOpen(true);
      }
      if (location.pathname.startsWith('/settings/system')) {
        setSystemSettingsOpen(true);
      }
    }
  }, [isProjectsActive, isSettingsActive, isOpen, location.pathname]);

  // Projects subcategories with icons - filtered by permissions
  const projectsSubcategories = [
    { path: '/projects', label: 'Description', icon: DocumentTextIcon, requiredPermission: 'viewReports' },
    { path: '/projects/revenue-costs', label: 'Revenue vs. Expenses', icon: ChartBarIcon, requiredPermission: 'viewReports' },
    { path: '/projects/billing-collections', label: 'Billings & Collections', icon: BanknotesIcon, requiredPermission: 'viewReports' },
    { path: '/projects/deleted', label: 'Recently Deleted', icon: TrashIcon, requiredPermission: 'closeLockProject' },
  ].filter(sub => {
    if (sub.requiredPermission === 'viewReports') return permissions.canViewReports;
    if (sub.requiredPermission === 'closeLockProject') return permissions.canCloseLockProject;
    return true;
  });

  // Check if Projects menu should be shown (at least one subcategory is available)
  const shouldShowProjects = projectsSubcategories.length > 0;

  // Settings subcategories with nested structure - filtered by role
  const isMasterAdmin = permissions.role === 'master_admin';
  const isSystemAdmin = permissions.role === 'system_admin';
  
  const settingsSubcategories = [
    {
      path: '/settings/account',
      label: 'Account Settings',
      icon: UserIcon,
      // All users can access account settings
      show: true,
      subcategories: [
        { path: '/settings/account/profile', label: 'Profile', icon: UserIcon },
        { path: '/settings/account/password', label: 'Password & Security', icon: LockClosedIcon },
        { path: '/settings/account/sessions', label: 'Sessions', icon: DevicePhoneMobileIcon },
        { path: '/settings/account/status', label: 'Account Status', icon: ShieldCheckIcon },
      ],
    },
    {
      path: '/settings/system',
      label: 'System Settings',
      icon: ShieldCheckIcon,
      // Only Master Admin and System Admin can access system settings
      show: isMasterAdmin || isSystemAdmin,
      subcategories: [
        { path: '/settings/system/company', label: 'Company Information', icon: BuildingOfficeIcon, show: isMasterAdmin },
        { path: '/settings/system/users', label: 'User Management', icon: UserGroupIcon, show: isMasterAdmin || isSystemAdmin },
        { path: '/settings/system/project', label: 'Project Configuration', icon: Cog6ToothIcon, show: isMasterAdmin || isSystemAdmin },
        { path: '/settings/system/notifications', label: 'Notifications', icon: BellIcon, show: isMasterAdmin || isSystemAdmin },
        { path: '/settings/system/backup', label: 'Data & Backup', icon: CloudArrowDownIcon, show: isMasterAdmin },
        { path: '/settings/system/audit', label: 'Audit Logs', icon: ClipboardDocumentListIcon, show: isMasterAdmin || isSystemAdmin },
        { path: '/settings/system/pwa', label: 'PWA & Offline', icon: DevicePhoneMobileIcon, show: isMasterAdmin },
        { path: '/settings/system/guest', label: 'Guest Access', icon: LinkIcon, show: isMasterAdmin },
      ].filter(sub => sub.show !== false), // Filter out hidden subcategories
    },
  ].filter(category => category.show !== false); // Filter out hidden categories

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

  // Handle Settings button click
  const handleSettingsClick = () => {
    // If sidebar is collapsed, expand it first
    if (!isOpen && onToggle) {
      onToggle();
      // Wait for sidebar to expand, then open dropdown
      setTimeout(() => {
        setSettingsOpen(true);
      }, 300);
    } else if (isOpen) {
      // If already expanded, just toggle dropdown
      setSettingsOpen(!settingsOpen);
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

            {/* Projects with Dropdown - Only show if user has permission */}
            {shouldShowProjects && (
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
            )}

            {/* Settings with Dropdown */}
            <div className="space-y-1">
              <button
                onClick={handleSettingsClick}
                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                  isSettingsActive
                    ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                } ${!isOpen ? 'justify-center' : 'gap-3'}`}
                title={!isOpen ? 'Settings' : ''}
              >
                <Cog6ToothIcon className="w-6 h-6 flex-shrink-0" style={{ minWidth: '24px' }} />
                {isOpen && (
                  <>
                    <span className="font-medium flex-1 text-left whitespace-nowrap">Settings</span>
                    {settingsOpen ? (
                      <ChevronDownIcon className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 flex-shrink-0" />
                    )}
                  </>
                )}
              </button>

              {/* Settings Subcategories Dropdown */}
              {isOpen && settingsOpen && (
                <div className="ml-4 space-y-1 animate-fade-in">
                  {settingsSubcategories.map((category) => {
                    const CategoryIcon = category.icon;
                    const isAccountSettings = category.path === '/settings/account';
                    const isSystemSettings = category.path === '/settings/system';
                    const isCategoryActive = location.pathname.startsWith(category.path);
                    const isExpanded = isAccountSettings ? accountSettingsOpen : systemSettingsOpen;

                    return (
                      <div key={category.path} className="space-y-1">
                        <button
                          onClick={() => {
                            if (isAccountSettings) {
                              setAccountSettingsOpen(!accountSettingsOpen);
                            } else if (isSystemSettings) {
                              setSystemSettingsOpen(!systemSettingsOpen);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm text-left ${
                            isCategoryActive
                              ? 'bg-red-50 text-red-600 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <CategoryIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="flex-1 whitespace-nowrap">{category.label}</span>
                          {isExpanded ? (
                            <ChevronDownIcon className="w-3 h-3 flex-shrink-0" />
                          ) : (
                            <ChevronRightIcon className="w-3 h-3 flex-shrink-0" />
                          )}
                        </button>

                        {/* Nested subcategories */}
                        {isExpanded && category.subcategories && (
                          <div className="ml-4 space-y-1">
                            {category.subcategories.map((sub) => {
                              const SubIcon = sub.icon;
                              const isSubActive = location.pathname === sub.path;
                              return (
                                <button
                                  key={sub.path}
                                  onClick={() => handleSubcategoryClick(sub.path)}
                                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-xs text-left ${
                                    isSubActive
                                      ? 'bg-red-50 text-red-600 font-semibold border-l-2 border-red-600'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  }`}
                                >
                                  <SubIcon className="w-3 h-3 flex-shrink-0" />
                                  <span className="whitespace-nowrap">{sub.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* User Info - Only show when expanded */}
              {isOpen && (
                <div className="p-4 border-t-2 border-gray-200">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500">{getRoleDisplayName(user?.role)}</p>
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
                src="/N2RevConLogo.png?v=2" 
                alt="N2 RevCon Logo" 
                className="h-8 w-auto"
                onError={(e) => {
                  console.error('Failed to load logo in Sidebar:', e.target.src);
                  // Try alternative path
                  if (!e.target.src.includes('N2RevConLogo')) {
                    e.target.src = '/N2RevConLogo.png';
                  } else {
                    e.target.style.display = 'none';
                  }
                }}
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

            {/* Projects with Dropdown - Only show if user has permission */}
            {shouldShowProjects && (
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
            )}

            {/* Settings with Dropdown */}
            <div className="space-y-1">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  isSettingsActive
                    ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Cog6ToothIcon className="w-6 h-6" />
                <span className="font-medium flex-1 text-left">Settings</span>
                {settingsOpen ? (
                  <ChevronDownIcon className="w-5 h-5" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5" />
                )}
              </button>

              {/* Settings Subcategories Dropdown */}
              {settingsOpen && (
                <div className="ml-4 space-y-1">
                  {settingsSubcategories.map((category) => {
                    const CategoryIcon = category.icon;
                    const isAccountSettings = category.path === '/settings/account';
                    const isSystemSettings = category.path === '/settings/system';
                    const isCategoryActive = location.pathname.startsWith(category.path);
                    const isExpanded = isAccountSettings ? accountSettingsOpen : systemSettingsOpen;

                    return (
                      <div key={category.path} className="space-y-1">
                        <button
                          onClick={() => {
                            if (isAccountSettings) {
                              setAccountSettingsOpen(!accountSettingsOpen);
                            } else if (isSystemSettings) {
                              setSystemSettingsOpen(!systemSettingsOpen);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                            isCategoryActive
                              ? 'bg-red-50 text-red-600 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <CategoryIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="flex-1 text-left">{category.label}</span>
                          {isExpanded ? (
                            <ChevronDownIcon className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />
                          )}
                        </button>

                        {/* Nested subcategories */}
                        {isExpanded && category.subcategories && (
                          <div className="ml-4 space-y-1">
                            {category.subcategories.map((sub) => {
                              const SubIcon = sub.icon;
                              return (
                                <NavLink
                                  key={sub.path}
                                  to={sub.path}
                                  onClick={onClose}
                                  className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-xs ${
                                      isActive
                                        ? 'bg-red-50 text-red-600 font-semibold border-l-2 border-red-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`
                                  }
                                >
                                  <SubIcon className="w-3 h-3 flex-shrink-0" />
                                  <span>{sub.label}</span>
                                </NavLink>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          <div className="p-4 border-t-2 border-gray-200">
            <div className="text-sm text-gray-600">
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500">{getRoleDisplayName(user?.role)}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

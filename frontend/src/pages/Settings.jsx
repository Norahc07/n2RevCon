import { Link, Outlet, useLocation } from 'react-router-dom';
import { Cog6ToothIcon, UserIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const Settings = () => {
  const location = useLocation();

  const settingsTabs = [
    { path: '/settings/account', label: 'Account Settings', icon: UserIcon },
    { path: '/settings/system', label: 'System Settings', icon: ShieldCheckIcon },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Sidebar */}
        <div className="lg:col-span-1">
          <div className="card space-y-2">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="card">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;


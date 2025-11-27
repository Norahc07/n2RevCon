import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { companyAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  BellIcon,
  CloudArrowDownIcon,
  ClipboardDocumentListIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const SystemSettings = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Get active tab from route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/users')) return 'users';
    if (path.includes('/project')) return 'project';
    if (path.includes('/notifications')) return 'notifications';
    if (path.includes('/backup')) return 'backup';
    if (path.includes('/audit')) return 'audit';
    if (path.includes('/pwa')) return 'pwa';
    return 'company'; // default
  };
  
  const activeTab = getActiveTab();
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    fetchCompany();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getProfile();
      setCompany(response.data.company);
    } catch (error) {
      toast.error('Failed to load company settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await companyAPI.getAuditLogs({ limit: 200 });
      setAuditLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error(error.response?.data?.message || 'Failed to load audit logs');
    }
  };

  const handleSave = async (section, data) => {
    try {
      setSaving(true);
      const updateData = { [section]: data };
      const response = await companyAPI.updateProfile(updateData);
      setCompany(response.data.company);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      await companyAPI.createBackup();
      toast.success('Backup created successfully');
      fetchCompany();
    } catch (error) {
      toast.error('Failed to create backup');
    }
  };

  if (loading && !company) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div>
            <h1 className="text-3xl font-bold text-white">System Settings</h1>
            <p className="text-red-100 mt-1">Configure system-wide settings and preferences</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="card shadow-md">
            {/* Company Information */}
            {activeTab === 'company' && company && (
              <CompanyInformationTab company={company} onSave={handleSave} saving={saving} />
            )}

            {/* User Management */}
            {activeTab === 'users' && (
              <UserManagementTab users={users} onRefresh={fetchUsers} />
            )}

            {/* Project Configuration */}
            {activeTab === 'project' && company && (
              <ProjectConfigTab company={company} onSave={handleSave} saving={saving} />
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && company && (
              <NotificationConfigTab company={company} onSave={handleSave} saving={saving} />
            )}

            {/* Data & Backup */}
            {activeTab === 'backup' && company && (
              <BackupTab company={company} onSave={handleSave} onBackup={handleCreateBackup} saving={saving} />
            )}

            {/* Audit Logs */}
            {activeTab === 'audit' && (
              <AuditLogsTab logs={auditLogs} onRefresh={fetchAuditLogs} />
            )}

            {/* PWA & Offline */}
            {activeTab === 'pwa' && company && (
              <PWATab company={company} onSave={handleSave} saving={saving} />
            )}
          </div>
    </div>
  );
};

// Company Information Tab Component
const CompanyInformationTab = ({ company, onSave, saving }) => {
  const [formData, setFormData] = useState({
    companyName: company?.companyName || '',
    companyCode: company?.companyCode || '',
    logo: company?.logo || '',
    address: {
      street: company?.address?.street || '',
      city: company?.address?.city || '',
      state: company?.address?.state || '',
      zipCode: company?.address?.zipCode || '',
      country: company?.address?.country || '',
    },
    contact: {
      phone: company?.contact?.phone || '',
      email: company?.contact?.email || '',
      website: company?.contact?.website || '',
    },
    settings: {
      currency: company?.settings?.currency || 'PHP',
      dateFormat: company?.settings?.dateFormat || 'MM/DD/YYYY',
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave('company', formData);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Company Information</h2>
          <p className="text-sm text-gray-500">Manage your company details and contact information</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            required
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Company Code (for Project IDs)
          </label>
          <input
            type="text"
            value={formData.companyCode}
            onChange={(e) => setFormData({ ...formData, companyCode: e.target.value.toUpperCase() })}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
            placeholder="N2RC"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Company Logo URL
          </label>
          <input
            type="url"
            value={formData.logo}
            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value }
                })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, city: e.target.value }
                })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                value={formData.address.state}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, state: e.target.value }
                })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
              <input
                type="text"
                value={formData.address.zipCode}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, zipCode: e.target.value }
                })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input
                type="text"
                value={formData.address.country}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, country: e.target.value }
                })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.contact.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  contact: { ...formData.contact, phone: e.target.value }
                })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.contact.email}
                onChange={(e) => setFormData({
                  ...formData,
                  contact: { ...formData.contact, email: e.target.value }
                })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <input
                type="url"
                value={formData.contact.website}
                onChange={(e) => setFormData({
                  ...formData,
                  contact: { ...formData.contact, website: e.target.value }
                })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">System Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={formData.settings.currency}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, currency: e.target.value }
                })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
              >
                <option value="PHP">PHP (Philippine Peso)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
                <option value="JPY">JPY</option>
                <option value="CNY">CNY</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <select
                value={formData.settings.dateFormat}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, dateFormat: e.target.value }
                })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Company Information'}
        </button>
      </form>
    </div>
  );
};

// User Management Tab Component
const UserManagementTab = ({ users, onRefresh }) => {
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      isActive: user.isActive !== undefined ? user.isActive : true,
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData({
      firstName: '',
      lastName: '',
      email: '',
      isActive: true,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    try {
      setLoading(true);
      const userId = editingUser.id || editingUser._id;
      await userAPI.update(userId, {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        isActive: editFormData.isActive,
      });
      toast.success('User updated successfully');
      setEditingUser(null);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const userId = user.id || user._id;
      await userAPI.delete(userId);
      toast.success('User deleted successfully');
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      setLoading(true);
      const userId = user.id || user._id;
      await userAPI.update(userId, {
        isActive: !user.isActive,
      });
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'} successfully`);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 rounded-lg p-2">
            <UserGroupIcon className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
            <p className="text-sm text-gray-500">Manage system users and their permissions</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-semibold text-gray-700">Account Status</label>
                  <p className="text-sm text-gray-500">Activate or deactivate this user account</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Name</th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Email</th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Role</th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Status</th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id || user._id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">{user.email}</td>
                  <td className="border border-gray-300 px-4 py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {user.role}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {user.isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm flex items-center gap-1">
                        <CheckCircleIcon className="w-4 h-4" />
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm flex items-center gap-1">
                        <XMarkIcon className="w-4 h-4" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleEdit(user)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={loading}
                        className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Project Configuration Tab Component
const ProjectConfigTab = ({ company, onSave, saving }) => {
  const [config, setConfig] = useState(company?.projectConfig || {
    autoGenerateId: true,
    idFormat: 'CompanyCode-YYYY-MM-DD-Sequence',
    defaultStatus: 'pending',
    allowedStatuses: ['pending', 'ongoing', 'completed'],
    defaultYearFilter: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave('projectConfig', config);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
        <div className="bg-red-50 rounded-lg p-2">
          <Cog6ToothIcon className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Project Configuration</h2>
          <p className="text-sm text-gray-500">Configure project settings and defaults</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="font-semibold text-gray-700">Auto Generate Project ID</label>
            <p className="text-sm text-gray-500">Automatically generate project IDs when creating new projects</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.autoGenerateId}
              onChange={(e) => setConfig({ ...config, autoGenerateId: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Project ID Format
          </label>
          <input
            type="text"
            value={config.idFormat}
            onChange={(e) => setConfig({ ...config, idFormat: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
            placeholder="CompanyCode-YYYY-MM-DD-Sequence"
          />
          <p className="text-xs text-gray-500 mt-1">Example: N2RC-2025-01-15-001</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Default Project Status
          </label>
          <select
            value={config.defaultStatus}
            onChange={(e) => setConfig({ ...config, defaultStatus: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
          >
            <option value="pending">Pending</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="font-semibold text-gray-700">Default Year Filter</label>
            <p className="text-sm text-gray-500">Auto-select latest year in filters</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.defaultYearFilter}
              onChange={(e) => setConfig({ ...config, defaultYearFilter: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Project Configuration'}
        </button>
      </form>
    </div>
  );
};

// Notification Configuration Tab Component
const NotificationConfigTab = ({ company, onSave, saving }) => {
  // Helper function to convert old timing format to new format
  const convertTimingFormat = (oldTiming) => {
    if (!oldTiming) return { timingType: '3', customDays: null };
    
    // If it's the new format (has timingType), return as is
    if (oldTiming.timingType) {
      return {
        timingType: oldTiming.timingType || '3',
        customDays: oldTiming.customDays || null
      };
    }
    
    // Convert old format (daysBefore1, daysBefore2, daysBefore3) to new format
    if (oldTiming.daysBefore3) return { timingType: '3', customDays: null };
    if (oldTiming.daysBefore2) return { timingType: '2', customDays: null };
    if (oldTiming.daysBefore1) return { timingType: '1', customDays: null };
    
    return { timingType: '3', customDays: null };
  };

  const [config, setConfig] = useState(() => {
    const defaultConfig = {
      enabled: true,
      projectEndDate: true,
      billingFollowUp: true,
      paymentOverdue: true,
      systemAnnouncements: true,
      unpaidAfterCompletion: true,
      timing: { timingType: '3', customDays: null },
      overdueTriggerDays: 1
    };
    
    if (company?.notificationConfig) {
      const convertedTiming = convertTimingFormat(company.notificationConfig.timing);
      return {
        ...defaultConfig,
        ...company.notificationConfig,
        timing: convertedTiming
      };
    }
    
    return defaultConfig;
  });

  useEffect(() => {
    if (company?.notificationConfig) {
      const convertedTiming = convertTimingFormat(company.notificationConfig.timing);
      setConfig({
        enabled: company.notificationConfig.enabled ?? true,
        projectEndDate: company.notificationConfig.projectEndDate ?? true,
        billingFollowUp: company.notificationConfig.billingFollowUp ?? true,
        paymentOverdue: company.notificationConfig.paymentOverdue ?? true,
        systemAnnouncements: company.notificationConfig.systemAnnouncements ?? true,
        unpaidAfterCompletion: company.notificationConfig.unpaidAfterCompletion ?? true,
        timing: convertedTiming,
        overdueTriggerDays: company.notificationConfig.overdueTriggerDays ?? 1
      });
    }
  }, [company]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave('notificationConfig', config);
  };

  const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className={`w-11 h-6 rounded-full transition-colors ${
        disabled 
          ? 'bg-gray-100 cursor-not-allowed' 
          : checked 
            ? 'bg-red-600' 
            : 'bg-gray-200'
      } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
    </label>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
        <div className="bg-red-50 rounded-lg p-2">
          <BellIcon className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notification System Settings</h2>
          <p className="text-sm text-gray-500">Configure notification preferences and timing</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border-2 border-red-200">
          <div>
            <label className="font-semibold text-gray-800 text-lg">Enable Notifications</label>
            <p className="text-sm text-gray-600 mt-1">Master switch for all notification features</p>
          </div>
          <ToggleSwitch
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="font-semibold text-gray-700">Project Deadline Alerts</label>
              <p className="text-sm text-gray-500">Get notified when project deadlines are approaching</p>
            </div>
            <ToggleSwitch
              checked={config.projectEndDate}
              onChange={(e) => setConfig({ ...config, projectEndDate: e.target.checked })}
              disabled={!config.enabled}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="font-semibold text-gray-700">Billing Follow-up Alerts</label>
              <p className="text-sm text-gray-500">Receive reminders for billing follow-ups</p>
            </div>
            <ToggleSwitch
              checked={config.billingFollowUp}
              onChange={(e) => setConfig({ ...config, billingFollowUp: e.target.checked })}
              disabled={!config.enabled}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="font-semibold text-gray-700">Payment Overdue Alerts</label>
              <p className="text-sm text-gray-500">Get notified about overdue payments</p>
            </div>
            <ToggleSwitch
              checked={config.paymentOverdue}
              onChange={(e) => setConfig({ ...config, paymentOverdue: e.target.checked })}
              disabled={!config.enabled}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="font-semibold text-gray-700">System Announcements</label>
              <p className="text-sm text-gray-500">Receive important system updates and announcements</p>
            </div>
            <ToggleSwitch
              checked={config.systemAnnouncements}
              onChange={(e) => setConfig({ ...config, systemAnnouncements: e.target.checked })}
              disabled={!config.enabled}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="font-semibold text-gray-700">Unpaid After Completion Alerts</label>
              <p className="text-sm text-gray-500">Alert when projects are completed but unpaid</p>
            </div>
            <ToggleSwitch
              checked={config.unpaidAfterCompletion}
              onChange={(e) => setConfig({ ...config, unpaidAfterCompletion: e.target.checked })}
              disabled={!config.enabled}
            />
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Timing</h3>
          <p className="text-sm text-gray-600 mb-4">Select when to send notifications before project end date</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Days Before End Date
              </label>
              <select
                value={config.timing.timingType}
                onChange={(e) => setConfig({
                  ...config,
                  timing: {
                    timingType: e.target.value,
                    customDays: e.target.value === 'custom' ? (config.timing.customDays || 1) : null
                  }
                })}
                disabled={!config.enabled}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="1">1 day before end date</option>
                <option value="2">2 days before end date</option>
                <option value="3">3 days before end date</option>
                <option value="custom">Custom days before end date</option>
              </select>
            </div>

            {config.timing.timingType === 'custom' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Custom Days Before End Date
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={config.timing.customDays || ''}
                  onChange={(e) => {
                    const days = parseInt(e.target.value) || 1;
                    setConfig({
                      ...config,
                      timing: {
                        ...config.timing,
                        customDays: days
                      }
                    });
                  }}
                  disabled={!config.enabled}
                  placeholder="Enter number of days"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the number of days before project end date to send notification (1-365 days)
                </p>
              </div>
            )}

            {config.timing.timingType !== 'custom' && (
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  Notifications will be sent <strong>{config.timing.timingType} day{config.timing.timingType !== '1' ? 's' : ''}</strong> before the project end date.
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Overdue Project Alert Trigger (days after end date)
          </label>
          <input
            type="number"
            min="0"
            value={config.overdueTriggerDays}
            onChange={(e) => setConfig({ ...config, overdueTriggerDays: parseInt(e.target.value) || 0 })}
            disabled={!config.enabled}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Number of days after project end date to trigger overdue alert</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </form>
    </div>
  );
};

// Backup Tab Component
const BackupTab = ({ company, onSave, onBackup, saving }) => {
  const [config, setConfig] = useState(company?.backupConfig || {
    autoBackup: false,
    backupFrequency: 'daily',
    lastBackup: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave('backupConfig', config);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
        <div className="bg-red-50 rounded-lg p-2">
          <CloudArrowDownIcon className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Data Management & Backup</h2>
          <p className="text-sm text-gray-500">Manage data backups and storage settings</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="font-semibold text-gray-700">Auto Cloud Backup</label>
            <p className="text-sm text-gray-500">Automatically backup data to cloud</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.autoBackup}
              onChange={(e) => setConfig({ ...config, autoBackup: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        {config.autoBackup && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Backup Frequency
            </label>
            <select
              value={config.backupFrequency}
              onChange={(e) => setConfig({ ...config, backupFrequency: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        )}

        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-800">Last Backup</p>
              <p className="text-sm text-blue-600">
                {config.lastBackup 
                  ? new Date(config.lastBackup).toLocaleString()
                  : 'No backup created yet'}
              </p>
            </div>
            <button
              type="button"
              onClick={onBackup}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Backup Now
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Backup Settings'}
        </button>
      </form>
    </div>
  );
};

// Audit Logs Tab Component
const AuditLogsTab = ({ logs, onRefresh }) => {
  const [filter, setFilter] = useState({ entity: '', action: '' });
  const [loading, setLoading] = useState(false);

  const filteredLogs = logs.filter(log => {
    if (filter.entity && log.entity !== filter.entity) return false;
    if (filter.action && log.action !== filter.action) return false;
    return true;
  });

  const uniqueEntities = [...new Set(logs.map(log => log.entity))];
  const uniqueActions = [...new Set(logs.map(log => log.action))];

  const getActionColor = (action) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'login': return 'bg-purple-100 text-purple-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      case 'export': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 rounded-lg p-2">
            <ClipboardDocumentListIcon className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Audit Logs & Activity Tracking</h2>
            <p className="text-sm text-gray-500">View system activity and audit logs</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Entity</label>
          <select
            value={filter.entity}
            onChange={(e) => setFilter({ ...filter, entity: e.target.value })}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
          >
            <option value="">All Entities</option>
            {uniqueEntities.map(entity => (
              <option key={entity} value={entity}>{entity}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Action</label>
          <select
            value={filter.action}
            onChange={(e) => setFilter({ ...filter, action: e.target.value })}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
          >
            <option value="">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setFilter({ entity: '', action: '' })}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Date/Time</th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">User</th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Action</th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Entity</th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Description</th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                  {logs.length === 0 ? 'No audit logs available' : 'No logs match the current filters'}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 text-sm">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-sm">
                    {log.userId?.firstName && log.userId?.lastName 
                      ? `${log.userId.firstName} ${log.userId.lastName}`
                      : log.userId?.email || 'Unknown User'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-sm capitalize">{log.entity || '-'}</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm">{log.description || '-'}</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">{log.ipAddress || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredLogs.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredLogs.length} of {logs.length} audit log entries
        </div>
      )}
    </div>
  );
};

// PWA & Offline Tab Component
const PWATab = ({ company, onSave, saving }) => {
  const [config, setConfig] = useState(() => {
    const defaultConfig = {
      offlineMode: true,
      autoSync: true,
      lastSync: null,
      cacheSize: 0
    };
    return company?.pwaConfig ? { ...defaultConfig, ...company.pwaConfig } : defaultConfig;
  });

  useEffect(() => {
    if (company?.pwaConfig) {
      setConfig({
        offlineMode: company.pwaConfig.offlineMode ?? true,
        autoSync: company.pwaConfig.autoSync ?? true,
        lastSync: company.pwaConfig.lastSync || null,
        cacheSize: company.pwaConfig.cacheSize || 0
      });
    }
  }, [company]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave('pwaConfig', config);
  };

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear the offline cache? This will remove all cached data.')) {
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
          toast.success('Offline cache cleared successfully');
        });
      } else {
        toast.error('Cache API not supported in this browser');
      }
    }
  };

  const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className={`w-11 h-6 rounded-full transition-colors ${
        disabled 
          ? 'bg-gray-100 cursor-not-allowed' 
          : checked 
            ? 'bg-red-600' 
            : 'bg-gray-200'
      } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
    </label>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
        <div className="bg-red-50 rounded-lg p-2">
          <DevicePhoneMobileIcon className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">PWA & Offline Settings</h2>
          <p className="text-sm text-gray-500">Configure Progressive Web App and offline capabilities</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
          <div>
            <label className="font-semibold text-gray-800 text-lg">Enable Offline Mode</label>
            <p className="text-sm text-gray-600 mt-1">Allow the app to work without internet connection</p>
          </div>
          <ToggleSwitch
            checked={config.offlineMode}
            onChange={(e) => setConfig({ ...config, offlineMode: e.target.checked })}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="font-semibold text-gray-700">Auto Sync When Online</label>
            <p className="text-sm text-gray-500">Automatically sync data when connection is restored</p>
          </div>
          <ToggleSwitch
            checked={config.autoSync}
            onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
            disabled={!config.offlineMode}
          />
        </div>

        {config.lastSync && (
          <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-800">Last Sync</p>
                <p className="text-sm text-green-600">
                  {new Date(config.lastSync).toLocaleString()}
                </p>
              </div>
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        )}

        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="font-semibold text-gray-700">Storage Usage</label>
              <p className="text-sm text-gray-500">Current cache size</p>
            </div>
            <span className="text-lg font-bold text-gray-800">
              {config.cacheSize ? `${(config.cacheSize / 1024).toFixed(2)} MB` : '0 MB'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearCache}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Clear Offline Cache
          </button>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Offline mode allows you to continue working even when disconnected from the internet. 
            Data entered offline will be synced automatically when connection is restored.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save PWA Settings'}
        </button>
      </form>
    </div>
  );
};

export default SystemSettings;

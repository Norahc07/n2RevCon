import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { companyAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { usePermissions } from '../hooks/usePermissions';
import { getRoleDisplayName, ROLES, ACTIONS, ROLE_PERMISSIONS } from '../config/permissions';
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
  ChevronUpIcon,
  ChevronDownIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

const SystemSettings = () => {
  const { user } = useAuth();
  const { updateCurrency } = useCurrency();
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
  const [pendingUsers, setPendingUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    fetchCompany();
    if (activeTab === 'users') {
      fetchUsers();
      fetchPendingUsers();
    }
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
      // Use useCache: false to bypass cache and get fresh data
      const response = await userAPI.getAll({ useCache: false });
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const fetchPendingUsers = async () => {
    try {
      // Use useCache: false to bypass cache and get fresh data
      const response = await userAPI.getPending({ useCache: false });
      // Filter out any users that are not actually pending (safety check)
      const actualPendingUsers = (response.data.users || []).filter(
        user => user.accountStatus === 'pending' && user.emailVerified
      );
      setPendingUsers(actualPendingUsers);
    } catch (error) {
      // Only show error if user has permission (not a 403)
      if (error.response?.status !== 403) {
        toast.error('Failed to load pending users');
      }
      // Set empty array on error to clear stale data
      setPendingUsers([]);
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
      const updatedCompany = response.data.company;
      
      // Ensure the response has the updated settings
      if (section === 'company' && data?.settings) {
        // Merge the settings to ensure currency is included
        if (!updatedCompany.settings) {
          updatedCompany.settings = {};
        }
        updatedCompany.settings = { ...updatedCompany.settings, ...data.settings };
      }
      
      setCompany(updatedCompany);
      
      // Update currency context if currency was changed
      if (section === 'company' && data?.settings?.currency) {
        updateCurrency(data.settings.currency);
      }
      
      toast.success('Settings saved successfully');
      return true; // Return success
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
      return false; // Return failure
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
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-4"></div>
        
        {/* Tabs Skeleton */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        
        {/* Content Skeleton */}
        <div className="card p-6 shadow-md">
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
            <p className="text-gray-500 mt-1">Configure system-wide settings and preferences</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
            {/* Company Information */}
            {activeTab === 'company' && company && (
              <div className="card space-y-6 shadow-md">
                <CompanyInformationTab company={company} onSave={handleSave} saving={saving} />
              </div>
            )}

            {/* User Management */}
            {activeTab === 'users' && (
              <div className="card space-y-6 shadow-md">
                <UserManagementTab 
                  users={users} 
                  pendingUsers={pendingUsers}
                  onRefresh={async () => {
                    // Force refresh both lists
                    await Promise.all([
                      fetchUsers(),
                      fetchPendingUsers()
                    ]);
                  }}
                  onUsersUpdate={setUsers}
                  onPendingUsersUpdate={setPendingUsers}
                />
              </div>
            )}

            {/* Project Configuration */}
            {activeTab === 'project' && company && (
              <div className="card space-y-6 shadow-md">
                <ProjectConfigTab company={company} onSave={handleSave} saving={saving} />
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && company && (
              <div className="card space-y-6 shadow-md">
                <NotificationConfigTab company={company} onSave={handleSave} saving={saving} />
              </div>
            )}

            {/* Data & Backup */}
            {activeTab === 'backup' && company && (
              <div className="card space-y-6 shadow-md">
                <BackupTab company={company} onSave={handleSave} onBackup={handleCreateBackup} saving={saving} />
              </div>
            )}

            {/* Audit Logs */}
            {activeTab === 'audit' && (
              <div className="card space-y-6 shadow-md">
                <AuditLogsTab logs={auditLogs} onRefresh={fetchAuditLogs} />
              </div>
            )}

            {/* PWA & Offline */}
            {activeTab === 'pwa' && company && (
              <div className="card space-y-6 shadow-md">
                <PWATab company={company} onSave={handleSave} saving={saving} />
              </div>
            )}
          </div>
    </div>
  );
};

// Company Information Tab Component
const CompanyInformationTab = ({ company, onSave, saving }) => {
  const { currency: contextCurrency } = useCurrency();
  const [focusedDropdown, setFocusedDropdown] = useState(null);
  
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
      currency: company?.settings?.currency || contextCurrency || 'PHP',
      dateFormat: company?.settings?.dateFormat || 'MM/DD/YYYY',
    },
  });

  // Update formData when company data loads or changes
  useEffect(() => {
    if (company) {
      // Use saved currency from company, prioritizing company settings over context
      // Only use contextCurrency as fallback if company doesn't have settings
      const savedCurrency = company.settings?.currency || contextCurrency || 'PHP';
      
      setFormData(prev => {
        // Always update formData with the latest company data
        // This ensures the currency dropdown shows the saved value after save
        return {
          companyName: company.companyName || '',
          companyCode: company.companyCode || '',
          logo: company.logo || '',
          address: {
            street: company.address?.street || '',
            city: company.address?.city || '',
            state: company.address?.state || '',
            zipCode: company.address?.zipCode || '',
            country: company.address?.country || '',
          },
          contact: {
            phone: company.contact?.phone || '',
            email: company.contact?.email || '',
            website: company.contact?.website || '',
          },
          settings: {
            currency: savedCurrency,
            dateFormat: company.settings?.dateFormat || 'MM/DD/YYYY',
          },
        };
      });
    }
  }, [company, contextCurrency]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await onSave('company', formData);
    // The useEffect will update formData when company state changes
    // But we also ensure formData is preserved with the selected currency
    if (result && formData.settings?.currency) {
      // Keep the formData currency value - don't let it revert
      // The useEffect should update it from the company response
    }
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
              <div className="relative">
                <select
                  value={formData.settings.currency}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, currency: e.target.value }
                  })}
                  onFocus={() => setFocusedDropdown('currency')}
                  onBlur={() => setFocusedDropdown(null)}
                  className="w-full px-4 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer bg-white"
                >
                  <option value="PHP">PHP (Philippine Peso)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="GBP">GBP (British Pound)</option>
                  <option value="JPY">JPY</option>
                  <option value="CNY">CNY</option>
                </select>
                {focusedDropdown === 'currency' ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <div className="relative">
                <select
                  value={formData.settings.dateFormat}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, dateFormat: e.target.value }
                  })}
                  onFocus={() => setFocusedDropdown('dateFormat')}
                  onBlur={() => setFocusedDropdown(null)}
                  className="w-full px-4 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer bg-white"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
                {focusedDropdown === 'dateFormat' ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                )}
              </div>
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

// Helper function to get role description
const getRoleDescription = (role) => {
  const descriptions = {
    [ROLES.MASTER_ADMIN]: 'Full system access with all permissions. Can manage users, approve accounts, and delete projects.',
    [ROLES.SYSTEM_ADMIN]: 'System administrator with project management capabilities. Can approve projects and view reports.',
    [ROLES.REVENUE_OFFICER]: 'Manages revenue records and transactions. Can create, edit, and view revenue data.',
    [ROLES.DISBURSING_OFFICER]: 'Manages expense records and disbursements. Can create, edit, and view expense data.',
    [ROLES.BILLING_OFFICER]: 'Manages billing records and invoices. Can create, edit, and view billing data.',
    [ROLES.COLLECTING_OFFICER]: 'Manages collection records and payments. Can create, edit, and view collection data.',
    [ROLES.VIEWER]: 'Read-only access. Can view reports and data but cannot make changes.',
  };
  return descriptions[role] || 'No description available.';
};

// Helper function to get action description
const getActionDescription = (action) => {
  const descriptions = {
    [ACTIONS.REVENUE]: 'Manage Revenue',
    [ACTIONS.EXPENSES]: 'Manage Expenses',
    [ACTIONS.BILLING]: 'Manage Billing',
    [ACTIONS.COLLECTION]: 'Manage Collections',
    [ACTIONS.APPROVE]: 'Approve Projects/Users',
    [ACTIONS.CLOSE_LOCK_PROJECT]: 'Close/Lock Projects',
    [ACTIONS.DELETE_PROJECT]: 'Delete Projects',
    [ACTIONS.VIEW_REPORTS]: 'View Reports',
  };
  return descriptions[action] || action;
};

// User Management Tab Component
const UserManagementTab = ({ users, pendingUsers = [], onRefresh, onUsersUpdate, onPendingUsersUpdate }) => {
  const { role: currentUserRole } = usePermissions();
  const isMasterAdmin = currentUserRole === ROLES.MASTER_ADMIN;
  const [editingUser, setEditingUser] = useState(null);
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'viewer',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showRolesInfo, setShowRolesInfo] = useState(false);

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'viewer',
      isActive: user.isActive !== undefined ? user.isActive : true,
    });
  };

  const handleApprove = async (user) => {
    if (!window.confirm(`Approve ${user.firstName} ${user.lastName}? They will be able to log in after approval.`)) {
      return;
    }

    try {
      setLoading(true);
      const userId = user.id || user._id;
      
      // Optimistically update the UI immediately
      const updatedUser = { ...user, accountStatus: 'approved' };
      
      // Remove from pending users immediately
      if (onPendingUsersUpdate) {
        onPendingUsersUpdate((prevPendingUsers) => 
          prevPendingUsers.filter(u => (u.id || u._id) !== userId)
        );
      }
      
      // Add to active users immediately
      if (onUsersUpdate) {
        onUsersUpdate((prevUsers) => {
          // Check if user already exists in the list
          const userExists = prevUsers.some(u => (u.id || u._id) === userId);
          if (userExists) {
            // Update existing user
            return prevUsers.map(u => 
              (u.id || u._id) === userId ? updatedUser : u
            );
          } else {
            // Add new user to the list
            return [...prevUsers, updatedUser];
          }
        });
      }
      
      // Make API call
      await userAPI.approveUser(userId);
      toast.success('User approved successfully');
      
      // Small delay to ensure backend has fully processed the update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh from server to ensure consistency (cache already invalidated by approveUser)
      onRefresh();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to approve user';
      
      // If user is already approved, treat it as success and refresh
      if (errorMessage.includes('already') && errorMessage.includes('approved')) {
        toast.success('User is already approved');
        // Refresh to update the UI
        onRefresh();
      } else {
        // For other errors, show error and refresh
        toast.error(errorMessage);
        // Refresh to get correct state
        onRefresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingUser) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setLoading(true);
      const userId = rejectingUser.id || rejectingUser._id;
      
      // Optimistically update the UI immediately
      const updatedUser = { ...rejectingUser, accountStatus: 'rejected' };
      
      // Remove from pending users immediately
      if (onPendingUsersUpdate) {
        onPendingUsersUpdate((prevPendingUsers) => 
          prevPendingUsers.filter(u => (u.id || u._id) !== userId)
        );
      }
      
      // Update in users list if exists
      if (onUsersUpdate) {
        onUsersUpdate((prevUsers) => 
          prevUsers.map(u => 
            (u.id || u._id) === userId ? updatedUser : u
          )
        );
      }
      
      // Make API call
      await userAPI.rejectUser(userId, rejectionReason);
      toast.success('User rejected successfully');
      setRejectingUser(null);
      setRejectionReason('');
      
      // Small delay to ensure backend has fully processed the update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh from server to ensure consistency (cache already invalidated by rejectUser)
      onRefresh();
    } catch (error) {
      // Revert optimistic update on error
      toast.error(error.response?.data?.message || 'Failed to reject user');
      // Refresh to get correct state
      onRefresh();
    } finally {
      setLoading(false);
    }
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
      const updateData = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        isActive: editFormData.isActive,
      };
      
      // Only include role if user is master admin
      if (isMasterAdmin && editFormData.role) {
        updateData.role = editFormData.role;
      }
      
      await userAPI.update(userId, updateData);
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
          <div>
            <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
            <p className="text-sm text-gray-500">Manage system users and their permissions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isMasterAdmin && (
            <button
              onClick={() => setShowRolesInfo(!showRolesInfo)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <InformationCircleIcon className="w-5 h-5" />
              <span>Roles & Permissions</span>
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Roles & Permissions Modal - Only visible to Master Admin */}
      {isMasterAdmin && showRolesInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto m-4 relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <InformationCircleIcon className="w-7 h-7 text-blue-600" />
                Roles & Permissions Guide
              </h3>
              <button
                onClick={() => setShowRolesInfo(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                title="Close"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(ROLES).map((role) => {
                const permissions = ROLE_PERMISSIONS[role] || {};
                const roleDescription = getRoleDescription(role);
                const allowedActions = Object.entries(permissions)
                  .filter(([_, allowed]) => allowed)
                  .map(([action]) => getActionDescription(action));
                
                return (
                  <div key={role} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      {getRoleDisplayName(role)}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{roleDescription}</p>
                    
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                        Permissions:
                      </p>
                      <ul className="space-y-1">
                        {allowedActions.length > 0 ? (
                          allowedActions.map((action, index) => (
                            <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                              <CheckCircleIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-gray-500 italic">No special permissions</li>
                        )}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Pending Users Section - Only show if Master Admin */}
      {isMasterAdmin && pendingUsers.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">
            ⏳ Pending Approval ({pendingUsers.length})
          </h3>
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div key={user.id || user._id} className="bg-white p-4 rounded-lg border border-yellow-200 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500">Registered: {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(user)}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectingUser(user)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject User Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Reject User</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject <strong>{rejectingUser.firstName} {rejectingUser.lastName}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                rows="3"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Rejecting...' : 'Reject User'}
              </button>
              <button
                onClick={() => {
                  setRejectingUser(null);
                  setRejectionReason('');
                }}
                disabled={loading}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
              {isMasterAdmin && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  >
                    <option value={ROLES.MASTER_ADMIN}>Master Admin</option>
                    <option value={ROLES.SYSTEM_ADMIN}>System Administrator</option>
                    <option value={ROLES.REVENUE_OFFICER}>Revenue Officer</option>
                    <option value={ROLES.DISBURSING_OFFICER}>Disbursing Officer</option>
                    <option value={ROLES.BILLING_OFFICER}>Billing Officer</option>
                    <option value={ROLES.COLLECTING_OFFICER}>Collecting Officer</option>
                    <option value={ROLES.VIEWER}>Viewer</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Only Master Admin can change roles</p>
                </div>
              )}
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
                      {getRoleDisplayName(user.role)}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {user.accountStatus === 'pending' ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                        Pending
                      </span>
                    ) : user.accountStatus === 'rejected' ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                        Rejected
                      </span>
                    ) : user.isActive ? (
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
  const [focusedDropdown, setFocusedDropdown] = useState(null);
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
          <div className="relative">
            <select
              value={config.defaultStatus}
              onChange={(e) => setConfig({ ...config, defaultStatus: e.target.value })}
              onFocus={() => setFocusedDropdown('defaultStatus')}
              onBlur={() => setFocusedDropdown(null)}
              className="w-full px-4 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer bg-white"
            >
              <option value="pending">Pending</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
            {focusedDropdown === 'defaultStatus' ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            )}
          </div>
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
  const [focusedDropdown, setFocusedDropdown] = useState(null);
  
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
      projectFollowUp: true,
      followUpDays: 7,
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
        projectFollowUp: company.notificationConfig.projectFollowUp ?? true,
        followUpDays: company.notificationConfig.followUpDays ?? 7,
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

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="font-semibold text-gray-700">Project Follow-Up Alerts</label>
              <p className="text-sm text-gray-500">Get notified about completed projects that need follow-up action</p>
            </div>
            <ToggleSwitch
              checked={config.projectFollowUp}
              onChange={(e) => setConfig({ ...config, projectFollowUp: e.target.checked })}
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
              <div className="relative">
                <select
                  value={config.timing.timingType}
                  onChange={(e) => setConfig({
                    ...config,
                    timing: {
                      timingType: e.target.value,
                      customDays: e.target.value === 'custom' ? (config.timing.customDays || 1) : null
                    }
                  })}
                  onFocus={() => setFocusedDropdown('timing')}
                  onBlur={() => setFocusedDropdown(null)}
                  disabled={!config.enabled}
                  className="w-full px-4 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none cursor-pointer bg-white"
                >
                  <option value="1">1 day before end date</option>
                  <option value="2">2 days before end date</option>
                  <option value="3">3 days before end date</option>
                  <option value="custom">Custom days before end date</option>
                </select>
                {focusedDropdown === 'timing' ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                )}
              </div>
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

        {config.projectFollowUp && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Days After Completion to Trigger Follow-Up Alert
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={config.followUpDays || 7}
              onChange={(e) => setConfig({ ...config, followUpDays: parseInt(e.target.value) || 7 })}
              disabled={!config.enabled || !config.projectFollowUp}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of days after project completion before triggering follow-up alert (default: 7 days)
            </p>
          </div>
        )}

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
  const [focusedDropdown, setFocusedDropdown] = useState(null);
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
          <div className="relative">
            <select
              value={filter.entity}
              onChange={(e) => setFilter({ ...filter, entity: e.target.value })}
              onFocus={() => setFocusedDropdown('entity')}
              onBlur={() => setFocusedDropdown(null)}
              className="w-full px-4 pr-10 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer bg-white"
            >
              <option value="">All Entities</option>
              {uniqueEntities.map(entity => (
                <option key={entity} value={entity}>{entity}</option>
              ))}
            </select>
            {focusedDropdown === 'entity' ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Action</label>
          <div className="relative">
            <select
              value={filter.action}
              onChange={(e) => setFilter({ ...filter, action: e.target.value })}
              onFocus={() => setFocusedDropdown('action')}
              onBlur={() => setFocusedDropdown(null)}
              className="w-full px-4 pr-10 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer bg-white"
            >
              <option value="">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
            {focusedDropdown === 'action' ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            )}
          </div>
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

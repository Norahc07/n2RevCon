import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  UserIcon,
  LockClosedIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';

const AccountSettings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Profile form data
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    mobile: user?.profile?.mobile || '',
    telephone: user?.profile?.telephone || '',
    avatar: user?.profile?.avatar || '',
  });

  // Password change request
  const [passwordRequestLoading, setPasswordRequestLoading] = useState(false);



  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        mobile: user.profile?.mobile || '',
        telephone: user.profile?.telephone || '',
        avatar: user.profile?.avatar || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'sessions' && user) {
      fetchSessions();
    }
    if (activeTab === 'sessions' && user) {
      fetchLoginHistory();
    }
  }, [activeTab, user]);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const userId = user?.id || user?._id;
      if (!userId) {
        toast.error('User ID not found');
        return;
      }
      const response = await userAPI.getSessions(userId);
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error(error.response?.data?.message || 'Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const userId = user?.id || user?._id;
      if (!userId) {
        toast.error('User ID not found');
        return;
      }
      const response = await userAPI.getLoginHistory(userId);
      setLoginHistory(response.data.loginHistory || []);
    } catch (error) {
      console.error('Error fetching login history:', error);
      toast.error(error.response?.data?.message || 'Failed to load login history');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      if (!userId) {
        toast.error('User ID not found');
        setLoading(false);
        return;
      }
      const response = await userAPI.update(userId, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        // Email is not editable, so don't send it in the update
        profile: {
          mobile: profileData.mobile,
          telephone: profileData.telephone,
          avatar: profileData.avatar,
        },
      });
      updateUser(response.data.user);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordChange = async () => {
    try {
      setPasswordRequestLoading(true);
      const response = await userAPI.requestPasswordChange();
      toast.success(response.data.message || 'Verification email sent! Please check your email.');
      
      // In development, show the URL
      if (response.data.changeUrl) {
        console.log('Password Change URL:', response.data.changeUrl);
        toast.success(`Development: Check console for verification URL`, { duration: 5000 });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setPasswordRequestLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!window.confirm('Are you sure you want to log out from all devices? You will need to login again.')) {
      return;
    }
    try {
      const userId = user?.id || user?._id;
      if (!userId) {
        toast.error('User ID not found');
        return;
      }
      await userAPI.logoutAllDevices(userId);
      toast.success('Logged out from all devices successfully');
      fetchSessions();
    } catch (error) {
      console.error('Error logging out from all devices:', error);
      toast.error(error.response?.data?.message || 'Failed to logout from all devices');
    }
  };



  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setProfileData({ ...profileData, avatar: '' });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'password', label: 'Password & Security', icon: LockClosedIcon },
    { id: 'sessions', label: 'Sessions', icon: DevicePhoneMobileIcon },
    { id: 'account', label: 'Account Status', icon: ShieldCheckIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-700 rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <UserIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Account Settings</h1>
            <p className="text-red-100 mt-1">Manage your personal account information and preferences</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="card space-y-2 p-3 shadow-md">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {/* Profile Information */}
          {activeTab === 'profile' && (
            <div className="card space-y-6 shadow-md">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
                <div className="bg-red-50 rounded-lg p-2">
                  <UserIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
                  <p className="text-sm text-gray-500">Update your personal details and profile picture</p>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* Profile Picture */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {profileData.avatar ? (
                        <div className="relative">
                          <img
                            src={profileData.avatar}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={removeAvatar}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                          <PhotoIcon className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                        <PhotoIcon className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">
                          {profileData.avatar ? 'Change' : 'Upload'} Photo
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={profileData.email}
                    disabled
                    readOnly
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed transition-colors duration-200"
                    placeholder="Company email"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.mobile}
                      onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Telephone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.telephone}
                      onChange={(e) => setProfileData({ ...profileData, telephone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Password & Security */}
          {activeTab === 'password' && (
            <div className="card space-y-6 shadow-md">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
                <div className="bg-red-50 rounded-lg p-2">
                  <LockClosedIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Password & Security</h2>
                  <p className="text-sm text-gray-500">Change your password and manage security settings</p>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Secure Password Change:</strong> For your security, password changes require email verification. 
                  Click the button below to receive a verification link in your email.
                </p>
              </div>

              <div>
                <button
                  onClick={handleRequestPasswordChange}
                  disabled={passwordRequestLoading}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  <LockClosedIcon className="w-5 h-5" />
                  {passwordRequestLoading ? 'Sending...' : 'Request Password Change'}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  A verification link will be sent to {user?.email}
                </p>
              </div>
            </div>
          )}

          {/* Login & Session Management */}
          {activeTab === 'sessions' && (
            <div className="card space-y-6 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-red-50 rounded-lg p-2">
                    <DevicePhoneMobileIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Login & Session Management</h2>
                    <p className="text-sm text-gray-500">View and manage your active sessions</p>
                  </div>
                </div>
                <button
                  onClick={handleLogoutAllDevices}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Logout All Devices
                </button>
              </div>

              {/* Active Sessions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Sessions</h3>
                {loadingSessions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600 mx-auto"></div>
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No active sessions</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${
                          session.isCurrent
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ComputerDesktopIcon className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="font-semibold text-gray-900">
                                {session.device || 'Unknown Device'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {session.ipAddress || 'Unknown IP'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {session.lastActivity ? `Last active: ${new Date(session.lastActivity).toLocaleString()}` : 'No activity recorded'}
                              </p>
                            </div>
                          </div>
                          {session.isCurrent && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              Current Session
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Login History */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Login Activity</h3>
                {loginHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No login history available</p>
                ) : (
                  <div className="space-y-2">
                    {loginHistory.map((entry, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <ClockIcon className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {entry.device || 'Unknown Device'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {entry.ipAddress || 'Unknown IP'} • {(entry.date || entry.timestamp) ? new Date(entry.date || entry.timestamp).toLocaleString() : 'Unknown time'}
                            </p>
                          </div>
                        </div>
                        {entry.success ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        ) : (
                          <XMarkIcon className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Status */}
          {activeTab === 'account' && (
            <div className="card space-y-6 shadow-md">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
                <div className="bg-red-50 rounded-lg p-2">
                  <ShieldCheckIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Account Status</h2>
                  <p className="text-sm text-gray-500">View your account information and status</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200 shadow-sm">
                  <p className="text-sm font-semibold text-blue-600 uppercase mb-2">Role</p>
                  <p className="text-xl font-bold text-gray-900">Administrator</p>
                </div>

                <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200 shadow-sm">
                  <p className="text-sm font-semibold text-green-600 uppercase mb-2">Account Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${user?.isActive ? 'bg-green-500' : 'bg-red-500'} shadow-sm`}></div>
                    <p className="text-xl font-bold text-gray-900">
                      {user?.isActive ? 'Active' : 'Deactivated'}
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200 shadow-sm">
                  <p className="text-sm font-semibold text-purple-600 uppercase mb-2">Account Created</p>
                  <p className="text-xl font-bold text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : 'N/A'}
                  </p>
                </div>

                <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-orange-200 shadow-sm">
                  <p className="text-sm font-semibold text-orange-600 uppercase mb-2">Last Login</p>
                  <p className="text-xl font-bold text-gray-900">
                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-US') : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;

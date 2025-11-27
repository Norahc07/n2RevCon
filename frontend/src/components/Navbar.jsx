import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

const Navbar = ({ onMenuClick, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const notificationRef = useRef(null);
  const bellRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getAll({ limit: 10 });
      const allNotifications = response.data.notifications || [];
      // Only show unread notifications in dropdown
      const unreadNotifications = allNotifications.filter(n => !n.isRead);
      setNotifications(unreadNotifications);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      try {
        await notificationAPI.markAsRead(notification._id);
        // Remove from list and update count
        setNotifications(prev => prev.filter(n => n._id !== notification._id));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        toast.error('Failed to mark notification as read');
      }
    }
    
    // Show modal with notification details
    setSelectedNotification(notification);
    setShowNotifications(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Get profile picture or default
  const profilePicture = user?.profile?.avatar || null;
  const displayName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white z-40 px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
        <div className="flex items-center justify-between h-full">
          {/* Left side - Burger icon, Logo and Name (NOT affected by expansion) */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Burger icon - Aligned with sidebar icons */}
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center flex-shrink-0"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              style={{ width: '40px', height: '40px' }}
            >
              <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </button>

            {/* Logo and Name */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img 
                src="/n2RevConLogo.png" 
                alt="N2 RevCon Logo" 
                className="h-6 sm:h-8 w-auto flex-shrink-0"
              />
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate">N2 RevCon</h2>
            </div>
          </div>

          {/* Right side - Notifications and User Menu */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Notifications */}
            <div className="relative">
              <button
                ref={bellRef}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <BellIcon className="w-6 h-6 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div
                  ref={notificationRef}
                  className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white rounded-lg shadow-xl border-2 border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col"
                >
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto flex-1">
                    {loading ? (
                      <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <BellIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification._id}
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900 text-sm">
                                  {notification.title}
                                </h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                                  {notification.priority}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-red-600 rounded-full mt-1 flex-shrink-0"></span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/notifications');
                        }}
                        className="w-full text-center text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative group">
              <button className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={displayName}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <UserCircleIcon 
                  className={`w-7 h-7 sm:w-8 sm:h-8 text-gray-700 flex-shrink-0 ${profilePicture ? 'hidden' : ''}`}
                  style={{ display: profilePicture ? 'none' : 'block' }}
                />
                <span className="hidden lg:block text-sm font-medium text-gray-700 truncate max-w-[120px]">
                  {displayName}
                </span>
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border-2 border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <button
                    onClick={() => navigate('/settings/account')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors duration-200"
                  >
                    Profile Settings
                  </button>
                  
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Notification Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-800">{selectedNotification.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedNotification.priority)}`}>
                  {selectedNotification.priority}
                </span>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-3">{selectedNotification.message}</p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })}
              </p>
            </div>

            {selectedNotification.actionUrl && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigate(selectedNotification.actionUrl);
                    setSelectedNotification(null);
                  }}
                  className="flex-1 bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                >
                  View Details
                </button>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

import { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  BellIcon,
  CheckCircleIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XMarkIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { CardSkeleton } from '../components/skeletons';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [focusedDropdown, setFocusedDropdown] = useState(null);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [filter, currentPage, itemsPerPage]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...(filter !== 'all' && { isRead: filter === 'read' ? 'true' : 'false' }),
      };
      const response = await notificationAPI.getAll(params);
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
      setPagination(response.data.pagination || pagination);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    // Find the notification to update optimistically
    const notificationToUpdate = notifications.find(n => n._id === id);
    if (!notificationToUpdate) return;

    // Don't mark as read if already read
    if (notificationToUpdate.isRead) {
      toast.info('This notification is already marked as read');
      return;
    }

    // Optimistically update UI immediately
    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;
    
    setNotifications(prev => 
      prev.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      )
    );
    
    if (!notificationToUpdate.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      const response = await notificationAPI.markAsRead(id);
      
      // Update with server response
      if (response.data.unreadCount !== undefined) {
        setUnreadCount(response.data.unreadCount);
      }

      // If filtering by "unread", remove the notification from the list
      if (filter === 'unread') {
        setNotifications(prev => prev.filter(n => n._id !== id));
        
        // If we removed the last notification on the page, go to previous page
        const remainingCount = notifications.length - 1;
        if (remainingCount === 0 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else if (remainingCount === 0) {
          // If no notifications left on current page, refetch to get new data
          fetchNotifications();
        }
      } else {
        // For "all" or "read" filter, the optimistic update is already applied
        // Optionally refetch to ensure consistency with server
        toast.success('Notification marked as read', { duration: 2000 });
      }
    } catch (error) {
      // Rollback on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      
      const errorMessage = error.response?.data?.message || 'Failed to mark notification as read';
      toast.error(errorMessage);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      toast.info('No unread notifications to mark');
      return;
    }

    // Optimistically update UI
    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;
    
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      const response = await notificationAPI.markAllAsRead();
      
      // Update with server response
      if (response.data.unreadCount !== undefined) {
        setUnreadCount(response.data.unreadCount);
      }

      // If filtering by "unread", clear the list or refetch
      if (filter === 'unread') {
        // Clear the list since all are now read
        setNotifications([]);
        // Reset to page 1 if we're not already there
        if (currentPage > 1) {
          setCurrentPage(1);
        }
      } else {
        // Refetch to get updated data
        fetchNotifications();
      }
      
      toast.success(response.data.message || 'All notifications marked as read');
    } catch (error) {
      // Rollback on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      
      const errorMessage = error.response?.data?.message || 'Failed to mark all as read';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    // Optimistically remove from UI
    const notificationToDelete = notifications.find(n => n._id === id);
    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;
    
    setNotifications(prev => prev.filter(n => n._id !== id));
    
    // If deleting an unread notification, update unread count
    if (notificationToDelete && !notificationToDelete.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await notificationAPI.delete(id);
      toast.success('Notification deleted');
      
      // Update pagination total if needed
      setPagination(prev => ({
        ...prev,
        totalItems: Math.max(0, prev.totalItems - 1),
        totalPages: Math.ceil(Math.max(0, prev.totalItems - 1) / itemsPerPage)
      }));
      
      // If we removed the last notification on the page, go to previous page
      const remainingCount = previousNotifications.length - 1;
      if (remainingCount === 0 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else if (remainingCount === 0) {
        // If no notifications left on current page, refetch
        fetchNotifications();
      }
    } catch (error) {
      // Rollback on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      
      const errorMessage = error.response?.data?.message || 'Failed to delete notification';
      toast.error(errorMessage);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const totalPages = pagination.totalPages || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, pagination.totalItems || 0);

  if (loading && notifications.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BellIcon className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1 ml-8 sm:ml-0">
              <span className="font-semibold text-red-600">{unreadCount}</span> unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
          {/* Filter Dropdown */}
          <div className="relative">
            <label className="sr-only">Filter notifications</label>
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-4 h-4 text-gray-500 sm:hidden" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                onFocus={() => setFocusedDropdown('filter')}
                onBlur={() => setFocusedDropdown(null)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer bg-white"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>
          </div>
          {/* Mark All Read Button */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-3 sm:px-4 py-2 text-sm rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <CheckIcon className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="card shadow-md">
        {notifications.length === 0 ? (
          <div className="text-center py-12 sm:py-16 text-gray-500">
            <BellIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-base sm:text-lg font-medium">No notifications found</p>
            <p className="text-sm text-gray-400 mt-2">You're all caught up!</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 sm:space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
                    notification.isRead
                      ? 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      : 'bg-white border-red-300 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start gap-2 mb-2">
                        <h3 className={`font-semibold text-sm sm:text-base ${
                          notification.isRead ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                            {notification.priority || 'normal'}
                          </span>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" title="Unread"></span>
                          )}
                        </div>
                      </div>
                      <p className={`text-sm sm:text-base mb-2 ${
                        notification.isRead ? 'text-gray-600' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex sm:flex-col gap-2 sm:ml-4 sm:mt-0 flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                          title="Mark as read"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">Mark Read</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                        title="Delete notification"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalItems > 0 && (
              <div className="bg-gray-50 border-t-2 border-gray-200 px-3 sm:px-4 py-3 sm:py-4 space-y-3 mt-4">
                {/* Pagination Info */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <span className="text-center sm:text-left">
                      Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
                      <span className="font-semibold text-gray-900">{endIndex}</span> of{' '}
                      <span className="font-semibold text-gray-900">{pagination.totalItems}</span> notifications
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
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-gray-600">per page</span>
                    </div>
                  </div>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPrevPage || currentPage === 1}
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
                      disabled={!pagination.hasNextPage || currentPage === totalPages}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;


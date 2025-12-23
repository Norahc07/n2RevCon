import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission, hasAnyPermission, hasAllPermissions, getRolePermissions, ACTIONS } from '../config/permissions';

/**
 * Custom hook for checking user permissions
 * @returns {Object} - Permission checking functions and user info
 */
export const usePermissions = () => {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user || !user.role) {
      return {
        canAccessRevenue: false,
        canAccessExpenses: false,
        canAccessBilling: false,
      canAccessCollection: false,
      canApprove: false,
      canCloseLockProject: false,
      canDeleteProject: false,
      canViewReports: false,
      role: null,
      rolePermissions: {},
    };
  }

  const rolePermissions = getRolePermissions(user.role);

  return {
    // Individual permission checks
    canAccessRevenue: hasPermission(user.role, ACTIONS.REVENUE),
    canAccessExpenses: hasPermission(user.role, ACTIONS.EXPENSES),
    canAccessBilling: hasPermission(user.role, ACTIONS.BILLING),
    canAccessCollection: hasPermission(user.role, ACTIONS.COLLECTION),
    canApprove: hasPermission(user.role, ACTIONS.APPROVE),
    canCloseLockProject: hasPermission(user.role, ACTIONS.CLOSE_LOCK_PROJECT),
    canDeleteProject: hasPermission(user.role, ACTIONS.DELETE_PROJECT),
    canViewReports: hasPermission(user.role, ACTIONS.VIEW_REPORTS),
      
      // Role info
      role: user.role,
      rolePermissions,
      
      // Utility functions
      hasPermission: (action) => hasPermission(user.role, action),
      hasAnyPermission: (...actions) => hasAnyPermission(user.role, actions),
      hasAllPermissions: (...actions) => hasAllPermissions(user.role, actions),
    };
  }, [user]);

  return permissions;
};

export default usePermissions;


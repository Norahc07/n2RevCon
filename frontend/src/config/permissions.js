/**
 * Frontend Permissions Configuration
 * 
 * This file mirrors the backend permissions configuration for frontend use.
 * It defines the permissions matrix for different user roles.
 */

// Define all available actions
export const ACTIONS = {
  REVENUE: 'revenue',
  EXPENSES: 'expenses',
  BILLING: 'billing',
  COLLECTION: 'collection',
  APPROVE: 'approve',
  CLOSE_LOCK_PROJECT: 'closeLockProject',
  DELETE_PROJECT: 'deleteProject',
  VIEW_REPORTS: 'viewReports',
};

// Define all available roles
export const ROLES = {
  MASTER_ADMIN: 'master_admin',
  SYSTEM_ADMIN: 'system_admin', // System Administrator / Project Manager / Approver
  REVENUE_OFFICER: 'revenue_officer',
  DISBURSING_OFFICER: 'disbursing_officer',
  BILLING_OFFICER: 'billing_officer',
  COLLECTING_OFFICER: 'collecting_officer',
  VIEWER: 'viewer', // Viewer / Auditor / Guest
};

// Permissions matrix: Role -> Actions mapping
// ✓ = Allowed, ✖ = Not Allowed
export const ROLE_PERMISSIONS = {
  [ROLES.MASTER_ADMIN]: {
    [ACTIONS.REVENUE]: true,
    [ACTIONS.EXPENSES]: true,
    [ACTIONS.BILLING]: true,
    [ACTIONS.COLLECTION]: true,
    [ACTIONS.APPROVE]: true,
    [ACTIONS.CLOSE_LOCK_PROJECT]: true,
    [ACTIONS.DELETE_PROJECT]: true,
    [ACTIONS.VIEW_REPORTS]: true,
  },
  [ROLES.SYSTEM_ADMIN]: {
    [ACTIONS.REVENUE]: false,
    [ACTIONS.EXPENSES]: false,
    [ACTIONS.BILLING]: false,
    [ACTIONS.COLLECTION]: false,
    [ACTIONS.APPROVE]: true,
    [ACTIONS.CLOSE_LOCK_PROJECT]: true,
    [ACTIONS.DELETE_PROJECT]: false,
    [ACTIONS.VIEW_REPORTS]: true,
  },
  [ROLES.REVENUE_OFFICER]: {
    [ACTIONS.REVENUE]: true,
    [ACTIONS.EXPENSES]: false,
    [ACTIONS.BILLING]: false,
    [ACTIONS.COLLECTION]: false,
    [ACTIONS.APPROVE]: false,
    [ACTIONS.CLOSE_LOCK_PROJECT]: false,
    [ACTIONS.DELETE_PROJECT]: false,
    [ACTIONS.VIEW_REPORTS]: true,
  },
  [ROLES.DISBURSING_OFFICER]: {
    [ACTIONS.REVENUE]: false,
    [ACTIONS.EXPENSES]: true,
    [ACTIONS.BILLING]: false,
    [ACTIONS.COLLECTION]: false,
    [ACTIONS.APPROVE]: false,
    [ACTIONS.CLOSE_LOCK_PROJECT]: false,
    [ACTIONS.DELETE_PROJECT]: false,
    [ACTIONS.VIEW_REPORTS]: true,
  },
  [ROLES.BILLING_OFFICER]: {
    [ACTIONS.REVENUE]: false,
    [ACTIONS.EXPENSES]: false,
    [ACTIONS.BILLING]: true,
    [ACTIONS.COLLECTION]: false,
    [ACTIONS.APPROVE]: false,
    [ACTIONS.CLOSE_LOCK_PROJECT]: false,
    [ACTIONS.DELETE_PROJECT]: false,
    [ACTIONS.VIEW_REPORTS]: true,
  },
  [ROLES.COLLECTING_OFFICER]: {
    [ACTIONS.REVENUE]: false,
    [ACTIONS.EXPENSES]: false,
    [ACTIONS.BILLING]: false,
    [ACTIONS.COLLECTION]: true,
    [ACTIONS.APPROVE]: false,
    [ACTIONS.CLOSE_LOCK_PROJECT]: false,
    [ACTIONS.DELETE_PROJECT]: false,
    [ACTIONS.VIEW_REPORTS]: true,
  },
  [ROLES.VIEWER]: {
    [ACTIONS.REVENUE]: false,
    [ACTIONS.EXPENSES]: false,
    [ACTIONS.BILLING]: false,
    [ACTIONS.COLLECTION]: false,
    [ACTIONS.APPROVE]: false,
    [ACTIONS.CLOSE_LOCK_PROJECT]: false,
    [ACTIONS.DELETE_PROJECT]: false,
    [ACTIONS.VIEW_REPORTS]: true,
  },
};

/**
 * Check if a role has permission for a specific action
 * @param {string} role - User role
 * @param {string} action - Action to check
 * @returns {boolean} - True if allowed, false otherwise
 */
export const hasPermission = (role, action) => {
  if (!role || !action) return false;
  
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  
  return permissions[action] === true;
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {Object} - Object with all permissions for the role
 */
export const getRolePermissions = (role) => {
  if (!role) return {};
  
  return ROLE_PERMISSIONS[role] || {};
};

/**
 * Check if user has any of the specified actions
 * @param {string} role - User role
 * @param {string[]} actions - Array of actions to check
 * @returns {boolean} - True if user has at least one of the actions
 */
export const hasAnyPermission = (role, actions) => {
  return actions.some(action => hasPermission(role, action));
};

/**
 * Check if user has all of the specified actions
 * @param {string} role - User role
 * @param {string[]} actions - Array of actions to check
 * @returns {boolean} - True if user has all of the actions
 */
export const hasAllPermissions = (role, actions) => {
  return actions.every(action => hasPermission(role, action));
};

/**
 * Get role display name
 * @param {string} role - Role code
 * @returns {string} - Display name
 */
export const getRoleDisplayName = (role) => {
  const roleNames = {
    [ROLES.MASTER_ADMIN]: 'Master Admin',
    [ROLES.SYSTEM_ADMIN]: 'System Administrator',
    [ROLES.REVENUE_OFFICER]: 'Revenue Officer',
    [ROLES.DISBURSING_OFFICER]: 'Disbursing Officer',
    [ROLES.BILLING_OFFICER]: 'Billing Officer',
    [ROLES.COLLECTING_OFFICER]: 'Collecting Officer',
    [ROLES.VIEWER]: 'Viewer',
  };
  
  return roleNames[role] || role;
};


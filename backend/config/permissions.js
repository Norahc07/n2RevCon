/**
 * Role-Based Permissions Configuration
 * 
 * This file defines the permissions matrix for different user roles.
 * Each role has specific actions they can perform.
 * 
 * Actions:
 * - revenue: Create, update, delete revenue entries
 * - expenses: Create, update, delete expense entries
 * - billing: Create, update, delete billing entries
 * - collection: Create, update, delete collection entries
 * - approve: Approve data entries (optional - user can decide if needed)
 * - closeLockProject: Close or lock projects
 * - viewReports: View dashboard and reports
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


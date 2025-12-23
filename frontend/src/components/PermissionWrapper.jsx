import { usePermissions } from '../hooks/usePermissions';
import { ACTIONS } from '../config/permissions';

/**
 * PermissionWrapper Component
 * Conditionally renders children based on user permissions
 * 
 * @param {Object} props
 * @param {string|string[]} props.action - Single action or array of actions to check
 * @param {boolean} props.requireAll - If true, requires all actions. If false (default), requires any action
 * @param {React.ReactNode} props.children - Content to render if permission check passes
 * @param {React.ReactNode} props.fallback - Optional content to render if permission check fails
 */
const PermissionWrapper = ({ 
  action, 
  requireAll = false, 
  children, 
  fallback = null 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = false;

  if (Array.isArray(action)) {
    // Multiple actions
    hasAccess = requireAll 
      ? hasAllPermissions(...action)
      : hasAnyPermission(...action);
  } else if (action) {
    // Single action
    hasAccess = hasPermission(action);
  } else {
    // No action specified, allow access
    hasAccess = true;
  }

  return hasAccess ? children : fallback;
};

export default PermissionWrapper;


# Role-Based Permission System Implementation

## Overview

A comprehensive role-based permission system has been implemented for the N2 RevCon PWA application. The system uses action-based permissions rather than simple role checks, providing fine-grained control over what each role can do.

## Roles Implemented

1. **Master Admin** (`master_admin`)
   - Full access to all features
   - Can manage users and assign roles
   - All actions allowed

2. **System Administrator** (`system_admin`)
   - Can approve data entries
   - Can close/lock projects
   - Can view reports
   - Cannot manage revenue, expenses, billing, or collections directly

3. **Revenue Officer** (`revenue_officer`)
   - Can manage revenue entries
   - Can view reports
   - No other permissions

4. **Disbursing Officer** (`disbursing_officer`)
   - Can manage expense entries
   - Can view reports
   - No other permissions

5. **Billing Officer** (`billing_officer`)
   - Can manage billing entries
   - Can view reports
   - No other permissions

6. **Collecting Officer** (`collecting_officer`)
   - Can manage collection entries
   - Can view reports
   - No other permissions

7. **Viewer** (`viewer`)
   - Can only view reports
   - No modification permissions
   - Default role for new registrations

## Actions Defined

- `revenue` - Create, update, delete revenue entries
- `expenses` - Create, update, delete expense entries
- `billing` - Create, update, delete billing entries
- `collection` - Create, update, delete collection entries
- `approve` - Approve data entries (currently implemented but can be removed if not needed)
- `closeLockProject` - Close or lock projects (also used for project deletion)
- `viewReports` - View dashboard and reports

## Implementation Details

### Backend Changes

1. **Permissions Configuration** (`backend/config/permissions.js`)
   - Centralized permission matrix
   - Helper functions for permission checks

2. **User Model** (`backend/models/User.model.js`)
   - Updated role enum to include all new roles
   - Default role changed from 'admin' to 'viewer'

3. **Auth Middleware** (`backend/middleware/auth.middleware.js`)
   - Added `requirePermission()` middleware for action-based checks
   - Added `requireAnyPermission()` for multiple action checks
   - Maintained backward compatibility with `authorize()` for role-based checks

4. **Routes Updated**
   - All routes now use permission-based authorization
   - Revenue routes require `REVENUE` permission for modifications
   - Expense routes require `EXPENSES` permission for modifications
   - Billing routes require `BILLING` permission for modifications
   - Collection routes require `COLLECTION` permission for modifications
   - Project routes require `CLOSE_LOCK_PROJECT` for delete/close/lock operations
   - Dashboard and export routes require `VIEW_REPORTS` permission

5. **Project Model** (`backend/models/Project.model.js`)
   - Added `isLocked`, `lockedAt`, and `lockedBy` fields
   - Added 'closed' status option

6. **Project Controller** (`backend/controllers/project.controller.js`)
   - Added `closeProject()`, `lockProject()`, and `unlockProject()` methods

7. **User Controller** (`backend/controllers/user.controller.js`)
   - Updated to allow role changes (only by master_admin)
   - Role validation added

8. **Auth Controller** (`backend/controllers/auth.controller.js`)
   - Registration now defaults to 'viewer' role instead of 'admin'

### Frontend Changes

1. **Permissions Configuration** (`frontend/src/config/permissions.js`)
   - Mirrors backend permissions configuration
   - Includes helper functions and role display names

2. **usePermissions Hook** (`frontend/src/hooks/usePermissions.js`)
   - React hook for easy permission checking
   - Provides convenient boolean flags for each permission

3. **PermissionWrapper Component** (`frontend/src/components/PermissionWrapper.jsx`)
   - Reusable component for conditional rendering based on permissions

4. **Sidebar Component** (`frontend/src/components/Sidebar.jsx`)
   - Updated to filter menu items based on permissions
   - Shows user's role display name instead of hardcoded "Administrator"

## Addressing Your Concerns

### 1. Master Admin vs System Admin

**Current Implementation:**
- **Master Admin**: Has all permissions, including user management and role assignment
- **System Admin**: Can approve, close/lock projects, and view reports, but cannot directly manage revenue/expenses/billing/collections

**Recommendation:**
These roles are kept separate as they serve different purposes:
- Master Admin = Full system administrator with user management
- System Admin = Project manager/approver who oversees but doesn't directly enter data

If you want to merge them, you can update the permissions matrix in `backend/config/permissions.js` and `frontend/src/config/permissions.js`.

### 2. Approve Role

**Current Status:**
The `approve` action is implemented in the permissions system but not actively used in routes yet. It's available for:
- System Administrator
- Master Admin

**Options:**
1. **Keep it**: Implement approval workflow where officers enter data, and system admins approve it
2. **Remove it**: If approval isn't needed, you can remove the `APPROVE` action from the permissions matrix
3. **Use project deletion instead**: As you mentioned, project deletion can serve as a form of approval/rejection

**Recommendation:**
Since you mentioned that approval might not be necessary with too much data, consider:
- Removing the approve action if not needed
- Using project deletion (which requires `CLOSE_LOCK_PROJECT` permission) as a way to reject/remove projects

### 3. Project Deletion vs Approval

**Current Implementation:**
- Project deletion requires `CLOSE_LOCK_PROJECT` permission
- This permission is available to Master Admin and System Admin
- Project deletion can serve as a way to reject/remove projects that don't meet criteria

**This aligns with your suggestion** that deletion can replace approval in some cases.

## Usage Examples

### Backend Route Protection

```javascript
// Require specific permission
router.post('/revenue', requirePermission(ACTIONS.REVENUE), createRevenue);

// Require any of multiple permissions
router.get('/reports', requireAnyPermission(ACTIONS.VIEW_REPORTS, ACTIONS.APPROVE), getReports);
```

### Frontend Permission Checks

```javascript
import { usePermissions } from '../hooks/usePermissions';

function MyComponent() {
  const { canAccessRevenue, canViewReports } = usePermissions();
  
  if (!canAccessRevenue) {
    return <div>Access Denied</div>;
  }
  
  return <div>Revenue Management</div>;
}
```

### Conditional Rendering

```jsx
import PermissionWrapper from '../components/PermissionWrapper';
import { ACTIONS } from '../config/permissions';

<PermissionWrapper action={ACTIONS.REVENUE}>
  <button>Add Revenue</button>
</PermissionWrapper>
```

## Migration Notes

1. **Existing Users**: Existing users with 'admin' role will need to be updated to 'master_admin' or another appropriate role
2. **Default Role**: New registrations default to 'viewer' role
3. **Role Assignment**: Only Master Admin can change user roles

## Next Steps

1. **Update Existing Users**: Run a migration script to update existing 'admin' users to 'master_admin'
2. **Decide on Approve Action**: Determine if approval workflow is needed or if it should be removed
3. **Test Permissions**: Test each role to ensure permissions work as expected
4. **Update UI**: Add permission checks to all relevant UI components

## Files Modified/Created

### Backend
- `backend/config/permissions.js` (NEW)
- `backend/models/User.model.js` (MODIFIED)
- `backend/models/Project.model.js` (MODIFIED)
- `backend/middleware/auth.middleware.js` (MODIFIED)
- `backend/controllers/auth.controller.js` (MODIFIED)
- `backend/controllers/user.controller.js` (MODIFIED)
- `backend/controllers/project.controller.js` (MODIFIED)
- `backend/routes/*.routes.js` (MODIFIED - all route files)

### Frontend
- `frontend/src/config/permissions.js` (NEW)
- `frontend/src/hooks/usePermissions.js` (NEW)
- `frontend/src/components/PermissionWrapper.jsx` (NEW)
- `frontend/src/components/Sidebar.jsx` (MODIFIED)


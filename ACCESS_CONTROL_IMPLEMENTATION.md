# Access Control System Implementation

## Overview

A comprehensive two-step access control system has been implemented for user registration:

1. **Email Verification** - Users must verify their email address
2. **Admin Approval** - Master Admin must approve accounts before they can log in

## Registration Flow

### Step 1: User Registration
1. User fills out registration form (firstName, lastName, email, password)
2. System creates account with:
   - `role`: 'viewer' (default)
   - `accountStatus`: 'pending'
   - `emailVerified`: false
   - `emailVerificationToken`: Generated token (expires in 24 hours)
3. Verification email is sent to user
4. User receives message: "Please check your email to verify your account"

### Step 2: Email Verification
1. User clicks verification link in email
2. System verifies token and sets `emailVerified: true`
3. User receives message: "Email verified! Your account is pending admin approval"
4. Master Admin is notified (logged in console)

### Step 3: Admin Approval
1. Master Admin views pending users at `/api/users/pending`
2. Admin reviews user information
3. Admin can:
   - **Approve**: Sets `accountStatus: 'approved'`, sends approval email
   - **Reject**: Sets `accountStatus: 'rejected'`, sends rejection email with reason

### Step 4: User Login
1. User attempts to log in
2. System checks:
   - ✅ Email is verified (`emailVerified: true`)
   - ✅ Account is approved (`accountStatus: 'approved'`)
   - ✅ Account is active (`isActive: true`)
3. If all checks pass, user can log in

## User Model Fields

### New Fields Added:
- `emailVerified` (Boolean) - Whether email has been verified
- `emailVerificationToken` (String) - Token for email verification
- `emailVerificationExpire` (Date) - Token expiration (24 hours)
- `accountStatus` (String) - 'pending', 'approved', or 'rejected'
- `approvedBy` (ObjectId) - Reference to admin who approved
- `approvedAt` (Date) - When account was approved
- `rejectedBy` (ObjectId) - Reference to admin who rejected
- `rejectedAt` (Date) - When account was rejected
- `rejectionReason` (String) - Reason for rejection

## API Endpoints

### Public Endpoints

#### POST `/api/auth/register`
- Register a new user
- Returns: User info (without token)
- Sends verification email

#### GET `/api/auth/verify-email/:token`
- Verify email address
- Token expires in 24 hours

#### POST `/api/auth/resend-verification`
- Resend verification email
- Body: `{ email: "user@example.com" }`

### Protected Endpoints (Master Admin Only)

#### GET `/api/users/pending`
- Get all pending users (email verified, awaiting approval)
- Requires: Master Admin role

#### POST `/api/users/:id/approve`
- Approve a pending user
- Requires: Master Admin role
- Sends approval email to user

#### POST `/api/users/:id/reject`
- Reject a pending user
- Requires: Master Admin role
- Body: `{ reason: "Optional rejection reason" }`
- Sends rejection email to user

## Login Restrictions

Users **cannot log in** if:
- ❌ Email is not verified (`emailVerified: false`)
- ❌ Account status is 'pending' (not yet approved)
- ❌ Account status is 'rejected'
- ❌ Account is deactivated (`isActive: false`)

## Email Templates

### 1. Email Verification Email
- **Subject**: "Verify Your Email - n2 RevCon"
- **Content**: Verification link, instructions
- **Expires**: 24 hours

### 2. Account Approval Email
- **Subject**: "Account Approved - n2 RevCon"
- **Content**: Congratulations, login button
- **Sent**: When admin approves account

### 3. Account Rejection Email
- **Subject**: "Account Registration Update - n2 RevCon"
- **Content**: Rejection notice, optional reason
- **Sent**: When admin rejects account

## Error Messages

### Registration
- "User already exists" - Email already registered

### Email Verification
- "Invalid or expired verification token" - Token invalid/expired

### Login
- "Please verify your email address before logging in" - Email not verified
- "Your account is pending approval" - Awaiting admin approval
- "Your account registration has been rejected" - Account was rejected

## Master Admin Workflow

1. **View Pending Users**
   ```
   GET /api/users/pending
   ```
   Returns list of users who:
   - Have verified their email
   - Are awaiting approval

2. **Review User Information**
   - Check user details (name, email, registration date)
   - Verify legitimacy

3. **Approve User**
   ```
   POST /api/users/:id/approve
   ```
   - Sets account to 'approved'
   - Activates account
   - Sends approval email

4. **Reject User** (if needed)
   ```
   POST /api/users/:id/reject
   Body: { reason: "Reason for rejection" }
   ```
   - Sets account to 'rejected'
   - Deactivates account
   - Sends rejection email with reason

## Security Features

1. **Email Verification Token**
   - Cryptographically secure random token
   - Hashed before storage
   - Expires in 24 hours

2. **Two-Step Verification**
   - Email verification (user action)
   - Admin approval (admin action)

3. **Role-Based Access**
   - Only Master Admin can approve/reject
   - Regular users cannot bypass approval

4. **Account Status Tracking**
   - Full audit trail (who approved/rejected, when)
   - Rejection reasons stored

## Frontend Implementation Notes

### Registration Page
- Show message: "Check your email to verify your account"
- Provide "Resend verification email" option

### Email Verification Page
- Route: `/verify-email/:token`
- Show success message
- Inform user about pending approval

### Login Page
- Check account status before allowing login
- Show appropriate error messages:
  - "Please verify your email"
  - "Account pending approval"
  - "Account rejected"

### Admin Dashboard
- Show pending users section
- Display user information
- Provide approve/reject buttons
- Show rejection reason input (for reject action)

## Testing the System

### 1. Register New User
```bash
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### 2. Verify Email (from email link)
```bash
GET /api/auth/verify-email/{token}
```

### 3. Login as Master Admin
```bash
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "adminpassword"
}
```

### 4. View Pending Users
```bash
GET /api/users/pending
Authorization: Bearer {admin_token}
```

### 5. Approve User
```bash
POST /api/users/{user_id}/approve
Authorization: Bearer {admin_token}
```

### 6. User Can Now Login
```bash
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

## Migration Notes

### Existing Users
- Existing users will have:
  - `emailVerified: false` (needs to be set to `true` manually or via migration)
  - `accountStatus: null` (needs to be set to 'approved' for active users)

### Migration Script
You may want to create a migration script to:
1. Set `emailVerified: true` for existing users
2. Set `accountStatus: 'approved'` for active users
3. Set `accountStatus: 'pending'` for inactive users

## Configuration

### Environment Variables
- `FRONTEND_URL` - Used for email links (default: http://localhost:5173)
- `EMAIL_FROM` - Email sender address
- SMTP configuration (for sending emails)

## Summary

This access control system ensures:
- ✅ Only verified email addresses can register
- ✅ All accounts require admin approval
- ✅ Clear communication with users via email
- ✅ Full audit trail of approvals/rejections
- ✅ Secure token-based verification
- ✅ Role-based access control

The system provides a secure, controlled registration process that prevents unauthorized access while maintaining a smooth user experience.


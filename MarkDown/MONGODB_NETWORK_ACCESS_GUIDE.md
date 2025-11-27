# How to Access Network Access in MongoDB Atlas

## 📍 Location of Network Access

**Network Access** is at the **PROJECT level**, not the cluster level.

## 🧭 Step-by-Step Navigation

### Method 1: From the Top Navigation Bar

1. **Look at the top breadcrumb bar** in your MongoDB Atlas dashboard
2. You should see: `ORGANIZATION Luigi's Org` → `PROJECT n2RevCon` → `CLUSTER n2RevCon`
3. **Click on "PROJECT n2RevCon"** (the dropdown in the breadcrumb)
4. This will show project-level options
5. Look for **"Network Access"** in the project menu

### Method 2: From the Left Sidebar

1. **Click on "Security"** in the left sidebar (if visible)
   - Network Access is usually under Security
2. If Security is not visible, look for:
   - **"Access Manager"** section
   - Or scroll down in the left sidebar

### Method 3: Direct URL

1. Go directly to: `https://cloud.mongodb.com/v2/[YOUR_PROJECT_ID]#/security/network/whitelist`
2. Replace `[YOUR_PROJECT_ID]` with your actual project ID
3. Or navigate: **Project Settings** → **Network Access**

### Method 4: Through Project Settings

1. Click on the **gear icon** (⚙️) or **"Project Settings"** 
   - Usually found in the top right or in the project dropdown
2. Look for **"Network Access"** or **"IP Access List"** in the settings menu

## 🎯 What You're Looking For

Once you find Network Access, you should see:
- A list of IP addresses (if any are configured)
- An **"Add IP Address"** button
- Options to add:
  - Specific IP addresses
  - IP ranges (CIDR notation)
  - **"Allow Access from Anywhere"** (0.0.0.0/0)

## ✅ Quick Action Steps

1. **Click on "PROJECT n2RevCon"** in the top breadcrumb
2. Look for **"Network Access"** or **"IP Access List"**
3. Click **"Add IP Address"**
4. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
5. Add a comment: "Render deployment"
6. Click **"Confirm"**
7. Wait 1-2 minutes for changes to apply

## 🔍 Alternative: Search Function

If you still can't find it:
1. Look for a **search bar** at the top
2. Type: **"Network Access"** or **"IP Whitelist"**
3. It should show you the direct link

## 📸 Visual Guide

The Network Access page typically shows:
- **IP Access List** as the title
- A table with columns: IP Address, Access List Entry, Comment, Status
- Green **"Add IP Address"** button (usually top right)
- Status indicators (Active/Inactive)

## ⚠️ Important Notes

- Network Access is **project-wide**, not cluster-specific
- Changes apply to all clusters in the project
- It may take 1-2 minutes for changes to take effect
- You need **Project Owner** or **Organization Owner** permissions

## 🆘 Still Can't Find It?

If you still can't locate Network Access:
1. Check your user permissions (you may need admin access)
2. Try accessing via direct URL (see Method 3 above)
3. Contact MongoDB Atlas support
4. Check if you're in the correct project/organization


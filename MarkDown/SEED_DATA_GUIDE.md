# How to Add Test Data to MongoDB Atlas for Dashboard Analytics

This guide will help you add test data to MongoDB Atlas so you can test the dashboard analytics.

## Method 1: Using the Seed Script (Recommended)

### Step 1: Run the Seed Script

The seed script will automatically create sample data for:
- Projects (with different statuses: pending, ongoing, completed)
- Revenue entries (distributed across months)
- Expense entries (distributed across months)
- Billing entries (with different statuses)
- Collection entries (with different statuses)

```bash
cd backend
node scripts/seedData.js
```

**Note:** Make sure your `backend/.env` file has the correct `MONGODB_URI` configured.

### Step 2: Verify Data

After running the script, you should see:
- ✅ 4 projects created
- ✅ Multiple revenue entries (distributed across months)
- ✅ Multiple expense entries (distributed across months)
- ✅ Multiple billing entries
- ✅ Multiple collection entries

## Method 2: Using MongoDB Atlas Web Interface

### Step 1: Access MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Sign in to your account
3. Select your cluster
4. Click **Browse Collections**

### Step 2: Add Projects

1. Navigate to your database (usually `test` or your database name)
2. Click **Create Collection** if `projects` doesn't exist
3. Click **Insert Document**
4. Use this sample project:

```json
{
  "projectCode": "PROJ-2025-001",
  "projectName": "Office Building Construction",
  "clientName": "ABC Corporation",
  "description": "Construction of a 10-story office building",
  "startDate": { "$date": "2025-01-15T00:00:00.000Z" },
  "endDate": { "$date": "2025-12-30T00:00:00.000Z" },
  "status": "ongoing",
  "contractAmount": 5000000,
  "location": "Downtown District",
  "createdAt": { "$date": "2025-01-01T00:00:00.000Z" },
  "updatedAt": { "$date": "2025-01-01T00:00:00.000Z" }
}
```

5. Create more projects with different statuses:
   - `status: "pending"` - for pending projects
   - `status: "ongoing"` - for ongoing projects
   - `status: "completed"` - for completed projects

### Step 3: Add Revenue Entries

1. Navigate to `revenue` collection
2. Insert documents like this:

```json
{
  "projectId": "<PROJECT_ID_FROM_STEP_2>",
  "description": "Revenue for January 2025",
  "amount": 50000,
  "date": { "$date": "2025-01-15T00:00:00.000Z" },
  "status": "confirmed",
  "category": "construction",
  "createdAt": { "$date": "2025-01-15T00:00:00.000Z" },
  "updatedAt": { "$date": "2025-01-15T00:00:00.000Z" }
}
```

3. Create multiple entries for different months (Jan-Dec) to see data in the Revenue vs Expenses chart

### Step 4: Add Expense Entries

1. Navigate to `expenses` collection
2. Insert documents like this:

```json
{
  "projectId": "<PROJECT_ID_FROM_STEP_2>",
  "description": "Material costs for January 2025",
  "amount": 40000,
  "date": { "$date": "2025-01-20T00:00:00.000Z" },
  "status": "approved",
  "category": "materials",
  "vendor": "ABC Supplies",
  "createdAt": { "$date": "2025-01-20T00:00:00.000Z" },
  "updatedAt": { "$date": "2025-01-20T00:00:00.000Z" }
}
```

### Step 5: Add Billing Entries

1. Navigate to `billing` collection
2. Insert documents like this:

```json
{
  "projectId": "<PROJECT_ID_FROM_STEP_2>",
  "invoiceNumber": "INV-2025-001",
  "billingDate": { "$date": "2025-01-01T00:00:00.000Z" },
  "dueDate": { "$date": "2025-01-31T00:00:00.000Z" },
  "totalAmount": 1250000,
  "status": "sent",
  "description": "Q1 2025 Billing",
  "createdAt": { "$date": "2025-01-01T00:00:00.000Z" },
  "updatedAt": { "$date": "2025-01-01T00:00:00.000Z" }
}
```

**Status options:**
- `"draft"` - for unbilled
- `"sent"` - for billed
- `"paid"` - for paid bills

### Step 6: Add Collection Entries

1. Navigate to `collections` collection
2. Insert documents like this:

```json
{
  "projectId": "<PROJECT_ID_FROM_STEP_2>",
  "billingId": "<BILLING_ID_FROM_STEP_5>",
  "collectionDate": { "$date": "2025-01-15T00:00:00.000Z" },
  "amount": 1250000,
  "status": "paid",
  "paymentMethod": "bank_transfer",
  "description": "Payment for INV-2025-001",
  "createdAt": { "$date": "2025-01-15T00:00:00.000Z" },
  "updatedAt": { "$date": "2025-01-15T00:00:00.000Z" }
}
```

**Status options:**
- `"paid"` - for paid collections
- `"unpaid"` - for unpaid collections
- `"uncollectible"` - for uncollectible collections

## Method 3: Using API Endpoints (Postman/Thunder Client)

### Step 1: Get Authentication Token

1. Register/Login via the frontend or API
2. Copy the JWT token from localStorage or API response

### Step 2: Create Projects

```http
POST http://localhost:5000/api/projects
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "projectCode": "PROJ-2025-001",
  "projectName": "Office Building Construction",
  "clientName": "ABC Corporation",
  "description": "Construction of a 10-story office building",
  "startDate": "2025-01-15",
  "endDate": "2025-12-30",
  "status": "ongoing",
  "contractAmount": 5000000,
  "location": "Downtown District"
}
```

### Step 3: Create Revenue

```http
POST http://localhost:5000/api/revenue
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "projectId": "PROJECT_ID_FROM_STEP_2",
  "description": "Revenue for January 2025",
  "amount": 50000,
  "date": "2025-01-15",
  "status": "confirmed",
  "category": "construction"
}
```

### Step 4: Create Expenses

```http
POST http://localhost:5000/api/expenses
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "projectId": "PROJECT_ID_FROM_STEP_2",
  "description": "Material costs",
  "amount": 40000,
  "date": "2025-01-20",
  "status": "approved",
  "category": "materials",
  "vendor": "ABC Supplies"
}
```

### Step 5: Create Billing

```http
POST http://localhost:5000/api/billing
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "projectId": "PROJECT_ID_FROM_STEP_2",
  "invoiceNumber": "INV-2025-001",
  "billingDate": "2025-01-01",
  "dueDate": "2025-01-31",
  "totalAmount": 1250000,
  "status": "sent",
  "description": "Q1 2025 Billing"
}
```

### Step 6: Create Collections

```http
POST http://localhost:5000/api/collections
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "projectId": "PROJECT_ID_FROM_STEP_2",
  "billingId": "BILLING_ID_FROM_STEP_5",
  "collectionDate": "2025-01-15",
  "amount": 1250000,
  "status": "paid",
  "paymentMethod": "bank_transfer",
  "description": "Payment for INV-2025-001"
}
```

## Quick Test Data Checklist

To see data in all dashboard charts, make sure you have:

### ✅ Project Status Chart
- [ ] At least 1 project with `status: "pending"`
- [ ] At least 1 project with `status: "ongoing"`
- [ ] At least 1 project with `status: "completed"`

### ✅ Revenue vs Expenses Chart
- [ ] Revenue entries for multiple months (Jan-Dec) in the current year
- [ ] Expense entries for multiple months (Jan-Dec) in the current year

### ✅ Billing Status Chart
- [ ] At least 1 billing with `status: "draft"` (Unbilled)
- [ ] At least 1 billing with `status: "sent"` or `"paid"` (Billed)

### ✅ Payment Status Chart
- [ ] At least 1 collection with `status: "paid"` (with amount > 0)
- [ ] At least 1 collection with `status: "unpaid"` (with amount > 0)
- [ ] At least 1 collection with `status: "uncollectible"` (with amount > 0)

## Tips for Better Test Data

1. **Use Current Year**: Make sure dates are in the current year (2025) to see data in the year filter
2. **Distribute Data**: Spread revenue and expenses across all 12 months to see trends
3. **Vary Amounts**: Use different amounts to see realistic charts
4. **Link Data**: Make sure collections reference valid billing IDs
5. **Status Variety**: Use different statuses to see all chart segments

## Troubleshooting

### No data showing in charts?
- Check that dates are in the current year
- Verify project statuses are: `pending`, `ongoing`, or `completed`
- Ensure billing statuses are: `draft`, `sent`, or `paid`
- Ensure collection statuses are: `paid`, `unpaid`, or `uncollectible`

### Charts showing zero?
- Check that amounts are greater than 0
- Verify the year filter matches your data dates
- Check browser console for API errors

### Payment Status showing counts instead of amounts?
- The backend should return `totalAmount` in the payment status
- Check that collection entries have `amount` field populated

## Next Steps

After adding test data:
1. Refresh your dashboard
2. Select the current year in the year filter
3. Check all charts are displaying data
4. Test the "View All" button for Project Status
5. Verify all summary cards show correct totals

Happy testing! 🎉


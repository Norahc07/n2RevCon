import ExcelJS from 'exceljs';
import Project from '../models/Project.model.js';
import Revenue from '../models/Revenue.model.js';
import Expense from '../models/Expense.model.js';
import Billing from '../models/Billing.model.js';
import Collection from '../models/Collection.model.js';

/**
 * @route   GET /api/export/projects
 * @desc    Export all projects to Excel
 * @access  Private
 */
export const exportProjects = async (req, res) => {
  try {
    const { year } = req.query;
    const userId = req.user._id;
    
    // Build filter - match Projects Description page behavior
    // Filter by user and exclude deleted projects
    const filter = { 
      createdBy: userId,
      deletedAt: null 
    };
    
    // Filter by year if provided - match frontend logic
    // Frontend checks: startYear === year || endYear === year || (startYear <= year && endYear >= year)
    if (year) {
      const yearNum = parseInt(year);
      // We'll filter in memory to match exact frontend logic, or use aggregation
      // For better performance, we'll fetch all user projects and filter in memory
      // This matches exactly what the frontend does
    }

    let projects = await Project.find(filter).sort({ createdAt: -1 });
    
    // Apply year filter to match frontend logic exactly
    if (year) {
      const yearNum = parseInt(year);
      projects = projects.filter((project) => {
        if (!project.startDate || !project.endDate) return false;
        const startYear = new Date(project.startDate).getFullYear();
        const endYear = new Date(project.endDate).getFullYear();
        return startYear === yearNum || endYear === yearNum || (startYear <= yearNum && endYear >= yearNum);
      });
    }

    if (projects.length === 0) {
      return res.status(404).json({ message: 'No projects found' });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'N2 RevCon';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Main Projects Sheet
    const projectsSheet = workbook.addWorksheet('Projects', {
      properties: {
        tabColor: { argb: 'FFDC2626' } // Red color
      }
    });

    // Define columns with proper widths
    projectsSheet.columns = [
      { header: 'Project Code', key: 'projectCode', width: 18 },
      { header: 'Project Name', key: 'projectName', width: 35 },
      { header: 'Client Name', key: 'clientName', width: 25 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Location', key: 'location', width: 25 },
      { header: 'Budget', key: 'budget', width: 15 },
      { header: 'Total Revenue', key: 'totalRevenue', width: 15 },
      { header: 'Start Date', key: 'startDate', width: 15 },
      { header: 'End Date', key: 'endDate', width: 15 },
      { header: 'Project Manager', key: 'projectManager', width: 20 },
      { header: 'Description', key: 'description', width: 50 },
    ];

      // Style header row
    const headerRow = projectsSheet.getRow(1);
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDC2626' } // Red background
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    headerRow.height = 25;
    
    // Add auto-filter to header row (all columns: A1 to K1 for 11 columns)
    projectsSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 11 }
    };

    // Get revenue, expense, billing, and collection data for all projects
    const projectIds = projects.map(p => p._id);
    const revenues = await Revenue.find({ 
      projectId: { $in: projectIds },
      createdBy: userId,
      status: { $ne: 'cancelled' }
    });
    const expenses = await Expense.find({ 
      projectId: { $in: projectIds },
      createdBy: userId,
      status: { $ne: 'cancelled' }
    });
    const billings = await Billing.find({ 
      projectId: { $in: projectIds },
      createdBy: userId
    });
    const collections = await Collection.find({ 
      projectId: { $in: projectIds },
      createdBy: userId
    });
    
    // Calculate totals per project
    const revenueMap = {};
    revenues.forEach(rev => {
      const projId = rev.projectId.toString();
      if (!revenueMap[projId]) {
        revenueMap[projId] = 0;
      }
      revenueMap[projId] += rev.amount || 0;
    });
    
    const expenseMap = {};
    expenses.forEach(exp => {
      const projId = exp.projectId.toString();
      if (!expenseMap[projId]) {
        expenseMap[projId] = 0;
      }
      expenseMap[projId] += exp.amount || 0;
    });
    
    const billingMap = {};
    billings.forEach(bill => {
      const projId = bill.projectId.toString();
      if (!billingMap[projId]) {
        billingMap[projId] = 0;
      }
      billingMap[projId] += bill.totalAmount || 0;
    });
    
    const collectionMap = {};
    collections.forEach(coll => {
      const projId = coll.projectId.toString();
      if (!collectionMap[projId]) {
        collectionMap[projId] = 0;
      }
      collectionMap[projId] += coll.amount || 0;
    });

    // Add project data
    projects.forEach((project, index) => {
      const totalRevenue = revenueMap[project._id.toString()] || 0;
      const row = projectsSheet.addRow({
        projectCode: project.projectCode || '',
        projectName: project.projectName || '',
        clientName: project.clientName || '',
        status: project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : '',
        location: project.location || '',
        budget: project.budget || 0,
        totalRevenue: totalRevenue,
        startDate: project.startDate ? new Date(project.startDate).toLocaleDateString('en-US') : '',
        endDate: project.endDate ? new Date(project.endDate).toLocaleDateString('en-US') : '',
        projectManager: project.projectManager || '',
        description: project.description || '',
      });

      // Alternate row colors for better readability
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' } // Light gray
        };
      }

      // Style status column with colors
      const statusCell = row.getCell('status');
      const status = project.status?.toLowerCase();
      if (status === 'completed') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD1FAE5' } // Light green
        };
        statusCell.font = { color: { argb: 'FF059669' }, bold: true };
      } else if (status === 'ongoing') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDBEAFE' } // Light blue
        };
        statusCell.font = { color: { argb: 'FF2563EB' }, bold: true };
      } else if (status === 'pending') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF3C7' } // Light yellow
        };
        statusCell.font = { color: { argb: 'FFD97706' }, bold: true };
      } else if (status === 'cancelled') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEE2E2' } // Light red
        };
        statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }

      // Format budget as currency
      const budgetCell = row.getCell('budget');
      budgetCell.numFmt = '₱#,##0.00';
      budgetCell.font = { color: { argb: 'FF059669' }, bold: true };
      
      // Format total revenue as currency
      const revenueCell = row.getCell('totalRevenue');
      revenueCell.numFmt = '₱#,##0.00';
      revenueCell.font = { color: { argb: 'FF10B981' }, bold: true };

      // Center align status
      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // Set row height
      row.height = 20;
    });

    // Format all cells
    projectsSheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
        if (rowNumber > 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
        }
      });
    });

    // Freeze header row
    projectsSheet.views = [
      { state: 'frozen', ySplit: 1 }
    ];

    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary', {
      properties: {
        tabColor: { argb: 'FF10B981' } // Green color
      }
    });

    // Calculate totals
    const totalProjects = projects.length;
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const statusCounts = projects.reduce((acc, p) => {
      const status = p.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Summary data
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 25 }
    ];

    const summaryHeaderRow = summarySheet.getRow(1);
    summaryHeaderRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    summaryHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' } // Green background
    };
    summaryHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
    summaryHeaderRow.height = 25;

    summarySheet.addRow({ metric: 'Total Projects', value: totalProjects });
    summarySheet.addRow({ metric: 'Total Budget', value: totalBudget });
    summarySheet.addRow({ metric: '', value: '' }); // Empty row
    summarySheet.addRow({ metric: 'Status Breakdown', value: '' });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      summarySheet.addRow({ metric: `  ${statusLabel}`, value: count });
    });

    // Format summary sheet
    summarySheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      const valueCell = row.getCell('value');
      
      // Format based on row content
      if (rowNumber === 2) {
        // Total Projects - number format
        valueCell.numFmt = '0';
        valueCell.font = { bold: true, size: 12 };
      } else if (rowNumber === 3) {
        // Total Budget - peso currency
        valueCell.numFmt = '₱#,##0.00';
        valueCell.font = { bold: true, size: 12 };
      } else if (rowNumber >= 5) {
        // Status Breakdown - number format (count of projects)
        valueCell.numFmt = '0';
      }
      
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
    });

    // Add Revenue vs Expenses Sheet
    const revenueExpenseSheet = workbook.addWorksheet('Revenue vs Expenses', {
      properties: {
        tabColor: { argb: 'FF3B82F6' } // Blue color
      }
    });

    revenueExpenseSheet.columns = [
      { header: 'Project Code', key: 'projectCode', width: 18 },
      { header: 'Project Name', key: 'projectName', width: 35 },
      { header: 'Client Name', key: 'clientName', width: 25 },
      { header: 'Total Revenue', key: 'totalRevenue', width: 18 },
      { header: 'Total Expenses', key: 'totalExpenses', width: 18 },
      { header: 'Net Income', key: 'netIncome', width: 18 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    const revExpHeaderRow = revenueExpenseSheet.getRow(1);
    revExpHeaderRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    revExpHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
    revExpHeaderRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    revExpHeaderRow.height = 25;

    revenueExpenseSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 7 }
    };

    projects.forEach((project, index) => {
      const projId = project._id.toString();
      const totalRevenue = revenueMap[projId] || 0;
      const totalExpenses = expenseMap[projId] || 0;
      const netIncome = totalRevenue - totalExpenses;
      
      const row = revenueExpenseSheet.addRow({
        projectCode: project.projectCode || '',
        projectName: project.projectName || '',
        clientName: project.clientName || '',
        totalRevenue: totalRevenue,
        totalExpenses: totalExpenses,
        netIncome: netIncome,
        status: project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : '',
      });

      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
      }

      // Format currency columns
      row.getCell('totalRevenue').numFmt = '₱#,##0.00';
      row.getCell('totalExpenses').numFmt = '₱#,##0.00';
      row.getCell('netIncome').numFmt = '₱#,##0.00';
      
      // Color net income based on positive/negative
      const netIncomeCell = row.getCell('netIncome');
      if (netIncome >= 0) {
        netIncomeCell.font = { color: { argb: 'FF059669' }, bold: true };
      } else {
        netIncomeCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }

      // Style status column
      const statusCell = row.getCell('status');
      const status = project.status?.toLowerCase();
      if (status === 'completed') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        statusCell.font = { color: { argb: 'FF059669' }, bold: true };
      } else if (status === 'ongoing') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
        statusCell.font = { color: { argb: 'FF2563EB' }, bold: true };
      } else if (status === 'pending') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        statusCell.font = { color: { argb: 'FFD97706' }, bold: true };
      } else if (status === 'cancelled') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }
      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };

      row.height = 20;
    });

    revenueExpenseSheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
        if (rowNumber > 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
        }
      });
    });

    revenueExpenseSheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Add Billing & Collections Sheet
    const billingCollectionSheet = workbook.addWorksheet('Billing & Collections', {
      properties: {
        tabColor: { argb: 'FF8B5CF6' } // Purple color
      }
    });

    billingCollectionSheet.columns = [
      { header: 'Project Code', key: 'projectCode', width: 18 },
      { header: 'Project Name', key: 'projectName', width: 35 },
      { header: 'Client Name', key: 'clientName', width: 25 },
      { header: 'Total Billed', key: 'totalBilled', width: 18 },
      { header: 'Total Collected', key: 'totalCollected', width: 18 },
      { header: 'Outstanding Balance', key: 'outstanding', width: 18 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    const billCollHeaderRow = billingCollectionSheet.getRow(1);
    billCollHeaderRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    billCollHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF8B5CF6' }
    };
    billCollHeaderRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    billCollHeaderRow.height = 25;

    billingCollectionSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 7 }
    };

    projects.forEach((project, index) => {
      const projId = project._id.toString();
      const totalBilled = billingMap[projId] || 0;
      const totalCollected = collectionMap[projId] || 0;
      const outstanding = totalBilled - totalCollected;
      
      const row = billingCollectionSheet.addRow({
        projectCode: project.projectCode || '',
        projectName: project.projectName || '',
        clientName: project.clientName || '',
        totalBilled: totalBilled,
        totalCollected: totalCollected,
        outstanding: outstanding,
        status: project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : '',
      });

      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
      }

      // Format currency columns
      row.getCell('totalBilled').numFmt = '₱#,##0.00';
      row.getCell('totalCollected').numFmt = '₱#,##0.00';
      row.getCell('outstanding').numFmt = '₱#,##0.00';
      
      // Color outstanding based on positive/negative
      const outstandingCell = row.getCell('outstanding');
      if (outstanding > 0) {
        outstandingCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      } else if (outstanding === 0) {
        outstandingCell.font = { color: { argb: 'FF059669' }, bold: true };
      } else {
        outstandingCell.font = { color: { argb: 'FF10B981' }, bold: true };
      }

      // Style status column
      const statusCell = row.getCell('status');
      const status = project.status?.toLowerCase();
      if (status === 'completed') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        statusCell.font = { color: { argb: 'FF059669' }, bold: true };
      } else if (status === 'ongoing') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
        statusCell.font = { color: { argb: 'FF2563EB' }, bold: true };
      } else if (status === 'pending') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        statusCell.font = { color: { argb: 'FFD97706' }, bold: true };
      } else if (status === 'cancelled') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }
      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };

      row.height = 20;
    });

    billingCollectionSheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
        if (rowNumber > 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
        }
      });
    });

    billingCollectionSheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    
    const filename = year 
      ? `projects_${year}_${Date.now()}.xlsx`
      : `projects_all_${Date.now()}.xlsx`;
    
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/export/project/:id
 * @desc    Export project report
 * @access  Private
 */
export const exportProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const revenues = await Revenue.find({ projectId: req.params.id });
    const expenses = await Expense.find({ projectId: req.params.id });
    const billings = await Billing.find({ projectId: req.params.id });
    const collections = await Collection.find({ projectId: req.params.id })
      .populate('billingId', 'invoiceNumber');

    const workbook = new ExcelJS.Workbook();
    
    // Project Info Sheet
    const projectSheet = workbook.addWorksheet('Project Info');
    projectSheet.columns = [
      { header: 'Field', key: 'field', width: 20 },
      { header: 'Value', key: 'value', width: 40 }
    ];
    projectSheet.addRows([
      { field: 'Project Code', value: project.projectCode },
      { field: 'Project Name', value: project.projectName },
      { field: 'Client Name', value: project.clientName },
      { field: 'Status', value: project.status },
      { field: 'Start Date', value: project.startDate },
      { field: 'End Date', value: project.endDate },
      { field: 'Budget', value: project.budget },
      { field: 'Description', value: project.description }
    ]);

    // Revenue Sheet
    const revenueSheet = workbook.addWorksheet('Revenue');
    revenueSheet.columns = [
      { header: 'Revenue Code', key: 'revenueCode', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    revenues.forEach(rev => {
      revenueSheet.addRow({
        revenueCode: rev.revenueCode,
        description: rev.description,
        amount: rev.amount,
        date: rev.date,
        category: rev.category,
        status: rev.status
      });
    });

    // Expense Sheet
    const expenseSheet = workbook.addWorksheet('Expenses');
    expenseSheet.columns = [
      { header: 'Expense Code', key: 'expenseCode', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Vendor', key: 'vendor', width: 20 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    expenses.forEach(exp => {
      expenseSheet.addRow({
        expenseCode: exp.expenseCode,
        description: exp.description,
        amount: exp.amount,
        date: exp.date,
        category: exp.category,
        vendor: exp.vendor,
        status: exp.status
      });
    });

    // Billing Sheet
    const billingSheet = workbook.addWorksheet('Billing');
    billingSheet.columns = [
      { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
      { header: 'Billing Date', key: 'billingDate', width: 15 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Tax', key: 'tax', width: 15 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    billings.forEach(bill => {
      billingSheet.addRow({
        invoiceNumber: bill.invoiceNumber,
        billingDate: bill.billingDate,
        dueDate: bill.dueDate,
        amount: bill.amount,
        tax: bill.tax,
        totalAmount: bill.totalAmount,
        status: bill.status
      });
    });

    // Collections Sheet
    const collectionSheet = workbook.addWorksheet('Collections');
    collectionSheet.columns = [
      { header: 'Collection Number', key: 'collectionNumber', width: 20 },
      { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
      { header: 'Collection Date', key: 'collectionDate', width: 15 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    collections.forEach(col => {
      collectionSheet.addRow({
        collectionNumber: col.collectionNumber,
        invoiceNumber: col.billingId?.invoiceNumber || '',
        collectionDate: col.collectionDate,
        amount: col.amount,
        paymentMethod: col.paymentMethod,
        status: col.status
      });
    });

    // Format currency columns
    [revenueSheet, expenseSheet, billingSheet, collectionSheet].forEach(sheet => {
      sheet.getColumn('amount').numFmt = '₱#,##0.00';
      if (sheet.getColumn('totalAmount')) {
        sheet.getColumn('totalAmount').numFmt = '₱#,##0.00';
      }
      if (sheet.getColumn('tax')) {
        sheet.getColumn('tax').numFmt = '₱#,##0.00';
      }
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=project_${project.projectCode}_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/export/revenue-costs
 * @desc    Export revenue vs expenses report
 * @access  Private
 */
export const exportRevenueCosts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const revenues = await Revenue.find(filter).populate('projectId', 'projectCode projectName');
    const expenses = await Expense.find(filter).populate('projectId', 'projectCode projectName');

    const workbook = new ExcelJS.Workbook();
    
    // Revenue Sheet
    const revenueSheet = workbook.addWorksheet('Revenue');
    revenueSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Project Code', key: 'projectCode', width: 15 },
      { header: 'Project Name', key: 'projectName', width: 30 },
      { header: 'Revenue Code', key: 'revenueCode', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Category', key: 'category', width: 15 }
    ];
    revenues.forEach(rev => {
      revenueSheet.addRow({
        date: rev.date,
        projectCode: rev.projectId?.projectCode || '',
        projectName: rev.projectId?.projectName || '',
        revenueCode: rev.revenueCode,
        description: rev.description,
        amount: rev.amount,
        category: rev.category
      });
    });

    // Expenses Sheet
    const expenseSheet = workbook.addWorksheet('Expenses');
    expenseSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Project Code', key: 'projectCode', width: 15 },
      { header: 'Project Name', key: 'projectName', width: 30 },
      { header: 'Expense Code', key: 'expenseCode', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Category', key: 'category', width: 15 }
    ];
    expenses.forEach(exp => {
      expenseSheet.addRow({
        date: exp.date,
        projectCode: exp.projectId?.projectCode || '',
        projectName: exp.projectId?.projectName || '',
        expenseCode: exp.expenseCode,
        description: exp.description,
        amount: exp.amount,
        category: exp.category
      });
    });

    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    summarySheet.columns = [
      { header: 'Item', key: 'item', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 }
    ];
    summarySheet.addRows([
      { item: 'Total Revenue', amount: totalRevenue },
      { item: 'Total Expenses', amount: totalExpenses },
      { item: 'Net Profit', amount: totalRevenue - totalExpenses }
    ]);

    revenueSheet.getColumn('amount').numFmt = '₱#,##0.00';
    expenseSheet.getColumn('amount').numFmt = '₱#,##0.00';
    summarySheet.getColumn('amount').numFmt = '₱#,##0.00';

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=revenue_costs_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/export/billing-collections
 * @desc    Export billing & collections report
 * @access  Private
 */
export const exportBillingCollections = async (req, res) => {
  try {
    const billings = await Billing.find().populate('projectId', 'projectCode projectName');
    const collections = await Collection.find()
      .populate('billingId', 'invoiceNumber')
      .populate('projectId', 'projectCode projectName');

    const workbook = new ExcelJS.Workbook();
    
    // Billing Sheet
    const billingSheet = workbook.addWorksheet('Billing');
    billingSheet.columns = [
      { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
      { header: 'Project Code', key: 'projectCode', width: 15 },
      { header: 'Project Name', key: 'projectName', width: 30 },
      { header: 'Billing Date', key: 'billingDate', width: 15 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Tax', key: 'tax', width: 15 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    billings.forEach(bill => {
      billingSheet.addRow({
        invoiceNumber: bill.invoiceNumber,
        projectCode: bill.projectId?.projectCode || '',
        projectName: bill.projectId?.projectName || '',
        billingDate: bill.billingDate,
        dueDate: bill.dueDate,
        amount: bill.amount,
        tax: bill.tax,
        totalAmount: bill.totalAmount,
        status: bill.status
      });
    });

    // Collections Sheet
    const collectionSheet = workbook.addWorksheet('Collections');
    collectionSheet.columns = [
      { header: 'Collection Number', key: 'collectionNumber', width: 20 },
      { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
      { header: 'Project Code', key: 'projectCode', width: 15 },
      { header: 'Collection Date', key: 'collectionDate', width: 15 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    collections.forEach(col => {
      collectionSheet.addRow({
        collectionNumber: col.collectionNumber,
        invoiceNumber: col.billingId?.invoiceNumber || '',
        projectCode: col.projectId?.projectCode || '',
        collectionDate: col.collectionDate,
        amount: col.amount,
        paymentMethod: col.paymentMethod,
        status: col.status
      });
    });

    billingSheet.getColumn('amount').numFmt = '₱#,##0.00';
    billingSheet.getColumn('tax').numFmt = '₱#,##0.00';
    billingSheet.getColumn('totalAmount').numFmt = '₱#,##0.00';
    collectionSheet.getColumn('amount').numFmt = '₱#,##0.00';

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=billing_collections_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/export/summary
 * @desc    Export full system summary
 * @access  Private (Admin only)
 */
export const exportSummary = async (req, res) => {
  try {
    const projects = await Project.find();
    const revenues = await Revenue.find();
    const expenses = await Expense.find();
    const billings = await Billing.find();
    const collections = await Collection.find();

    const workbook = new ExcelJS.Workbook();
    
    // Overview Sheet
    const overviewSheet = workbook.addWorksheet('Overview');
    overviewSheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];
    
    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalBilled = billings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalCollected = collections.reduce((sum, c) => sum + c.amount, 0);

    overviewSheet.addRows([
      { metric: 'Total Projects', value: projects.length },
      { metric: 'Total Revenue', value: totalRevenue },
      { metric: 'Total Expenses', value: totalExpenses },
      { metric: 'Net Profit', value: totalRevenue - totalExpenses },
      { metric: 'Total Billed', value: totalBilled },
      { metric: 'Total Collected', value: totalCollected },
      { metric: 'Outstanding', value: totalBilled - totalCollected }
    ]);

    overviewSheet.getColumn('value').numFmt = '₱#,##0.00';

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=system_summary_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


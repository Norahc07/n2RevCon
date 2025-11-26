import mongoose from 'mongoose';
import Project from '../models/Project.model.js';
import Revenue from '../models/Revenue.model.js';
import Expense from '../models/Expense.model.js';
import Billing from '../models/Billing.model.js';
import Collection from '../models/Collection.model.js';

/**
 * @route   GET /api/dashboard/summary
 * @desc    Get dashboard summary data
 * @access  Private
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const { year, viewAll } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const shouldFilterByYear = !viewAll && year;
    // Use _id (ObjectId) for MongoDB queries - Mongoose documents have _id as ObjectId
    const userId = req.user._id;
    
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59);
    
    // Debug: Check if collections exist for this user
    const totalCollections = await Collection.countDocuments({ createdBy: userId });
    const collectionsInYear = await Collection.countDocuments({ 
      createdBy: userId,
      collectionDate: { $gte: startDate, $lte: endDate }
    });
    console.log('Dashboard Debug:', { 
      userId: userId.toString(), 
      currentYear, 
      totalCollections, 
      collectionsInYear,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // Project status counts (filtered by year if not viewing all, and by user)
    const projectStatusMatch = { createdBy: userId };
    if (shouldFilterByYear) {
      projectStatusMatch.$or = [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
        { 
          $and: [
            { startDate: { $lte: startDate } },
            { endDate: { $gte: endDate } }
          ]
        }
      ];
    }
    
    const projectStatus = await Project.aggregate([
      {
        $match: projectStatusMatch
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Total revenue and expenses for the year
    const revenueData = await Revenue.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' },
          createdBy: userId
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const expenseData = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' },
          createdBy: userId
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Billing status (filtered by year and user)
    const billingStatus = await Billing.aggregate([
      {
        $match: {
          billingDate: { $gte: startDate, $lte: endDate },
          createdBy: userId
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Collection/Payment status (filtered by year and user)
    const paymentStatus = await Collection.aggregate([
      {
        $match: {
          collectionDate: { $gte: startDate, $lte: endDate },
          createdBy: userId
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Total revenue and expenses
    const totalRevenue = await Revenue.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' },
          createdBy: userId
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalExpenses = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' },
          createdBy: userId
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      year: currentYear,
      projectStatus: projectStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      revenueVsExpenses: {
        revenue: revenueData,
        expenses: expenseData
      },
      billingStatus: billingStatus.reduce((acc, item) => {
        acc[item._id] = { count: item.count, totalAmount: item.totalAmount };
        return acc;
      }, {}),
      paymentStatus: paymentStatus.reduce((acc, item) => {
        acc[item._id] = { count: item.count, totalAmount: item.totalAmount };
        return acc;
      }, {}),
      // Debug: include raw payment status data
      _debug: {
        paymentStatusRaw: paymentStatus,
        userId: userId.toString(),
        totalCollections,
        collectionsInYear
      },
      totals: {
        revenue: totalRevenue[0]?.total || 0,
        expenses: totalExpenses[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


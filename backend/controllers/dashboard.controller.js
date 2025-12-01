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
    
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

    // Project status counts (filtered by year if not viewing all, exclude deleted projects)
    const projectStatusMatch = { deletedAt: null };
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

    // Revenue and expenses grouped by project
    const revenueMatch = {
      status: { $ne: 'cancelled' }
    };
    if (shouldFilterByYear) {
      revenueMatch.date = { $gte: startDate, $lte: endDate };
    }

    const expenseMatch = {
      status: { $ne: 'cancelled' }
    };
    if (shouldFilterByYear) {
      expenseMatch.date = { $gte: startDate, $lte: endDate };
    }

    const revenueData = await Revenue.aggregate([
      {
        $match: revenueMatch
      },
      {
        $group: {
          _id: '$projectId',
          total: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'project'
        }
      },
      {
        $unwind: {
          path: '$project',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          total: 1,
          projectName: { $ifNull: ['$project.projectName', 'Unknown Project'] },
          projectCode: { $ifNull: ['$project.projectCode', 'N/A'] }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const expenseData = await Expense.aggregate([
      {
        $match: expenseMatch
      },
      {
        $group: {
          _id: '$projectId',
          total: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'project'
        }
      },
      {
        $unwind: {
          path: '$project',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          total: 1,
          projectName: { $ifNull: ['$project.projectName', 'Unknown Project'] },
          projectCode: { $ifNull: ['$project.projectCode', 'N/A'] }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Billing status (filtered by year)
    const billingStatus = await Billing.aggregate([
      {
        $match: {
          billingDate: { $gte: startDate, $lte: endDate }
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

    // Collection/Payment status (filtered by year)
    const paymentStatus = await Collection.aggregate([
      {
        $match: {
          collectionDate: { $gte: startDate, $lte: endDate }
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
          status: { $ne: 'cancelled' }
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
          status: { $ne: 'cancelled' }
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
      totals: {
        revenue: totalRevenue[0]?.total || 0,
        expenses: totalExpenses[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


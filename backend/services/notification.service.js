import Project from '../models/Project.model.js';
import Billing from '../models/Billing.model.js';
import Collection from '../models/Collection.model.js';
import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';
import CompanyProfile from '../models/CompanyProfile.model.js';

/**
 * Check and create notifications for:
 * - Projects ending based on configured timing (1, 2, 3, or custom days)
 * - Projects past end date not completed
 * - Billed but unpaid projects
 * - Completed but unbilled projects
 */
export const checkNotifications = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get company profile for notification settings
    let companyProfile = await CompanyProfile.findOne();
    const notificationConfig = companyProfile?.notificationConfig || {
      enabled: true,
      projectEndDate: true,
      timing: { timingType: '3', customDays: null }
    };

    // If notifications are disabled, skip
    if (!notificationConfig.enabled || !notificationConfig.projectEndDate) {
      console.log('Notifications are disabled in system settings');
      return;
    }

    // Get all active users
    const users = await User.find({ isActive: true });

    // 1. Check projects ending based on configured timing
    const timing = notificationConfig.timing || { timingType: '3', customDays: null };
    let daysToCheck = [];

    // Determine which days to check based on timing configuration
    if (timing.timingType === 'custom' && timing.customDays) {
      daysToCheck = [parseInt(timing.customDays)];
    } else {
      // Convert timingType to number
      const configuredDays = parseInt(timing.timingType) || 3;
      daysToCheck = [configuredDays];
    }

    // Get the maximum days to check for query optimization
    const maxDays = Math.max(...daysToCheck, 3);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + maxDays);
    maxDate.setHours(23, 59, 59, 999);

    const projectsEnding = await Project.find({
      status: { $in: ['pending', 'ongoing'] },
      endDate: {
        $gte: today,
        $lte: maxDate
      }
    });

    for (const project of projectsEnding) {
      const daysUntilEnd = Math.ceil((project.endDate - today) / (1000 * 60 * 60 * 24));
      
      // Only send notification if it matches the configured timing
      if (daysToCheck.includes(daysUntilEnd)) {
        for (const user of users) {
          // Check user's notification preferences
          if (user.preferences?.notifications?.projectDeadline === false) {
            continue; // Skip if user has disabled project deadline notifications
          }

          // Check if notification already exists
          const existing = await Notification.findOne({
            userId: user._id,
            type: 'project_end_date',
            relatedId: project._id,
            relatedModel: 'Project',
            createdAt: { $gte: today }
          });

          if (!existing) {
            await Notification.create({
              userId: user._id,
              type: 'project_end_date',
              title: `Project Ending in ${daysUntilEnd} Day${daysUntilEnd > 1 ? 's' : ''}`,
              message: `Project "${project.projectName}" (${project.projectCode}) is ending in ${daysUntilEnd} day${daysUntilEnd > 1 ? 's' : ''}.`,
              relatedId: project._id,
              relatedModel: 'Project',
              priority: daysUntilEnd === 1 ? 'urgent' : daysUntilEnd === 2 ? 'high' : 'medium',
              actionUrl: `/projects/${project._id}`
            });
          }
        }
      }
    }

    // 2. Check projects past end date not completed
    if (notificationConfig.projectEndDate) {
      const overdueProjects = await Project.find({
        status: { $in: ['pending', 'ongoing'] },
        endDate: { $lt: today }
      });

      for (const project of overdueProjects) {
        for (const user of users) {
          // Check user's notification preferences
          if (user.preferences?.notifications?.projectDeadline === false) {
            continue;
          }

          const existing = await Notification.findOne({
            userId: user._id,
            type: 'project_overdue',
            relatedId: project._id,
            relatedModel: 'Project',
            createdAt: { $gte: today }
          });

          if (!existing) {
            await Notification.create({
              userId: user._id,
              type: 'project_overdue',
              title: 'Project Overdue',
              message: `Project "${project.projectName}" (${project.projectCode}) has passed its end date and is not marked as completed.`,
              relatedId: project._id,
              relatedModel: 'Project',
              priority: 'urgent',
              actionUrl: `/projects/${project._id}`
            });
          }
        }
      }
    }

    // 3. Check billed but unpaid projects
    if (notificationConfig.billingFollowUp) {
      const billings = await Billing.find({
        status: { $in: ['sent', 'overdue'] }
      }).populate('projectId');

      for (const billing of billings) {
        const collections = await Collection.find({ billingId: billing._id });
        const totalCollected = collections.reduce((sum, c) => sum + c.amount, 0);
        const isUnpaid = totalCollected < billing.totalAmount;

        if (isUnpaid) {
          for (const user of users) {
            // Check user's notification preferences
            if (user.preferences?.notifications?.billingFollowUp === false) {
              continue;
            }

            const existing = await Notification.findOne({
              userId: user._id,
              type: 'billing_unpaid',
              relatedId: billing._id,
              relatedModel: 'Billing',
              createdAt: { $gte: today }
            });

            if (!existing) {
              await Notification.create({
                userId: user._id,
                type: 'billing_unpaid',
                title: 'Unpaid Invoice',
                message: `Invoice ${billing.invoiceNumber} for project "${billing.projectId?.projectName}" is billed but unpaid.`,
                relatedId: billing._id,
                relatedModel: 'Billing',
                priority: billing.status === 'overdue' ? 'urgent' : 'high',
                actionUrl: `/projects/${billing.projectId?._id}/billing`
              });
            }
          }
        }
      }
    }

    // 4. Check completed but unbilled projects
    if (notificationConfig.unpaidAfterCompletion) {
      const completedProjects = await Project.find({ status: 'completed' });

      for (const project of completedProjects) {
        const billings = await Billing.find({ projectId: project._id });
        
        if (billings.length === 0) {
          for (const user of users) {
            // Check user's notification preferences
            if (user.preferences?.notifications?.paymentOverdue === false) {
              continue;
            }

            const existing = await Notification.findOne({
              userId: user._id,
              type: 'project_unbilled',
              relatedId: project._id,
              relatedModel: 'Project',
              createdAt: { $gte: today }
            });

            if (!existing) {
              await Notification.create({
                userId: user._id,
                type: 'project_unbilled',
                title: 'Completed Project Unbilled',
                message: `Project "${project.projectName}" (${project.projectCode}) is completed but has no billing records.`,
                relatedId: project._id,
                relatedModel: 'Project',
                priority: 'medium',
                actionUrl: `/projects/${project._id}/billing`
              });
            }
          }
        }
      }
    }

    console.log('Notification check completed successfully');
  } catch (error) {
    console.error('Error in notification service:', error);
    throw error;
  }
};


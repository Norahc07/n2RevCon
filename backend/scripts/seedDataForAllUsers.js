import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project.model.js';
import Revenue from '../models/Revenue.model.js';
import Expense from '../models/Expense.model.js';
import Billing from '../models/Billing.model.js';
import Collection from '../models/Collection.model.js';
import User from '../models/User.model.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || '')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    seedDataForAllUsers();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

async function seedDataForAllUsers() {
  try {
    console.log('🌱 Starting to seed data for ALL users...\n');

    // Get all users from database
    const allUsers = await User.find({});
    
    if (allUsers.length === 0) {
      console.log('⚠️  No users found in database. Please register an account first.');
      process.exit(0);
    }

    console.log(`📋 Found ${allUsers.length} user(s) in database:`);
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.firstName} ${user.lastName})`);
    });
    console.log('');

    // Get current year
    const currentYear = new Date().getFullYear();

    // Process each user
    for (const user of allUsers) {
      console.log(`\n👤 Processing data for: ${user.email}...`);
      try {
        const result = await createSeedDataForUser(user._id, currentYear);
        console.log(`   ✅ Created: ${result.projects} projects, ${result.revenue} revenue, ${result.expenses} expenses, ${result.billings} billings, ${result.collections} collections`);
      } catch (error) {
        console.error(`   ❌ Error creating data for ${user.email}:`, error.message);
      }
    }

    console.log('\n🎉 Data seeding completed for all users!');
    console.log('\n📊 Summary:');
    console.log(`   - Users processed: ${allUsers.length}`);
    console.log(`   - Each user has: Projects, Revenue, Expenses, Billings, Collections`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    process.exit(1);
  }
}

async function createSeedDataForUser(userId, currentYear) {
  try {
    // 1. Create or update Projects
    const projectData = [
      {
        projectCode: `PROJ-${currentYear}-001`,
        projectName: 'Office Building Construction',
        clientName: 'ABC Corporation',
        description: 'Construction of a 10-story office building in downtown area',
        startDate: new Date(currentYear, 0, 15),
        endDate: new Date(currentYear, 11, 30),
        status: 'ongoing',
        budget: 5000000,
        location: 'Downtown District',
        createdBy: userId,
      },
      {
        projectCode: `PROJ-${currentYear}-002`,
        projectName: 'Residential Complex',
        clientName: 'XYZ Developers',
        description: 'Construction of 50-unit residential complex',
        startDate: new Date(currentYear, 1, 1),
        endDate: new Date(currentYear, 10, 15),
        status: 'completed',
        budget: 8000000,
        location: 'Suburban Area',
        createdBy: userId,
      },
      {
        projectCode: `PROJ-${currentYear}-003`,
        projectName: 'Shopping Mall Renovation',
        clientName: 'Retail Group Inc',
        description: 'Complete renovation of existing shopping mall',
        startDate: new Date(currentYear, 2, 1),
        endDate: new Date(currentYear + 1, 5, 30),
        status: 'pending',
        budget: 3000000,
        location: 'City Center',
        createdBy: userId,
      },
      {
        projectCode: `PROJ-${currentYear - 1}-001`,
        projectName: 'Highway Extension',
        clientName: 'Department of Transportation',
        description: 'Extension of highway by 20 kilometers',
        startDate: new Date(currentYear - 1, 6, 1),
        endDate: new Date(currentYear, 3, 30),
        status: 'completed',
        budget: 12000000,
        location: 'Highway Route 101',
        createdBy: userId,
      },
    ];

    const projects = [];
    for (const projectInfo of projectData) {
      // Use a unique project code per user by adding user ID
      const uniqueProjectCode = `${projectInfo.projectCode}-${userId.toString().slice(-6)}`;
      
      let project = await Project.findOne({ 
        projectCode: uniqueProjectCode,
        createdBy: userId 
      });
      
      if (!project) {
        project = await Project.create({
          ...projectInfo,
          projectCode: uniqueProjectCode,
        });
        console.log(`   ✅ Created project: ${project.projectCode}`);
      } else {
        Object.assign(project, projectInfo);
        project.projectCode = uniqueProjectCode;
        await project.save();
        console.log(`   ✅ Updated project: ${project.projectCode}`);
      }
      projects.push(project);
    }

    // 2. Clear and recreate Revenue entries
    await Revenue.deleteMany({ createdBy: userId });
    const revenueEntries = [];
    const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    let revenueCounter = 1;
    
    projects.forEach((project) => {
      months.forEach((month) => {
        if (project.status === 'completed' || (project.status === 'ongoing' && month <= new Date().getMonth())) {
          revenueEntries.push({
            projectId: project._id,
            revenueCode: `REV-${project.projectCode}-${String(revenueCounter).padStart(3, '0')}`,
            description: `Revenue for ${project.projectName} - Month ${month + 1}`,
            amount: Math.floor((project.budget * 0.1) / 12) + Math.floor(Math.random() * 10000),
            date: new Date(currentYear, month, 15),
            status: 'confirmed',
            category: 'service',
            createdBy: userId,
          });
          revenueCounter++;
        }
      });
    });
    
    if (revenueEntries.length > 0) {
      await Revenue.insertMany(revenueEntries);
      console.log(`   ✅ Created ${revenueEntries.length} revenue entries`);
    }

    // 3. Clear and recreate Expense entries
    await Expense.deleteMany({ createdBy: userId });
    const expenseEntries = [];
    let expenseCounter = 1;
    
    projects.forEach((project, projectIndex) => {
      months.forEach((month) => {
        if (project.status === 'completed' || (project.status === 'ongoing' && month <= new Date().getMonth())) {
          expenseEntries.push({
            projectId: project._id,
            expenseCode: `EXP-${project.projectCode}-${String(expenseCounter).padStart(3, '0')}`,
            description: `Expense for ${project.projectName} - Month ${month + 1}`,
            amount: Math.floor((project.budget * 0.08) / 12) + Math.floor(Math.random() * 5000),
            date: new Date(currentYear, month, 20),
            status: 'approved',
            category: 'materials',
            vendor: `Vendor ${projectIndex + 1}`,
            createdBy: userId,
          });
          expenseCounter++;
        }
      });
    });
    
    if (expenseEntries.length > 0) {
      await Expense.insertMany(expenseEntries);
      console.log(`   ✅ Created ${expenseEntries.length} expense entries`);
    }

    // 4. Clear and recreate Billing entries
    await Billing.deleteMany({ createdBy: userId });
    await Collection.deleteMany({ createdBy: userId });
    
    const savedBillings = [];
    let invoiceCounter = 1;
    
    for (const project of projects) {
      for (let i = 0; i < 4; i++) {
        const billingDate = new Date(currentYear, i * 3, 1);
        const statuses = ['draft', 'sent', 'paid'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const amount = Math.floor(project.budget * 0.25) + Math.floor(Math.random() * 50000);
        const invoiceNumber = `INV-${currentYear}-${String(invoiceCounter).padStart(4, '0')}-${userId.toString().slice(-4)}`;
        
        let billing = await Billing.findOne({ invoiceNumber, createdBy: userId });
        if (!billing) {
          billing = await Billing.create({
            projectId: project._id,
            invoiceNumber: invoiceNumber,
            billingDate: billingDate,
            dueDate: new Date(billingDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            amount: amount,
            tax: Math.floor(amount * 0.1),
            totalAmount: amount + Math.floor(amount * 0.1),
            status: status,
            description: `Billing ${i + 1} for ${project.projectName}`,
            createdBy: userId,
          });
        } else {
          Object.assign(billing, {
            projectId: project._id,
            billingDate: billingDate,
            dueDate: new Date(billingDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            amount: amount,
            tax: Math.floor(amount * 0.1),
            totalAmount: amount + Math.floor(amount * 0.1),
            status: status,
            description: `Billing ${i + 1} for ${project.projectName}`,
            createdBy: userId,
          });
          await billing.save();
        }
        savedBillings.push(billing);
        invoiceCounter++;
      }
    }
    console.log(`   ✅ Created/updated ${savedBillings.length} billing entries`);

    // 5. Create Collection entries
    await Collection.deleteMany({ createdBy: userId });
    
    const collectionEntries = [];
    let collectionCounter = 1;
    
    const yearStart = new Date(currentYear, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    
    for (let index = 0; index < savedBillings.length; index++) {
      const billing = savedBillings[index];
      
      let collectionDate = new Date(billing.billingDate.getTime() + 15 * 24 * 60 * 60 * 1000);
      
      const billingYear = billing.billingDate.getFullYear();
      
      if (billingYear === currentYear) {
        if (collectionDate > yearEnd) {
          collectionDate = new Date(currentYear, 11, 15);
        }
        if (collectionDate < yearStart) {
          collectionDate = new Date(currentYear, 0, 15);
        }
      } else {
        const month = (index * 3) % 12;
        collectionDate = new Date(currentYear, month, 15);
      }
      
      if (collectionDate < yearStart || collectionDate > yearEnd) {
        collectionDate = new Date(currentYear, Math.floor(index / 4) % 12, 15);
      }
      
      const collectionNumber = `COL-${currentYear}-${String(collectionCounter).padStart(4, '0')}-${userId.toString().slice(-4)}`;
      
      let status;
      const statusDistribution = index % 10;
      if (statusDistribution < 4) {
        status = 'paid';
      } else if (statusDistribution < 8) {
        status = 'unpaid';
      } else {
        status = 'uncollectible';
      }
      
      if (billing.status === 'paid') {
        status = 'paid';
      }
      
      try {
        const collection = await Collection.create({
          projectId: billing.projectId,
          billingId: billing._id,
          collectionNumber: collectionNumber,
          collectionDate: collectionDate,
          amount: billing.totalAmount,
          status: status,
          paymentMethod: status === 'paid' ? 'bank_transfer' : 'other',
          referenceNumber: status === 'paid' ? `REF-${String(collectionCounter).padStart(4, '0')}` : null,
          notes: `Collection for ${billing.invoiceNumber}`,
          createdBy: userId,
        });
        
        collectionEntries.push({
          _id: collection._id,
          status: collection.status,
          amount: collection.amount,
        });
        
        collectionCounter++;
      } catch (error) {
        if (error.code === 11000) {
          collectionCounter++;
          const newCollectionNumber = `COL-${currentYear}-${String(collectionCounter).padStart(4, '0')}-${userId.toString().slice(-4)}`;
          try {
            const collection = await Collection.create({
              projectId: billing.projectId,
              billingId: billing._id,
              collectionNumber: newCollectionNumber,
              collectionDate: collectionDate,
              amount: billing.totalAmount,
              status: status,
              paymentMethod: status === 'paid' ? 'bank_transfer' : 'other',
              referenceNumber: status === 'paid' ? `REF-${String(collectionCounter).padStart(4, '0')}` : null,
              notes: `Collection for ${billing.invoiceNumber}`,
              createdBy: userId,
            });
            collectionEntries.push({
              _id: collection._id,
              status: collection.status,
              amount: collection.amount,
            });
            collectionCounter++;
          } catch (retryError) {
            console.error(`   ⚠️  Failed to create collection for ${billing.invoiceNumber}:`, retryError.message);
          }
        } else {
          console.error(`   ⚠️  Failed to create collection for ${billing.invoiceNumber}:`, error.message);
        }
      }
    }
    
    if (collectionEntries.length > 0) {
      console.log(`   ✅ Created ${collectionEntries.length} collection entries`);
      
      const paidCount = collectionEntries.filter(c => c.status === 'paid').length;
      const unpaidCount = collectionEntries.filter(c => c.status === 'unpaid').length;
      const uncollectibleCount = collectionEntries.filter(c => c.status === 'uncollectible').length;
      
      console.log(`   📊 Payment Status: Paid(${paidCount}), Unpaid(${unpaidCount}), Uncollectible(${uncollectibleCount})`);
    }
    
    return {
      projects: projects.length,
      revenue: revenueEntries.length,
      expenses: expenseEntries.length,
      billings: savedBillings.length,
      collections: collectionEntries.length,
    };
  } catch (error) {
    console.error(`   ❌ Error creating data for user:`, error.message);
    throw error;
  }
}


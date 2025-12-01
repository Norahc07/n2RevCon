import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Project from '../models/Project.model.js';
import Revenue from '../models/Revenue.model.js';
import Expense from '../models/Expense.model.js';
import Billing from '../models/Billing.model.js';
import Collection from '../models/Collection.model.js';
import Notification from '../models/Notification.model.js';
import AuditLog from '../models/AuditLog.model.js';

// Load environment variables
dotenv.config({ path: '.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/n2revcon').then(() => {
  console.log('✅ Connected to MongoDB');
  wipeAndSeed();
}).catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

async function wipeAndSeed() {
  try {
    console.log('🗑️  Starting to wipe all data...\n');

    // Delete all data (except keep admin users)
    console.log('   Deleting Projects...');
    await Project.deleteMany({});
    console.log('   ✅ Deleted all projects');

    console.log('   Deleting Revenues...');
    await Revenue.deleteMany({});
    console.log('   ✅ Deleted all revenues');

    console.log('   Deleting Expenses...');
    await Expense.deleteMany({});
    console.log('   ✅ Deleted all expenses');

    console.log('   Deleting Billings...');
    await Billing.deleteMany({});
    console.log('   ✅ Deleted all billings');

    console.log('   Deleting Collections...');
    await Collection.deleteMany({});
    console.log('   ✅ Deleted all collections');

    console.log('   Deleting Notifications...');
    await Notification.deleteMany({});
    console.log('   ✅ Deleted all notifications');

    console.log('   Deleting Audit Logs...');
    await AuditLog.deleteMany({});
    console.log('   ✅ Deleted all audit logs');

    console.log('\n🌱 Starting to seed new data (2019-2025, 30+ projects per year)...\n');

    // Get or create a test user
    let testUser = await User.findOne({ email: 'admin@n2revcon.com' });
    if (!testUser) {
      testUser = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@n2revcon.com',
        password: 'admin123456',
        role: 'admin',
      });
      console.log('✅ Created admin user');
    } else {
      console.log('✅ Using existing admin user');
    }

    const userId = testUser._id;

    // Project templates for variety
    const projectTypes = [
      { name: 'Commercial Building', prefix: 'COM', baseBudget: 15000000 },
      { name: 'Residential Complex', prefix: 'RES', baseBudget: 12000000 },
      { name: 'Shopping Mall', prefix: 'MALL', baseBudget: 20000000 },
      { name: 'Industrial Warehouse', prefix: 'WH', baseBudget: 8000000 },
      { name: 'Office Tower', prefix: 'OFF', baseBudget: 18000000 },
      { name: 'Hotel Development', prefix: 'HTL', baseBudget: 25000000 },
      { name: 'Hospital Facility', prefix: 'HSP', baseBudget: 30000000 },
      { name: 'School Building', prefix: 'SCH', baseBudget: 10000000 },
      { name: 'Road Construction', prefix: 'RD', baseBudget: 5000000 },
      { name: 'Bridge Construction', prefix: 'BRG', baseBudget: 12000000 },
      { name: 'Apartment Complex', prefix: 'APT', baseBudget: 15000000 },
      { name: 'Retail Center', prefix: 'RET', baseBudget: 10000000 },
      { name: 'Parking Facility', prefix: 'PKG', baseBudget: 6000000 },
      { name: 'Sports Complex', prefix: 'SPT', baseBudget: 22000000 },
      { name: 'Mixed-Use Development', prefix: 'MXD', baseBudget: 35000000 },
    ];

    const clientNames = [
      'ABC Corporation', 'XYZ Developers', 'Prime Real Estate Corp', 'Metro Construction Inc',
      'Global Builders Ltd', 'Pacific Development Group', 'Urban Planning Associates',
      'Elite Properties', 'Summit Construction', 'Apex Builders', 'Noble Developers',
      'Crown Realty', 'Diamond Properties', 'Platinum Construction', 'Gold Builders',
      'Silver Developers', 'Bronze Construction', 'Titan Properties', 'Phoenix Builders',
      'Eagle Construction', 'Lion Developers', 'Tiger Properties', 'Bear Builders',
      'Wolf Construction', 'Fox Developers', 'Hawk Properties', 'Falcon Builders',
      'Thunder Construction', 'Lightning Developers', 'Storm Properties', 'Rain Builders',
      'Sun Construction', 'Moon Developers', 'Star Properties', 'Sky Builders',
    ];

    const locations = [
      'Metro Manila', 'Quezon City', 'Makati', 'BGC Taguig', 'Mandaluyong',
      'Pasig', 'Manila', 'Pasay', 'Las Pinas', 'Paranaque', 'Muntinlupa',
      'Marikina', 'San Juan', 'Valenzuela', 'Caloocan', 'Malabon', 'Navotas',
      'Cavite', 'Laguna', 'Rizal', 'Bulacan', 'Pampanga', 'Batangas',
      'Subic', 'Clark', 'Cebu City', 'Davao City', 'Iloilo City', 'Bacolod',
    ];

    const projectManagers = [
      'John Smith', 'Maria Garcia', 'Robert Johnson', 'Sarah Williams', 'Michael Chen',
      'Jennifer Lee', 'David Brown', 'Lisa Anderson', 'James Wilson', 'Patricia Martinez',
      'William Taylor', 'Linda Thomas', 'Richard Jackson', 'Barbara White', 'Joseph Harris',
      'Elizabeth Martin', 'Thomas Thompson', 'Susan Garcia', 'Charles Martinez', 'Jessica Robinson',
    ];

    const statuses = ['pending', 'ongoing', 'completed', 'cancelled'];
    const statusWeights = [0.15, 0.40, 0.40, 0.05]; // More ongoing and completed

    // Generate projects for each year (2019-2025)
    const savedProjects = [];
    const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
    
    console.log('📁 Creating projects (30+ per year from 2019-2025)...');
    
    for (const year of years) {
      const projectsPerYear = 30 + Math.floor(Math.random() * 10); // 30-39 projects per year
      console.log(`\n   📅 Year ${year}: Creating ${projectsPerYear} projects...`);
      
      for (let i = 1; i <= projectsPerYear; i++) {
        const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
        const clientName = clientNames[Math.floor(Math.random() * clientNames.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        const projectManager = projectManagers[Math.floor(Math.random() * projectManagers.length)];
        
        // Determine status based on year and project number
        let status;
        const rand = Math.random();
        if (year < 2023) {
          // Older projects more likely to be completed
          status = rand < 0.7 ? 'completed' : rand < 0.9 ? 'ongoing' : 'cancelled';
        } else if (year === 2025) {
          // 2025 projects more likely to be pending or ongoing
          status = rand < 0.3 ? 'pending' : rand < 0.8 ? 'ongoing' : 'completed';
        } else {
          // 2023-2024 mix
          status = rand < 0.4 ? 'completed' : rand < 0.85 ? 'ongoing' : 'pending';
        }
        
        // Generate dates
        const startMonth = Math.floor(Math.random() * 12);
        const startDay = Math.floor(Math.random() * 28) + 1;
        const startDate = new Date(year, startMonth, startDay);
        
        // Duration: 6 months to 3 years
        const durationMonths = 6 + Math.floor(Math.random() * 30);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + durationMonths);
        
        // Budget with variation
        const budgetVariation = 0.7 + (Math.random() * 0.6); // 70% to 130% of base
        const budget = Math.floor(projectType.baseBudget * budgetVariation);
        
        // Variable considerations
        const retentionPercent = 5 + Math.floor(Math.random() * 15); // 5-20%
        const variableConsiderations = [
          `${retentionPercent}% retention`,
          `${retentionPercent}% retention, ${Math.floor(Math.random() * 10) + 5}% bonus for early completion`,
          `${retentionPercent}% retention, penalty for delays`,
          `${retentionPercent}% retention, milestone-based payments`,
          `${retentionPercent}% retention, performance bonus`,
        ][Math.floor(Math.random() * 5)];
        
        // Notes
        const notesOptions = [
          'Project progressing well. Client satisfied with quality.',
          'On schedule. No major issues reported.',
          'Minor delays due to weather conditions.',
          'Ahead of schedule. Excellent performance.',
          'Requires additional resources for completion.',
          'Client requested design changes.',
          'Project completed successfully.',
          'Awaiting final permits and approvals.',
          'Foundation work completed. Structural work in progress.',
          'Phase 1 completed. Currently working on Phase 2.',
        ];
        const notes = status === 'completed' 
          ? 'Project completed successfully. Client very satisfied.'
          : notesOptions[Math.floor(Math.random() * notesOptions.length)];
        
        const projectData = {
          projectCode: `${projectType.prefix}-${year}-${String(i).padStart(3, '0')}`,
          projectName: `${projectType.name} - ${location}`,
          clientName: clientName,
          description: `${projectType.name} project located in ${location}. High-quality construction with modern amenities.`,
          startDate: startDate,
          endDate: endDate,
          status: status,
          budget: budget,
          location: `${location}, Philippines`,
          projectManager: projectManager,
          variableConsiderations: variableConsiderations,
          notes: notes,
          createdBy: userId,
        };
        
        const project = await Project.create(projectData);
        savedProjects.push(project);
        
        if (i % 10 === 0) {
          console.log(`      ✅ Created ${i}/${projectsPerYear} projects for ${year}`);
        }
      }
      console.log(`   ✅ Completed ${year}: ${projectsPerYear} projects created`);
    }
    
    console.log(`\n📊 Total projects created: ${savedProjects.length}`);

    // Create revenue entries for each project
    console.log('\n💰 Creating revenue entries...');
    const revenueEntries = [];
    const revenueCategories = ['service', 'product', 'consultation', 'other'];
    const revenueStatuses = ['recorded', 'confirmed', 'cancelled'];
    let revenueProgress = 0;

    for (const project of savedProjects) {
      const projectStart = new Date(project.startDate);
      const projectEnd = new Date(project.endDate);
      const monthsDiff = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24 * 30));
      // Generate 8-15 revenue entries per project
      const revenueCount = Math.min(8 + Math.floor(Math.random() * 8), monthsDiff);

      for (let i = 0; i < revenueCount; i++) {
        const revenueDate = new Date(projectStart);
        revenueDate.setMonth(revenueDate.getMonth() + Math.floor((i * monthsDiff) / revenueCount));
        
        // Amount based on project budget (1-5% of budget per revenue entry)
        const budgetPercent = (0.01 + Math.random() * 0.04);
        const amount = Math.floor(project.budget * budgetPercent);
        
        const revenue = await Revenue.create({
          projectId: project._id,
          revenueCode: `REV-${project.projectCode}-${String(i + 1).padStart(3, '0')}`,
          description: `Revenue entry ${i + 1} for ${project.projectName}`,
          amount: amount,
          date: revenueDate,
          category: revenueCategories[Math.floor(Math.random() * revenueCategories.length)],
          status: revenueStatuses[Math.floor(Math.random() * 2)], // recorded or confirmed
          notes: i % 3 === 0 ? `Payment received for milestone ${i + 1}` : '',
          createdBy: userId,
        });
        revenueEntries.push(revenue);
      }
      
      revenueProgress++;
      if (revenueProgress % 50 === 0) {
        console.log(`      ✅ Processed ${revenueProgress}/${savedProjects.length} projects for revenue`);
      }
    }
    console.log(`   ✅ Created ${revenueEntries.length} revenue entries`);

    // Create expense entries for each project
    console.log('\n💸 Creating expense entries...');
    const expenseEntries = [];
    const expenseCategories = ['labor', 'materials', 'equipment', 'travel', 'overhead', 'other'];
    const expenseStatuses = ['pending', 'approved', 'paid', 'cancelled'];
    let expenseProgress = 0;

    for (const project of savedProjects) {
      const projectStart = new Date(project.startDate);
      const projectEnd = new Date(project.endDate);
      const monthsDiff = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24 * 30));
      // Generate 10-20 expense entries per project
      const expenseCount = Math.min(10 + Math.floor(Math.random() * 11), monthsDiff);

      for (let i = 0; i < expenseCount; i++) {
        const expenseDate = new Date(projectStart);
        expenseDate.setMonth(expenseDate.getMonth() + Math.floor((i * monthsDiff) / expenseCount));
        
        // Amount based on project budget (0.5-3% of budget per expense entry)
        const budgetPercent = (0.005 + Math.random() * 0.025);
        const amount = Math.floor(project.budget * budgetPercent);
        
        const expense = await Expense.create({
          projectId: project._id,
          expenseCode: `EXP-${project.projectCode}-${String(i + 1).padStart(3, '0')}`,
          description: `Expense entry ${i + 1} for ${project.projectName}`,
          amount: amount,
          date: expenseDate,
          category: expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
          status: expenseStatuses[Math.floor(Math.random() * 3)], // pending, approved, or paid
          notes: i % 4 === 0 ? `Expense for materials and supplies` : '',
          createdBy: userId,
        });
        expenseEntries.push(expense);
      }
      
      expenseProgress++;
      if (expenseProgress % 50 === 0) {
        console.log(`      ✅ Processed ${expenseProgress}/${savedProjects.length} projects for expenses`);
      }
    }
    console.log(`   ✅ Created ${expenseEntries.length} expense entries`);

    // Create billing entries for each project
    console.log('\n📄 Creating billing entries...');
    const billingEntries = [];
    const billingStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    let billingProgress = 0;

    for (const project of savedProjects) {
      const projectStart = new Date(project.startDate);
      const projectEnd = new Date(project.endDate);
      const monthsDiff = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24 * 30));
      // Billing every 2-4 months, 5-12 billings per project
      const billingInterval = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4 months
      const billingCount = Math.min(Math.floor(monthsDiff / billingInterval), 12);

      for (let i = 0; i < billingCount; i++) {
        const billingDate = new Date(projectStart);
        billingDate.setMonth(billingDate.getMonth() + (i * billingInterval));
        
        const dueDate = new Date(billingDate);
        dueDate.setMonth(dueDate.getMonth() + 1);
        
        // Amount based on project budget (5-15% of budget per billing)
        const budgetPercent = (0.05 + Math.random() * 0.10);
        const amount = Math.floor(project.budget * budgetPercent);
        const tax = Math.floor(amount * 0.12); // 12% tax
        const totalAmount = amount + tax;
        
        // Status based on project status and date
        let status;
        if (project.status === 'completed') {
          status = Math.random() > 0.1 ? 'paid' : 'sent';
        } else if (project.status === 'cancelled') {
          status = 'cancelled';
        } else {
          status = billingStatuses[Math.floor(Math.random() * billingStatuses.length)];
        }
        
        const billing = await Billing.create({
          projectId: project._id,
          invoiceNumber: `INV-${project.projectCode}-${String(i + 1).padStart(3, '0')}`,
          billingDate: billingDate,
          dueDate: dueDate,
          amount: amount,
          tax: tax,
          totalAmount: totalAmount,
          status: status,
          description: `Invoice ${i + 1} for ${project.projectName} - Progress billing`,
          notes: `Billing period: ${billingDate.toLocaleDateString()} to ${dueDate.toLocaleDateString()}`,
          createdBy: userId,
        });
        billingEntries.push(billing);
      }
      
      billingProgress++;
      if (billingProgress % 50 === 0) {
        console.log(`      ✅ Processed ${billingProgress}/${savedProjects.length} projects for billing`);
      }
    }
    console.log(`   ✅ Created ${billingEntries.length} billing entries`);

    // Create collection entries for each billing
    console.log('\n💵 Creating collection entries...');
    const collectionEntries = [];
    const paymentMethods = ['cash', 'check', 'bank_transfer', 'credit_card', 'other'];
    const collectionStatuses = ['paid', 'unpaid', 'partial', 'uncollectible'];
    let collectionProgress = 0;

    for (const billing of billingEntries) {
      // Create 1-2 collections per billing
      const collectionCount = Math.random() > 0.4 ? 1 : 2;
      
      for (let i = 0; i < collectionCount; i++) {
        const collectionDate = new Date(billing.billingDate);
        collectionDate.setDate(collectionDate.getDate() + (i * 15)); // 15 days apart
        
        let amount;
        let status;
        if (collectionCount === 1) {
          // Single payment - full or partial
          if (billing.status === 'paid') {
            amount = billing.totalAmount;
            status = 'paid';
          } else if (billing.status === 'overdue') {
            amount = Math.floor(billing.totalAmount * (0.3 + Math.random() * 0.5)); // 30-80%
            status = Math.random() > 0.3 ? 'partial' : 'unpaid';
          } else {
            amount = billing.totalAmount;
            status = Math.random() > 0.2 ? 'paid' : 'partial';
          }
        } else {
          // Multiple payments
          if (i === 0) {
            amount = Math.floor(billing.totalAmount * 0.6); // First payment 60%
            status = 'paid';
          } else {
            amount = billing.totalAmount - Math.floor(billing.totalAmount * 0.6); // Remaining 40%
            status = billing.status === 'paid' ? 'paid' : (Math.random() > 0.3 ? 'paid' : 'unpaid');
          }
        }
        
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const collection = await Collection.create({
          billingId: billing._id,
          projectId: billing.projectId,
          collectionNumber: `COL-${billing.invoiceNumber}-${String(i + 1).padStart(2, '0')}`,
          collectionDate: collectionDate,
          amount: amount,
          paymentMethod: paymentMethod,
          status: status,
          notes: status === 'paid' ? `Payment received via ${paymentMethod}` : 'Pending payment',
          createdBy: userId,
        });
        collectionEntries.push(collection);
      }
      
      collectionProgress++;
      if (collectionProgress % 100 === 0) {
        console.log(`      ✅ Processed ${collectionProgress}/${billingEntries.length} billings for collections`);
      }
    }
    console.log(`   ✅ Created ${collectionEntries.length} collection entries`);

    console.log('\n🎉 Data wipe and seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Projects: ${savedProjects.length}`);
    console.log(`   - Revenue entries: ${revenueEntries.length}`);
    console.log(`   - Expense entries: ${expenseEntries.length}`);
    console.log(`   - Billing entries: ${billingEntries.length}`);
    console.log(`   - Collection entries: ${collectionEntries.length}`);
    console.log('\n✨ Sample data for 2019-2025 has been created!');
    console.log(`\n🔑 Admin User Credentials:`);
    console.log(`   Email: admin@n2revcon.com`);
    console.log(`   Password: admin123456`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error wiping/seeding data:', error);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    process.exit(1);
  }
}


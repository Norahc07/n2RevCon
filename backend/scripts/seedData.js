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
    seedData();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

async function seedData() {
  try {
    console.log('🌱 Starting to seed data...');

    // Get or create a test user
    let testUser = await User.findOne({ email: 'test@n2revcon.com' });
    if (!testUser) {
      testUser = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@n2revcon.com',
        password: 'test123456',
        role: 'admin',
      });
      console.log('✅ Created test user');
    } else {
      console.log('✅ Using existing test user');
    }

    const userId = testUser._id;

    // Get current year
    const currentYear = new Date().getFullYear();

    // 1. Create or update Projects (automatically handle duplicates)
    console.log('📁 Creating/updating projects...');
    const projectData = [
      {
        projectCode: 'PROJ-2025-001',
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
        projectCode: 'PROJ-2025-002',
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
        projectCode: 'PROJ-2025-003',
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
        projectCode: 'PROJ-2024-001',
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
      let project = await Project.findOne({ projectCode: projectInfo.projectCode });
      if (!project) {
        project = await Project.create(projectInfo);
        console.log(`   ✅ Created project: ${project.projectCode}`);
      } else {
        // Update existing project
        Object.assign(project, projectInfo);
        await project.save();
        console.log(`   ✅ Updated project: ${project.projectCode}`);
      }
      projects.push(project);
    }
    console.log(`✅ Processed ${projects.length} projects`);

    // 2. Clear and recreate Revenue entries (for clean data)
    console.log('💰 Creating revenue entries...');
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
      console.log(`✅ Created ${revenueEntries.length} revenue entries`);
    }

    // 3. Clear and recreate Expense entries
    console.log('💸 Creating expense entries...');
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
      console.log(`✅ Created ${expenseEntries.length} expense entries`);
    }

    // 4. Clear and recreate Billing entries (get IDs properly)
    console.log('📄 Creating billing entries...');
    await Billing.deleteMany({ createdBy: userId });
    await Collection.deleteMany({ createdBy: userId }); // Clear collections first since they depend on billings
    
    const savedBillings = [];
    let invoiceCounter = 1;
    
    for (const project of projects) {
      // Create multiple billings per project
      for (let i = 0; i < 4; i++) {
        const billingDate = new Date(currentYear, i * 3, 1);
        const statuses = ['draft', 'sent', 'paid'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const amount = Math.floor(project.budget * 0.25) + Math.floor(Math.random() * 50000);
        const invoiceNumber = `INV-${currentYear}-${String(invoiceCounter).padStart(4, '0')}`;
        
        // Check if invoice already exists
        let billing = await Billing.findOne({ invoiceNumber });
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
          // Update existing billing
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
    console.log(`✅ Created/updated ${savedBillings.length} billing entries`);

    // 5. Create Collection entries (using saved billing IDs) - Ensure good distribution of payment statuses
    console.log('💵 Creating collection entries...');
    
    // Clear existing collections first
    await Collection.deleteMany({ createdBy: userId });
    
    const collectionEntries = [];
    let collectionCounter = 1;
    
    // Ensure collection dates are within the current year
    const yearStart = new Date(currentYear, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    
    // Create collections for all billings with proper date handling
    for (let index = 0; index < savedBillings.length; index++) {
      const billing = savedBillings[index];
      
      // Calculate collection date (15 days after billing)
      let collectionDate = new Date(billing.billingDate.getTime() + 15 * 24 * 60 * 60 * 1000);
      
      // Ensure collection date is within the current year for dashboard filtering
      const billingYear = billing.billingDate.getFullYear();
      
      // If billing is in current year, ensure collection is also in current year
      if (billingYear === currentYear) {
        // If collection date exceeds year end, cap it at year end
        if (collectionDate > yearEnd) {
          collectionDate = new Date(currentYear, 11, 15); // Mid-December
        }
        // If collection date is before year start (shouldn't happen), set to year start
        if (collectionDate < yearStart) {
          collectionDate = new Date(currentYear, 0, 15); // Mid-January
        }
      } else {
        // For billings in other years, distribute collections across the current year
        const month = (index * 3) % 12; // Distribute across months
        collectionDate = new Date(currentYear, month, 15);
      }
      
      // Final check: ensure date is definitely within year range
      if (collectionDate < yearStart || collectionDate > yearEnd) {
        collectionDate = new Date(currentYear, Math.floor(index / 4) % 12, 15);
      }
      
      const collectionNumber = `COL-${currentYear}-${String(collectionCounter).padStart(4, '0')}`;
      
      // Distribute payment statuses: 40% paid, 40% unpaid, 20% uncollectible
      let status;
      const statusDistribution = index % 10;
      if (statusDistribution < 4) {
        status = 'paid';
      } else if (statusDistribution < 8) {
        status = 'unpaid';
      } else {
        status = 'uncollectible';
      }
      
      // If billing is already paid, make collection paid
      if (billing.status === 'paid') {
        status = 'paid';
      }
      
      // Create collection entry
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
        // If collection number already exists, try with a different number
        if (error.code === 11000) {
          collectionCounter++;
          const newCollectionNumber = `COL-${currentYear}-${String(collectionCounter).padStart(4, '0')}`;
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
      console.log(`✅ Created ${collectionEntries.length} collection entries`);
      
      // Show payment status distribution
      const paidCount = collectionEntries.filter(c => c.status === 'paid').length;
      const unpaidCount = collectionEntries.filter(c => c.status === 'unpaid').length;
      const uncollectibleCount = collectionEntries.filter(c => c.status === 'uncollectible').length;
      const paidAmount = collectionEntries.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
      const unpaidAmount = collectionEntries.filter(c => c.status === 'unpaid').reduce((sum, c) => sum + c.amount, 0);
      const uncollectibleAmount = collectionEntries.filter(c => c.status === 'uncollectible').reduce((sum, c) => sum + c.amount, 0);
      
      console.log(`   📊 Payment Status Distribution:`);
      console.log(`      - Paid: ${paidCount} entries ($${paidAmount.toLocaleString()})`);
      console.log(`      - Unpaid: ${unpaidCount} entries ($${unpaidAmount.toLocaleString()})`);
      console.log(`      - Uncollectible: ${uncollectibleCount} entries ($${uncollectibleAmount.toLocaleString()})`);
    } else {
      console.log('   ⚠️  No collection entries were created');
    }

    console.log('\n🎉 Data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Revenue entries: ${revenueEntries.length}`);
    console.log(`   - Expense entries: ${expenseEntries.length}`);
    console.log(`   - Billing entries: ${savedBillings.length}`);
    console.log(`   - Collection entries: ${collectionEntries.length}`);
    console.log('\n✨ You can now test the dashboard analytics!');
    console.log(`\n🔑 Test User Credentials:`);
    console.log(`   Email: test@n2revcon.com`);
    console.log(`   Password: test123456`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    process.exit(1);
  }
}

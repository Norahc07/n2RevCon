import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project.model.js';
import Revenue from '../models/Revenue.model.js';
import Expense from '../models/Expense.model.js';
import Billing from '../models/Billing.model.js';
import Collection from '../models/Collection.model.js';

// Load environment variables
dotenv.config({ path: '.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/n2revcon').then(() => {
  console.log('✅ Connected to MongoDB');
  remove2026Data();
}).catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

async function remove2026Data() {
  try {
    console.log('🗑️  Starting to remove all 2026 data...\n');

    const year2026Start = new Date(2026, 0, 1); // January 1, 2026
    const year2026End = new Date(2026, 11, 31, 23, 59, 59); // December 31, 2026

    // 1. Update projects with endDate in 2026 - cap them at Dec 31, 2025
    console.log('📁 Checking projects with endDate in 2026...');
    const projects2026 = await Project.find({
      $or: [
        { endDate: { $gte: year2026Start, $lte: year2026End } },
        { startDate: { $gte: year2026Start, $lte: year2026End } }
      ]
    });
    
    if (projects2026.length > 0) {
      console.log(`   Found ${projects2026.length} projects with dates in 2026`);
      for (const project of projects2026) {
        const updates = {};
        if (project.endDate && project.endDate >= year2026Start) {
          updates.endDate = new Date(2025, 11, 31);
        }
        if (project.startDate && project.startDate >= year2026Start) {
          // If startDate is in 2026, move it to late 2025
          updates.startDate = new Date(2025, 10, 15); // November 15, 2025
          if (!updates.endDate) {
            updates.endDate = new Date(2025, 11, 31);
          }
        }
        await Project.findByIdAndUpdate(project._id, updates);
      }
      console.log(`   ✅ Updated ${projects2026.length} projects to cap dates at 2025`);
    } else {
      console.log('   ✅ No projects with 2026 dates found');
    }

    // 2. Update revenues with date in 2026
    console.log('\n💰 Checking revenue records with date in 2026...');
    const revenue2026 = await Revenue.find({
      date: { $gte: year2026Start, $lte: year2026End }
    });
    
    if (revenue2026.length > 0) {
      console.log(`   Found ${revenue2026.length} revenue records with dates in 2026`);
      await Revenue.updateMany(
        { date: { $gte: year2026Start, $lte: year2026End } },
        { $set: { date: new Date(2025, 11, 31) } }
      );
      console.log(`   ✅ Updated ${revenue2026.length} revenue records to Dec 31, 2025`);
    } else {
      console.log('   ✅ No revenue records with 2026 dates found');
    }

    // 3. Update expenses with date in 2026
    console.log('\n💸 Checking expense records with date in 2026...');
    const expense2026 = await Expense.find({
      date: { $gte: year2026Start, $lte: year2026End }
    });
    
    if (expense2026.length > 0) {
      console.log(`   Found ${expense2026.length} expense records with dates in 2026`);
      await Expense.updateMany(
        { date: { $gte: year2026Start, $lte: year2026End } },
        { $set: { date: new Date(2025, 11, 31) } }
      );
      console.log(`   ✅ Updated ${expense2026.length} expense records to Dec 31, 2025`);
    } else {
      console.log('   ✅ No expense records with 2026 dates found');
    }

    // 4. Update billings with billingDate or dueDate in 2026
    console.log('\n📄 Checking billing records with dates in 2026...');
    const billing2026 = await Billing.find({
      $or: [
        { billingDate: { $gte: year2026Start, $lte: year2026End } },
        { dueDate: { $gte: year2026Start, $lte: year2026End } }
      ]
    });
    
    if (billing2026.length > 0) {
      console.log(`   Found ${billing2026.length} billing records with dates in 2026`);
      for (const billing of billing2026) {
        const updates = {};
        if (billing.billingDate && billing.billingDate >= year2026Start) {
          updates.billingDate = new Date(2025, 11, 31);
        }
        if (billing.dueDate && billing.dueDate >= year2026Start) {
          updates.dueDate = new Date(2025, 11, 31);
        }
        await Billing.findByIdAndUpdate(billing._id, updates);
      }
      console.log(`   ✅ Updated ${billing2026.length} billing records to cap dates at 2025`);
    } else {
      console.log('   ✅ No billing records with 2026 dates found');
    }

    // 5. Update collections with collectionDate in 2026
    console.log('\n💵 Checking collection records with date in 2026...');
    const collection2026 = await Collection.find({
      collectionDate: { $gte: year2026Start, $lte: year2026End }
    });
    
    if (collection2026.length > 0) {
      console.log(`   Found ${collection2026.length} collection records with dates in 2026`);
      await Collection.updateMany(
        { collectionDate: { $gte: year2026Start, $lte: year2026End } },
        { $set: { collectionDate: new Date(2025, 11, 31) } }
      );
      console.log(`   ✅ Updated ${collection2026.length} collection records to Dec 31, 2025`);
    } else {
      console.log('   ✅ No collection records with 2026 dates found');
    }

    console.log('\n✨ All 2026 data has been removed/updated to 2025!');
    console.log('\n📊 Summary:');
    console.log(`   - Projects updated: ${projects2026.length}`);
    console.log(`   - Revenue records updated: ${revenue2026.length}`);
    console.log(`   - Expense records updated: ${expense2026.length}`);
    console.log(`   - Billing records updated: ${billing2026.length}`);
    console.log(`   - Collection records updated: ${collection2026.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error removing 2026 data:', error);
    process.exit(1);
  }
}







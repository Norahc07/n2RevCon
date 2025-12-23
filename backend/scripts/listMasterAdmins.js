import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Script to list all master admin users
 * Usage: node scripts/listMasterAdmins.js
 */
async function listMasterAdmins() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find all master admins
    const masterAdmins = await User.find({ role: 'master_admin' })
      .select('email firstName lastName accountStatus emailVerified isActive createdAt')
      .sort({ createdAt: 1 });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 MASTER ADMIN USERS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (masterAdmins.length === 0) {
      console.log('⚠️  No master admin users found in the database.');
      console.log('\n💡 To create a master admin, update a user\'s role to "master_admin" in the database or through the System Settings page.\n');
    } else {
      console.log(`Found ${masterAdmins.length} master admin user(s):\n`);
      
      masterAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.firstName} ${admin.lastName}`);
        console.log(`   📧 Email: ${admin.email}`);
        console.log(`   ✅ Email Verified: ${admin.emailVerified ? 'Yes' : 'No'}`);
        console.log(`   📊 Account Status: ${admin.accountStatus || 'N/A'}`);
        console.log(`   🔒 Active: ${admin.isActive ? 'Yes' : 'No'}`);
        console.log(`   📅 Created: ${admin.createdAt ? new Date(admin.createdAt).toLocaleString() : 'N/A'}`);
        console.log('');
      });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n📋 Email List (for easy copying):');
      masterAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email}`);
      });
      console.log('');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

listMasterAdmins();


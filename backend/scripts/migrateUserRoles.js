import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.model.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend root directory
dotenv.config({ path: join(__dirname, '..', '.env') });

// Validate MongoDB URI before connecting
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MONGODB_URI is not set in environment variables');
  console.error('   Please make sure you have a .env file in the backend directory with MONGODB_URI');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    migrateUserRoles();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    if (error.message.includes('Invalid scheme')) {
      console.error('\n💡 Tip: Make sure MONGODB_URI starts with "mongodb://" or "mongodb+srv://"');
    }
    process.exit(1);
  });

async function migrateUserRoles() {
  try {
    console.log('🔧 Starting user role migration...\n');

    // Update users with 'admin' role to 'master_admin'
    const result = await User.updateMany(
      { role: 'admin' },
      { $set: { role: 'master_admin' } },
      { runValidators: true }
    );

    console.log(`✅ Updated ${result.modifiedCount} user(s) from 'admin' to 'master_admin'`);

    // List all users and their roles
    const allUsers = await User.find({}, 'email firstName lastName role');
    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    
    console.log('\n📋 All users and their roles:');
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - ${user.firstName} ${user.lastName} (${user.role})`);
    });

    // Check for invalid roles
    const validRoles = [
      'master_admin',
      'system_admin',
      'revenue_officer',
      'disbursing_officer',
      'billing_officer',
      'collecting_officer',
      'viewer'
    ];

    const invalidRoles = allUsers.filter(u => !validRoles.includes(u.role));
    if (invalidRoles.length > 0) {
      console.log(`\n⚠️  Warning: ${invalidRoles.length} user(s) have invalid roles:`);
      invalidRoles.forEach(u => {
        console.log(`   - ${u.email} (${u.firstName} ${u.lastName}): ${u.role}`);
        console.log(`     → Will be updated to 'viewer'`);
      });

      // Update invalid roles to 'viewer'
      const invalidRoleResult = await User.updateMany(
        { role: { $nin: validRoles } },
        { $set: { role: 'viewer' } },
        { runValidators: true }
      );

      console.log(`\n✅ Updated ${invalidRoleResult.modifiedCount} user(s) with invalid roles to 'viewer'`);
    }

    console.log('\n🎉 User role migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error migrating user roles:', error);
    process.exit(1);
  }
}


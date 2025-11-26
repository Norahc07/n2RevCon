import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || '')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    fixUserRoles();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

async function fixUserRoles() {
  try {
    console.log('🔧 Starting to fix user roles...\n');

    // Update all users to have 'admin' role
    const result = await User.updateMany(
      { role: { $ne: 'admin' } }, // Find users where role is not 'admin'
      { $set: { role: 'admin' } }, // Set role to 'admin'
      { runValidators: false } // Skip validation temporarily
    );

    console.log(`✅ Updated ${result.modifiedCount} user(s) to admin role`);

    // Specifically update the user with email "luigiamarillo007@gmail.com"
    const specificUser = await User.findOneAndUpdate(
      { email: 'luigiamarillo007@gmail.com' },
      { $set: { role: 'admin' } },
      { new: true, runValidators: false }
    );

    if (specificUser) {
      console.log(`✅ Updated user "${specificUser.email}" to admin role`);
      console.log(`   Name: ${specificUser.firstName} ${specificUser.lastName}`);
    } else {
      console.log('ℹ️  User "luigiamarillo007@gmail.com" not found in database');
    }

    // Verify all users now have admin role
    const allUsers = await User.find({}, 'email firstName lastName role');
    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    
    const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
    if (nonAdminUsers.length > 0) {
      console.log(`⚠️  Warning: ${nonAdminUsers.length} user(s) still don't have admin role:`);
      nonAdminUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.firstName} ${u.lastName}): ${u.role}`);
      });
    } else {
      console.log('✅ All users now have admin role!');
    }

    console.log('\n📋 All users:');
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - ${user.firstName} ${user.lastName} (${user.role})`);
    });

    console.log('\n🎉 User role fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing user roles:', error);
    process.exit(1);
  }
}


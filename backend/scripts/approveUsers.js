import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Emails to approve and make admin
const emailsToApprove = [
  'luigiamarillo007@gmail.com',
  'nathalieperez.1128@gmail.com',
  'nazarene.perez28@gmail.com'
];

async function approveUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 APPROVING USERS AND SETTING AS ADMIN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const results = {
      found: 0,
      approved: 0,
      notFound: [],
      errors: []
    };

    for (const email of emailsToApprove) {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
          console.log(`❌ User not found: ${email}`);
          results.notFound.push(email);
          continue;
        }

        results.found++;
        console.log(`\n📧 Processing: ${email}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Current Status:`);
        console.log(`     - Email Verified: ${user.emailVerified || false}`);
        console.log(`     - Account Status: ${user.accountStatus || 'pending'}`);
        console.log(`     - Role: ${user.role || 'viewer'}`);
        console.log(`     - Active: ${user.isActive !== false ? 'Yes' : 'No'}`);

        // Update user
        const updateData = {
          emailVerified: true,
          accountStatus: 'approved',
          role: 'master_admin',
          isActive: true,
          approvedAt: new Date()
        };

        // Clear verification tokens since they're approved
        updateData.emailVerificationToken = undefined;
        updateData.emailVerificationExpire = undefined;

        await User.findByIdAndUpdate(
          user._id,
          { $set: updateData },
          { new: true, runValidators: false }
        );

        results.approved++;
        console.log(`   ✅ Updated:`);
        console.log(`     - Email Verified: true`);
        console.log(`     - Account Status: approved`);
        console.log(`     - Role: master_admin`);
        console.log(`     - Active: true`);

      } catch (error) {
        console.error(`❌ Error processing ${email}:`, error.message);
        results.errors.push({ email, error: error.message });
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`✅ Found: ${results.found} user(s)`);
    console.log(`✅ Approved: ${results.approved} user(s)`);
    
    if (results.notFound.length > 0) {
      console.log(`\n⚠️  Not Found (${results.notFound.length}):`);
      results.notFound.forEach(email => {
        console.log(`   - ${email}`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log(`\n❌ Errors (${results.errors.length}):`);
      results.errors.forEach(({ email, error }) => {
        console.log(`   - ${email}: ${error}`);
      });
    }

    // Verify the updates
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 VERIFICATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    for (const email of emailsToApprove) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        console.log(`${email}:`);
        console.log(`   Email Verified: ${user.emailVerified || false}`);
        console.log(`   Account Status: ${user.accountStatus || 'pending'}`);
        console.log(`   Role: ${user.role || 'viewer'}`);
        console.log(`   Active: ${user.isActive !== false ? 'Yes' : 'No'}`);
        console.log('');
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log('🎉 Approval process completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

approveUsers();


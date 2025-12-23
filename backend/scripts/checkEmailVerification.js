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
 * Script to check and fix email verification status for users
 * Usage: node scripts/checkEmailVerification.js [email]
 */
async function checkEmailVerification() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const email = process.argv[2];

    if (email) {
      // Check specific user
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        console.log(`❌ User not found: ${email}`);
        process.exit(1);
      }

      console.log('\n📧 User Email Verification Status:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log(`Email Verified: ${user.emailVerified}`);
      console.log(`Account Status: ${user.accountStatus}`);
      console.log(`Has Verification Token: ${user.emailVerificationToken ? 'Yes' : 'No'}`);
      if (user.emailVerificationExpire) {
        const isExpired = user.emailVerificationExpire < Date.now();
        console.log(`Token Expired: ${isExpired ? 'Yes' : 'No'}`);
        console.log(`Token Expires: ${new Date(user.emailVerificationExpire).toLocaleString()}`);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Ask if user wants to manually verify
      if (!user.emailVerified) {
        console.log('💡 To manually verify this email, run:');
        console.log(`   node scripts/checkEmailVerification.js ${email} --verify\n`);
      }
    } else {
      // List all unverified users
      const unverifiedUsers = await User.find({ emailVerified: false });
      
      console.log(`\n📧 Found ${unverifiedUsers.length} unverified users:\n`);
      
      if (unverifiedUsers.length === 0) {
        console.log('✅ All users have verified their email!');
      } else {
        unverifiedUsers.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email} - ${user.firstName} ${user.lastName}`);
          console.log(`   Status: ${user.accountStatus}`);
          console.log(`   Has Token: ${user.emailVerificationToken ? 'Yes' : 'No'}`);
          if (user.emailVerificationExpire) {
            const isExpired = user.emailVerificationExpire < Date.now();
            console.log(`   Token Expired: ${isExpired ? 'Yes' : 'No'}`);
          }
          console.log('');
        });
      }
    }

    // Handle --verify flag
    if (process.argv[3] === '--verify' && email) {
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        console.log(`❌ User not found: ${email}`);
        process.exit(1);
      }

      if (user.emailVerified) {
        console.log('✅ Email is already verified!');
      } else {
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save({ validateBeforeSave: false });
        console.log(`✅ Email manually verified for: ${user.email}`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkEmailVerification();


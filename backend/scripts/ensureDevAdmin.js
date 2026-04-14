import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DEV_ADMIN = {
  email: 'admin@n2revcon.com',
  password: 'admin123456',
  firstName: 'Admin',
  lastName: 'User',
  role: 'master_admin',
};

/**
 * Creates or updates the default dev admin so login works (verified + approved + valid role + password).
 * Does not delete projects or other data.
 *
 * Usage (from backend folder): npm run ensure-admin
 */
async function ensureDevAdmin() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not set in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB\n');

  const { email, password, firstName, lastName, role } = DEV_ADMIN;

  let user = await User.findOne({ email }).select('+password');

  if (!user) {
    user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      emailVerified: true,
      accountStatus: 'approved',
      isActive: true,
    });
    console.log(`✅ Created ${email} (password set, verified, approved, ${role})`);
  } else {
    user.password = password;
    user.emailVerified = true;
    user.accountStatus = 'approved';
    user.isActive = true;
    user.firstName = firstName;
    user.lastName = lastName;
    if (!['master_admin', 'system_admin'].includes(user.role)) {
      user.role = role;
    }
    await user.save();
    console.log(`✅ Updated ${email} (password reset, verified, approved, role OK)`);
  }

  console.log('\nYou can sign in with:');
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

ensureDevAdmin().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});

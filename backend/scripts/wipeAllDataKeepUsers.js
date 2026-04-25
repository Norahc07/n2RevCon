import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.model.js';
import Project from '../models/Project.model.js';
import Revenue from '../models/Revenue.model.js';
import Expense from '../models/Expense.model.js';
import Billing from '../models/Billing.model.js';
import Collection from '../models/Collection.model.js';
import Notification from '../models/Notification.model.js';
import AuditLog from '../models/AuditLog.model.js';
import CompanyProfile from '../models/CompanyProfile.model.js';
import GuestLink from '../models/GuestLink.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Removes all business / operational data. User accounts are kept.
 * Also clears per-user sessions, login history, and password-reset tokens
 * so the handoff database is clean without invalidating passwords.
 *
 * Usage (from backend): npm run wipe-data-keep-users
 */
async function wipeAllDataKeepUsers() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not set in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB\n');
  console.log('🗑️  Wiping application data (users are preserved)...\n');

  const steps = [
    ['Projects', () => Project.deleteMany({})],
    ['Revenues', () => Revenue.deleteMany({})],
    ['Expenses', () => Expense.deleteMany({})],
    ['Billings', () => Billing.deleteMany({})],
    ['Collections', () => Collection.deleteMany({})],
    ['Notifications', () => Notification.deleteMany({})],
    ['Audit logs', () => AuditLog.deleteMany({})],
    ['Company profile(s)', () => CompanyProfile.deleteMany({})],
    ['Guest links', () => GuestLink.deleteMany({})],
  ];

  for (const [label, run] of steps) {
    const r = await run();
    console.log(`   ✅ ${label}: ${r.deletedCount} document(s) removed`);
  }

  const userClean = await User.updateMany(
    {},
    {
      $set: { sessions: [], loginHistory: [] },
      $unset: {
        lastLogin: 1,
        resetPasswordToken: 1,
        resetPasswordExpire: 1,
        changePasswordToken: 1,
        changePasswordExpire: 1,
      },
    }
  );
  console.log(
    `   ✅ User records: cleared sessions / login history / reset tokens (${userClean.modifiedCount} user(s) updated)\n`
  );

  console.log('🎉 Data wipe complete. All accounts are unchanged (passwords still work; JWTs in browsers are no longer in DB sessions).\n');

  const users = await User.find({})
    .sort({ email: 1 })
    .select('email firstName lastName role accountStatus emailVerified isActive createdAt')
    .lean();

  printAccountList(users);
  await mongoose.disconnect();
  process.exit(0);
}

function printAccountList(users) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`USER ACCOUNTS (${users.length} total)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  if (users.length === 0) {
    console.log('(none)\n');
    return;
  }
  for (const u of users) {
    console.log(`• ${u.email}`);
    const ver = u.emailVerified === true ? 'true' : u.emailVerified === false ? 'false' : '—';
    const st = u.accountStatus ?? '—';
    console.log(
      `  ${u.firstName} ${u.lastName}  |  role: ${u.role}  |  status: ${st}  |  email verified: ${ver}  |  active: ${u.isActive}`
    );
    console.log(`  created: ${u.createdAt ? new Date(u.createdAt).toISOString() : '—'}`);
    console.log('');
  }
}

wipeAllDataKeepUsers().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});

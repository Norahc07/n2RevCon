import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Lists all user accounts (no passwords). CSV-friendly single-line per user also printed.
 * Usage (from backend): npm run list-accounts
 */
async function listAllAccounts() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not set in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB\n');

  const users = await User.find({})
    .sort({ email: 1 })
    .select('email firstName lastName role accountStatus emailVerified isActive lastLogin createdAt')
    .lean();

  printAccountList(users);

  if (users.length) {
    console.log('CSV (email, firstName, lastName, role, accountStatus, emailVerified, isActive, createdAt):');
    for (const u of users) {
      const line = [
        u.email,
        (u.firstName || '').replace(/,/g, ' '),
        (u.lastName || '').replace(/,/g, ' '),
        u.role,
        u.accountStatus,
        u.emailVerified,
        u.isActive,
        u.createdAt ? new Date(u.createdAt).toISOString() : '',
      ]
        .map((c) => (typeof c === 'string' && c.includes(',') ? `"${c}"` : c))
        .join(',');
      console.log(line);
    }
    console.log('');
  }

  await mongoose.disconnect();
  process.exit(0);
}

function printAccountList(users) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`ALL ACCOUNTS — ${users.length} total`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  if (users.length === 0) {
    console.log('(no users in database)\n');
    return;
  }
  let i = 1;
  for (const u of users) {
    console.log(`${i}. ${u.firstName} ${u.lastName}  <${u.email}>`);
    const ver = u.emailVerified === true ? 'true' : u.emailVerified === false ? 'false' : '—';
    const st = u.accountStatus ?? '—';
    console.log(
      `   role: ${u.role}  |  account: ${st}  |  email verified: ${ver}  |  active: ${u.isActive}`
    );
    if (u.lastLogin) console.log(`   last login: ${new Date(u.lastLogin).toISOString()}`);
    console.log(`   user id: ${u._id}`);
    console.log('');
    i += 1;
  }
}

listAllAccounts().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});

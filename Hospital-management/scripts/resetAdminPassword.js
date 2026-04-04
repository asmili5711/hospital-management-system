require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Admin = require('../models/admin');

const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/hospital';

async function resetAdminPassword() {
  const mongoUri = process.env.TARGET_MONGODB_URI || process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const newPassword = String(process.env.ADMIN_PASSWORD || '');

  if (!email) {
    throw new Error('ADMIN_EMAIL is required');
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error('ADMIN_PASSWORD is required and must be at least 6 characters');
  }

  await mongoose.connect(mongoUri);

  try {
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      throw new Error(`Admin not found for email: ${email}`);
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    console.log(`Admin password reset complete for ${email}`);
  } finally {
    await mongoose.disconnect();
  }
}

resetAdminPassword().catch((error) => {
  console.error('Admin password reset failed:', error.message);
  process.exitCode = 1;
});

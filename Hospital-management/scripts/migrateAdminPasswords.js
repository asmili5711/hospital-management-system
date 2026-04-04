require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Admin = require('../models/admin');

const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/hospital';
const BCRYPT_PREFIXES = ['$2a$', '$2b$', '$2y$'];

const isBcryptHash = (password = '') =>
  BCRYPT_PREFIXES.some((prefix) => password.startsWith(prefix));

async function migrateAdminPasswords() {
  const mongoUri = process.env.TARGET_MONGODB_URI || process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  await mongoose.connect(mongoUri);

  try {
    const admins = await Admin.find().select('+password');
    let migratedCount = 0;

    for (const admin of admins) {
      const storedPassword = admin.password || '';
      if (!storedPassword || isBcryptHash(storedPassword)) {
        continue;
      }

      admin.password = await bcrypt.hash(storedPassword, 10);
      await admin.save();
      migratedCount += 1;
    }

    console.log(`Admin password migration complete. Migrated ${migratedCount} account(s).`);
  } finally {
    await mongoose.disconnect();
  }
}

migrateAdminPasswords().catch((error) => {
  console.error('Admin password migration failed:', error);
  process.exitCode = 1;
});

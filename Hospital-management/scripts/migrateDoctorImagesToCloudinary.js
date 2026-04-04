const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const fs = require('fs');
const mongoose = require('mongoose');

const Doctor = require('../models/Doctor');
const { uploadDoctorImageFromFilePath } = require('../utils/cloudinary');

const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/hospital';

const resolveLocalImagePath = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return '';
  if (!imagePath.startsWith('/images/')) return '';

  return path.join(__dirname, '..', 'public', imagePath.replace(/^\//, ''));
};

async function migrateDoctorImagesToCloudinary() {
  const mongoUri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  await mongoose.connect(mongoUri);

  try {
    const doctors = await Doctor.find().select('image imagePublicId');
    let migrated = 0;
    let skipped = 0;

    for (const doctor of doctors) {
      const localImagePath = resolveLocalImagePath(doctor.image);
      if (!localImagePath) {
        skipped += 1;
        continue;
      }

      if (doctor.imagePublicId) {
        skipped += 1;
        continue;
      }

      if (!fs.existsSync(localImagePath)) {
        console.warn(`Skipping ${doctor._id}: local image not found at ${localImagePath}`);
        skipped += 1;
        continue;
      }

      const uploadResult = await uploadDoctorImageFromFilePath(localImagePath);
      if (!uploadResult.imageUrl || !uploadResult.imagePublicId) {
        console.warn(`Skipping ${doctor._id}: upload did not return URL/public id.`);
        skipped += 1;
        continue;
      }

      doctor.image = uploadResult.imageUrl;
      doctor.imagePublicId = uploadResult.imagePublicId;
      await doctor.save();
      migrated += 1;
      console.log(`Migrated doctor ${doctor._id}`);
    }

    console.log(`Doctor image migration complete. Migrated: ${migrated}, Skipped: ${skipped}.`);
  } finally {
    await mongoose.disconnect();
  }
}

migrateDoctorImagesToCloudinary().catch((error) => {
  console.error('Doctor image migration failed:', error);
  process.exitCode = 1;
});

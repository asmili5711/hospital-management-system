require('dotenv').config();

const mongoose = require('mongoose');

const Doctor = require('../models/Doctor');

async function removeDoctorBookingCount() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required to run this migration');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  try {
    const result = await Doctor.updateMany(
      { bookingCount: { $exists: true } },
      { $unset: { bookingCount: '' } }
    );

    const modifiedCount = result.modifiedCount ?? result.nModified ?? 0;
    console.log(`Doctor bookingCount cleanup complete. Updated ${modifiedCount} document(s).`);
  } finally {
    await mongoose.disconnect();
  }
}

removeDoctorBookingCount().catch((error) => {
  console.error('Doctor bookingCount cleanup failed:', error);
  process.exitCode = 1;
});

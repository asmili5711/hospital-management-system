const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Completed", "Cancelled", "Cancelled by User"],
    default: "Pending"
  }
}, { timestamps: true });

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: false
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"]
  },
  address: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  appointments: [appointmentSchema]
}, { timestamps: true });

module.exports = mongoose.model("Patient", patientSchema);

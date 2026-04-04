const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  experience: {
    type: Number,
    default: 0
  },
  image: {
    type: String   // image URL or file path
  },
  description: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Doctor", doctorSchema);

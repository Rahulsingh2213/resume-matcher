const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  yearOfExperience: Number,
  resumeSkills: [String],
  matchingJobs: mongoose.Schema.Types.Mixed,
  scannedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Scan", scanSchema);
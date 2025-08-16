const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, index: true },
  dob: { type: Date },
  address: String,
  phoneNumber: String,
  state: String,
  zipCode: String,
  email: { type: String, lowercase: true, trim: true },
  gender: String,
  userType: String
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
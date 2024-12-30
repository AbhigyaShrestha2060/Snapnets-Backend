const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    default: null,
  },

  resetPasswordOTP: {
    type: String,
    default: null,
  },
  resetPasswordOTPExpiry: {
    type: Date,
    default: null,
  },
  profilePicture: {
    type: String,
    default: null,
  },
});

const User = mongoose.model('users', userSchema);
module.exports = User;

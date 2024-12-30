const mongoose = require('mongoose');

const balanceSchema = new mongoose.Schema({
  balance: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

const Balance = mongoose.model('balances', balanceSchema);
module.exports = Balance;

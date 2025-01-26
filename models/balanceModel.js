const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  transactionDate: {
    type: Date,
    default: Date.now, // Automatically set to the current date and time
  },
  pidx: {
    type: String,
  },
});

const balanceSchema = new mongoose.Schema({
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  transactions: [transactionSchema], // Array of transactions
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Balance = mongoose.model('balances', balanceSchema);
module.exports = Balance;

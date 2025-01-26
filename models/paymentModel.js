const mongoose = require('mongoose');

// Define the Payment schema
const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true, // Reference to the User model
    },

    amount: {
      type: Number,
      required: true,
    },
    transactionId: {
      type: String, // Hashed transaction ID for security
      required: false,
    },
    pidx: {
      type: String, // Hashed pidx returned by the payment gateway
      required: false,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled'],
      default: 'pending',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Add indexes for faster queries (optional)
paymentSchema.index({ user: 1, status: 1 });

// Create the Payment model
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

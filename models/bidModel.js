const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    bidAmount: {
      type: Number,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true, // Ensures that a user is always associated with a bid
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'images',
      required: true, // Ensures that an image is always associated with a bid
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt`
  }
);

const Bids = mongoose.model('bids', bidSchema);
module.exports = Bids;

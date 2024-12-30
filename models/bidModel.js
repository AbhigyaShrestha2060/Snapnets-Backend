const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  bidAmount: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  image: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'images',
  },
});

const Bids = mongoose.model('bids', bidSchema);
module.exports = Bids;

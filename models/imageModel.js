const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  imageTitle: {
    type: String,
    required: true,
  },
  imageDescription: {
    type: String,
    required: true,
  },
  isPortrait: {
    type: Boolean,
    default: false,
  },
  uploadDate: {
    type: Date,
    default: Date.now(),
  },
  totalLikes: {
    type: Number,
    default: 0,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
});

const Images = mongoose.model('images', imageSchema);
module.exports = Images;

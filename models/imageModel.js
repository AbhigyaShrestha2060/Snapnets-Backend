import mongoose from 'mongoose';

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
  likedBy: {
    type: [String],
    default: [],
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'comments',
    },
  ],
  keywords: {
    type: [String],
    default: [],
    index: true, // Index for optimized search
  },
  isReadyToBid: {
    type: Boolean,
    default: false,
  },
});

const Images = mongoose.model('images', imageSchema);
export default Images;

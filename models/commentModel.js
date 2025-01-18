const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: true,
  },
  commentDate: {
    type: Date,
    default: Date.now(),
  },
  commentedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
});

const Comments = mongoose.model('comments', commentSchema);
module.exports = Comments;

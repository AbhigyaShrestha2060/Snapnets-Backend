const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  lists: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'images',
    },
  ],
});

module.exports = mongoose.model('Board', boardSchema);

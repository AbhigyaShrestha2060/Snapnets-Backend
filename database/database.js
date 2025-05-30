const mongoose = require('mongoose');
require('dotenv').config();

const connectDatabase = () => {
  mongoose.connect(process.env.DATABASE).then(() => {
    console.log('✅ MongoDB connected');
  });
};

// Exporting the function
module.exports = connectDatabase;

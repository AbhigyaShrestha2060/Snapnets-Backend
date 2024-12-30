const express = require('express');
const connectDatabase = require('./database/database');
const dotenv = require('dotenv');
const acceptFormData = require('express-fileupload');
const cors = require('cors');
const http = require('http');

// Creating an express app
const app = express();

//  cors configuration
const corsOptions = {
  origin: true,
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Express Json Config
app.use(express.json());

app.use(acceptFormData());

app.use(express.static('public'));

// dotenv Configuration
dotenv.config();

// Connecting to database
connectDatabase();

// Defining the port
const PORT = process.env.PORT;
console.log(__dirname);

// Making a test endpoint
// Endpoints : POST, GET, PUT , DELETE
app.get('/test', (req, res) => {
  res.send('Test API is Working!....');
});

app.use(express.static('public'));

app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/image', require('./routes/imageRoutes'));

const server = http.createServer(app);

// Starting the server (always at the last)
server.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});

module.exports = app;

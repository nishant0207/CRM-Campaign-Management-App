// app.js
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const dataRoutes = require('./routes/dataRoutes');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Enable CORS for the frontend URL
// app.use(cors({
//     origin: 'http://localhost:3001'
// }));


app.use(cors({
  origin: ['https://xeno-crm-frontend.vercel.app'], // Allow the deployed frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  credentials: true // Allow credentials to be included
}));

// Middleware for parsing JSON requests
app.use(express.json());

// Define routes after CORS middleware
app.use('/api', dataRoutes);

// Define a basic route to test the server
app.get('/', (req, res) => {
  res.send('Xeno CRM API is running');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
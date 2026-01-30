const express = require('express');
const cors = require('cors');
const compression = require('compression');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// Gzip compression for all responses
app.use(compression());

// Middleware
// Middleware
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded CSVs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017dsa-tracking';


    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    console.log('💡 Make sure MongoDB is running');
    // Don't exit - allow server to run for static file serving
  }
};

// Routes
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const trackingRoutes = require('./routes/tracking');
const adminRoutes = require('./routes/admin');
const debugRoutes = require('./routes/debug');

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/debug', debugRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});

module.exports = app;

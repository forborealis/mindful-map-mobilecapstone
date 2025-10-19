const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const { initializeFirebase, getAuth, getFirestore } = require('./config/firebase');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;


app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:19006'],
  credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const moodRoutes = require('./routes/moodDataRoutes');
app.use('/api/mood-data', moodRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting'
    };
    
    res.json({
      success: true,
      status: 'OK',
      services: {
        database: states[dbState],
        firebase: 'Connected'
      },
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});


app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Backend is working!', 
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    firebase: 'Connected',
    timestamp: new Date().toISOString()
  });
});


const startServer = async () => {
  try {
    await connectDB();
    
    initializeFirebase();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📱 Ready for Expo app connection`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth endpoints:`);
      console.log(`   POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   GET  http://localhost:${PORT}/api/auth/profile/:uid`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Using URI:', process.env.MONGO_URI ? 'URI loaded' : 'URI not found');
    
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:');
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    process.exit(1);
  }
};

module.exports = connectDB;
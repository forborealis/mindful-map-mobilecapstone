const mongoose = require('mongoose');
require('dotenv').config();

// Simple test function
const testConnection = async () => {
  try {
    console.log('🧪 Testing MongoDB Connection...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connection successful!');
    
    // Test database operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Available Collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Test a simple query (if you have any collections)
    const stats = await mongoose.connection.db.stats();
    console.log('\n📊 Database Stats:');
    console.log(`  - Database: ${stats.db}`);
    console.log(`  - Collections: ${stats.collections}`);
    console.log(`  - Documents: ${stats.objects}`);
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:');
    console.error(error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit();
  }
};

testConnection();
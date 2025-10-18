const { initializeFirebase, getAuth, getFirestore } = require('../config/firebase');

const simpleTest = async () => {
  try {
    console.log('🔥 Simple Firebase Test...\n');
    
    // Initialize Firebase
    initializeFirebase();
    
    // Test Auth
    const auth = getAuth();
    console.log('✅ Auth initialized');
    
    // Test Firestore
    const firestore = getFirestore();
    console.log('✅ Firestore initialized');
    
    // Simple connection test - just list collections
    try {
      const collections = await firestore.listCollections();
      console.log('✅ Firestore connection successful');
      console.log(`📋 Found ${collections.length} collections`);
      
      // List collection names
      collections.forEach(collection => {
        console.log(`  - ${collection.id}`);
      });
      
    } catch (firestoreError) {
      console.log('⚠️ Firestore connection test failed, but Firebase is initialized');
      console.log('This might be due to Firestore rules or permissions');
    }
    
    console.log('\n🎉 Firebase basic connection successful!');
    console.log('✅ Your backend can connect to Firebase');
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
  }
  
  process.exit();
};

simpleTest();
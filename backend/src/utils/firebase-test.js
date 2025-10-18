const { initializeFirebase, getAuth, getFirestore, admin } = require('../config/firebase');

const testFirebase = async () => {
  try {
    console.log('🔥 Testing Firebase Connection...\n');
    
    // Initialize Firebase
    const app = initializeFirebase();
    console.log('✅ Firebase initialized successfully!');
    
    // Test Firebase Auth
    const auth = getAuth();
    console.log('✅ Firebase Auth service available');
    
    // Test Firestore
    const firestore = getFirestore();
    console.log('✅ Firestore service available');
    
    // Test Firestore connection with a simple write
    const testCollection = firestore.collection('_test');
    const docRef = await testCollection.add({
      message: 'Connection test from mobile backend',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: 'mobile-backend-test'
    });
    
    console.log('✅ Firestore write test successful');
    console.log(`📄 Test document ID: ${docRef.id}`);
    
    // Read the document back to verify
    const doc = await testCollection.doc(docRef.id).get();
    if (doc.exists) {
      console.log('✅ Firestore read test successful');
      console.log('📋 Document data:', doc.data());
    }
    
    // Clean up test document
    await testCollection.doc(docRef.id).delete();
    console.log('✅ Test document cleaned up');
    
    console.log('\n🎉 Firebase test completed successfully!');
    console.log('🔗 Your mobile app can now connect to the same Firebase project as your web app!');
    
  } catch (error) {
    console.error('❌ Firebase test failed:');
    console.error('Error Message:', error.message);
    if (error.code) console.error('Error Code:', error.code);
    if (error.stack) console.error('Stack:', error.stack);
  }
  
  process.exit();
};

testFirebase();
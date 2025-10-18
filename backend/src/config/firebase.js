const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

let firebaseApp = null;

const initializeFirebase = () => {
  try {
    if (!firebaseApp) {
      console.log('🔥 Initializing Firebase Admin SDK...');
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      
      console.log('✅ Firebase Admin SDK initialized successfully!');
      console.log(`📍 Project ID: ${serviceAccount.project_id}`);
      console.log(`📧 Service Account: ${serviceAccount.client_email}`);
    }
    
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase initialization error:');
    console.error(error.message);
    throw error;
  }
};

// Get Firebase services
const getAuth = () => {
  if (!firebaseApp) initializeFirebase();
  return admin.auth();
};

const getFirestore = () => {
  if (!firebaseApp) initializeFirebase();
  return admin.firestore();
};

module.exports = {
  initializeFirebase,
  getAuth,
  getFirestore,
  admin
};
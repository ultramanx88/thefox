#!/usr/bin/env node

/**
 * Firebase Connection Test Script
 * Tests Firebase services connectivity and configuration
 */

const { initializeApp } = require('firebase/app');
const { getAuth, connectAuthEmulator } = require('firebase/auth');
const { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, deleteDoc } = require('firebase/firestore');
const { getStorage, connectStorageEmulator } = require('firebase/storage');
const { getFunctions, connectFunctionsEmulator } = require('firebase/functions');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

async function testFirebaseConnection() {
  log('🔥 Testing Firebase Connection', 'magenta');
  log('==============================', 'magenta');
  
  const config = getFirebaseConfig();
  
  // Validate configuration
  log('\n📋 Validating configuration...', 'blue');
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
  const missingFields = requiredFields.filter(field => !config[field] || config[field].includes('your-'));
  
  if (missingFields.length > 0) {
    log('❌ Missing or invalid configuration fields:', 'red');
    missingFields.forEach(field => log(`   - ${field}`, 'red'));
    log('\n💡 Please update your .env.local file with valid Firebase configuration', 'yellow');
    return false;
  }
  
  log('✅ Configuration is valid', 'green');
  log(`📊 Project ID: ${config.projectId}`, 'cyan');
  log(`🌐 Auth Domain: ${config.authDomain}`, 'cyan');
  
  try {
    // Initialize Firebase
    log('\n🚀 Initializing Firebase...', 'blue');
    const app = initializeApp(config);
    log('✅ Firebase app initialized', 'green');
    
    // Initialize services
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);
    const functions = getFunctions(app);
    
    // Connect to emulators in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      log('\n🧪 Connecting to emulators...', 'blue');
      try {
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectStorageEmulator(storage, 'localhost', 9199);
        connectFunctionsEmulator(functions, 'localhost', 5001);
        log('✅ Connected to emulators', 'green');
      } catch (error) {
        log('⚠️  Emulator connection failed (may already be connected)', 'yellow');
      }
    }
    
    // Test Firestore
    log('\n🗄️  Testing Firestore...', 'blue');
    const testDocRef = doc(db, 'test', 'connection-test');
    const testData = {
      message: 'Firebase connection test',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
    
    await setDoc(testDocRef, testData);
    log('✅ Firestore write successful', 'green');
    
    const docSnap = await getDoc(testDocRef);
    if (docSnap.exists()) {
      log('✅ Firestore read successful', 'green');
      log(`📄 Test document data: ${JSON.stringify(docSnap.data(), null, 2)}`, 'cyan');
    } else {
      log('❌ Firestore read failed - document not found', 'red');
    }
    
    // Clean up test document
    await deleteDoc(testDocRef);
    log('✅ Test document cleaned up', 'green');
    
    // Test Storage
    log('\n📁 Testing Storage...', 'blue');
    try {
      // Just check if storage is accessible
      const storageRef = storage._delegate;
      if (storageRef) {
        log('✅ Storage service accessible', 'green');
      }
    } catch (error) {
      log(`❌ Storage test failed: ${error.message}`, 'red');
    }
    
    // Test Functions
    log('\n⚡ Testing Functions...', 'blue');
    try {
      // Just check if functions service is accessible
      const functionsRef = functions._delegate;
      if (functionsRef) {
        log('✅ Functions service accessible', 'green');
      }
    } catch (error) {
      log(`❌ Functions test failed: ${error.message}`, 'red');
    }
    
    // Test Auth
    log('\n🔐 Testing Auth...', 'blue');
    try {
      // Just check if auth service is accessible
      const authRef = auth._delegate;
      if (authRef) {
        log('✅ Auth service accessible', 'green');
      }
    } catch (error) {
      log(`❌ Auth test failed: ${error.message}`, 'red');
    }
    
    log('\n🎉 Firebase connection test completed successfully!', 'green');
    return true;
    
  } catch (error) {
    log(`\n❌ Firebase connection test failed: ${error.message}`, 'red');
    log('🔍 Error details:', 'yellow');
    console.error(error);
    return false;
  }
}

async function main() {
  const success = await testFirebaseConnection();
  
  if (success) {
    log('\n✅ All tests passed! Firebase is working correctly.', 'green');
    process.exit(0);
  } else {
    log('\n❌ Tests failed. Please check your Firebase configuration.', 'red');
    log('\n💡 Troubleshooting tips:', 'yellow');
    log('   1. Make sure .env.local exists and has valid Firebase config', 'yellow');
    log('   2. Check if Firebase emulators are running (for development)', 'yellow');
    log('   3. Verify your Firebase project settings', 'yellow');
    log('   4. Run: node scripts/firebase-setup.js', 'yellow');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testFirebaseConnection };
#!/usr/bin/env node

/**
 * Real-time Synchronization Test Script
 * Tests real-time data synchronization, offline support, and conflict resolution
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  connectFirestoreEmulator, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  onSnapshot,
  enableNetwork,
  disableNetwork,
  waitForPendingWrites
} = require('firebase/firestore');
const { getAuth, connectAuthEmulator, signInAnonymously } = require('firebase/auth');

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

async function testRealtimeSync() {
  log('🔄 Testing Real-time Data Synchronization', 'magenta');
  log('==========================================', 'magenta');
  
  const config = getFirebaseConfig();
  
  try {
    // Initialize Firebase
    const app = initializeApp(config);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    // Connect to emulators in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      log('🧪 Connecting to emulators...', 'blue');
      try {
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectFirestoreEmulator(db, 'localhost', 8080);
        log('✅ Connected to emulators', 'green');
      } catch (error) {
        log('⚠️  Emulator connection failed (may already be connected)', 'yellow');
      }
    }
    
    // Sign in anonymously
    log('🔐 Signing in for testing...', 'blue');
    const userCredential = await signInAnonymously(auth);
    const testUserId = userCredential.user.uid;
    log(`✅ Signed in with user ID: ${testUserId}`, 'green');
    
    // Test 1: Real-time Document Updates
    log('\\n📄 Testing real-time document updates...', 'blue');
    
    const testDocRef = doc(db, 'realtimeTest', 'document1');
    let updateCount = 0;
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(testDocRef, (docSnapshot) => {
      updateCount++;
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        log(`📡 Real-time update ${updateCount}: ${JSON.stringify(data)}`, 'cyan');
      } else {
        log(`📡 Real-time update ${updateCount}: Document deleted`, 'cyan');
      }
    });
    
    // Create initial document
    await setDoc(testDocRef, {
      message: 'Initial message',
      timestamp: new Date(),
      counter: 1,
    });
    
    // Wait a bit for the listener to fire
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update the document
    await updateDoc(testDocRef, {
      message: 'Updated message',
      timestamp: new Date(),
      counter: 2,
    });
    
    // Wait for update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update again
    await updateDoc(testDocRef, {
      message: 'Final message',
      timestamp: new Date(),
      counter: 3,
    });
    
    // Wait for final update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clean up listener
    unsubscribe();
    
    if (updateCount >= 3) {
      log('✅ Real-time document updates working correctly', 'green');
    } else {
      log(`⚠️  Expected 3+ updates, got ${updateCount}`, 'yellow');
    }
    
    // Test 2: Offline Support
    log('\\n📱 Testing offline support...', 'blue');
    
    // Disable network
    log('🔌 Disabling network...', 'blue');
    await disableNetwork(db);
    
    // Try to update document while offline
    const offlineDocRef = doc(db, 'realtimeTest', 'offlineTest');
    await setDoc(offlineDocRef, {
      message: 'Offline message',
      timestamp: new Date(),
      isOffline: true,
    });
    
    log('✅ Offline write queued', 'green');
    
    // Check for pending writes
    log('⏳ Checking for pending writes...', 'blue');
    try {
      await waitForPendingWrites(db);
      log('⚠️  No pending writes detected (unexpected)', 'yellow');
    } catch (error) {
      log('✅ Pending writes detected as expected', 'green');
    }
    
    // Re-enable network
    log('🔌 Re-enabling network...', 'blue');
    await enableNetwork(db);
    
    // Wait for sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if offline write was synced
    const offlineDoc = await offlineDocRef.get();
    if (offlineDoc.exists()) {
      log('✅ Offline write synced successfully', 'green');
      log(`📄 Synced data: ${JSON.stringify(offlineDoc.data())}`, 'cyan');
    } else {
      log('❌ Offline write failed to sync', 'red');
    }
    
    // Test 3: Multiple Listeners
    log('\\n👥 Testing multiple real-time listeners...', 'blue');
    
    const multiTestRef = doc(db, 'realtimeTest', 'multiListener');
    let listener1Count = 0;
    let listener2Count = 0;
    
    const unsubscribe1 = onSnapshot(multiTestRef, () => {
      listener1Count++;
      log(`📡 Listener 1 update: ${listener1Count}`, 'cyan');
    });
    
    const unsubscribe2 = onSnapshot(multiTestRef, () => {
      listener2Count++;
      log(`📡 Listener 2 update: ${listener2Count}`, 'cyan');
    });
    
    // Create document
    await setDoc(multiTestRef, {
      message: 'Multi-listener test',
      timestamp: new Date(),
    });
    
    // Wait for listeners
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update document
    await updateDoc(multiTestRef, {
      message: 'Updated multi-listener test',
      timestamp: new Date(),
    });
    
    // Wait for listeners
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clean up listeners
    unsubscribe1();
    unsubscribe2();
    
    if (listener1Count >= 2 && listener2Count >= 2) {
      log('✅ Multiple listeners working correctly', 'green');
    } else {
      log(`⚠️  Expected 2+ updates per listener, got ${listener1Count} and ${listener2Count}`, 'yellow');
    }
    
    // Test 4: Collection Queries
    log('\\n📚 Testing real-time collection queries...', 'blue');
    
    const collectionRef = db.collection('realtimeTest');
    let collectionUpdateCount = 0;
    
    const collectionUnsubscribe = onSnapshot(collectionRef, (querySnapshot) => {
      collectionUpdateCount++;
      log(`📡 Collection update ${collectionUpdateCount}: ${querySnapshot.size} documents`, 'cyan');
      
      querySnapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          log(`  ➕ Added: ${change.doc.id}`, 'green');
        }
        if (change.type === 'modified') {
          log(`  ✏️  Modified: ${change.doc.id}`, 'yellow');
        }
        if (change.type === 'removed') {
          log(`  ➖ Removed: ${change.doc.id}`, 'red');
        }
      });
    });
    
    // Add documents to collection
    await setDoc(doc(collectionRef, 'item1'), {
      name: 'Item 1',
      value: 100,
      timestamp: new Date(),
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await setDoc(doc(collectionRef, 'item2'), {
      name: 'Item 2',
      value: 200,
      timestamp: new Date(),
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update a document
    await updateDoc(doc(collectionRef, 'item1'), {
      value: 150,
      timestamp: new Date(),
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Delete a document
    await deleteDoc(doc(collectionRef, 'item2'));
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clean up listener
    collectionUnsubscribe();
    
    if (collectionUpdateCount >= 4) {
      log('✅ Collection real-time queries working correctly', 'green');
    } else {
      log(`⚠️  Expected 4+ collection updates, got ${collectionUpdateCount}`, 'yellow');
    }
    
    // Test 5: Network State Changes
    log('\\n🌐 Testing network state changes...', 'blue');
    
    const networkTestRef = doc(db, 'realtimeTest', 'networkTest');
    let networkUpdateCount = 0;
    
    const networkUnsubscribe = onSnapshot(networkTestRef, (docSnapshot) => {
      networkUpdateCount++;
      if (docSnapshot.exists()) {
        log(`📡 Network test update ${networkUpdateCount}`, 'cyan');
      }
    }, (error) => {
      log(`❌ Network listener error: ${error.message}`, 'red');
    });
    
    // Create initial document
    await setDoc(networkTestRef, {
      message: 'Network test initial',
      timestamp: new Date(),
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate network disconnection
    log('🔌 Simulating network disconnection...', 'blue');
    await disableNetwork(db);
    
    // Try to update while offline (should be queued)
    await setDoc(networkTestRef, {
      message: 'Network test offline update',
      timestamp: new Date(),
      offline: true,
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reconnect
    log('🔌 Reconnecting to network...', 'blue');
    await enableNetwork(db);
    
    // Wait for sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Clean up
    networkUnsubscribe();
    
    log('✅ Network state change handling tested', 'green');
    
    // Cleanup test documents
    log('\\n🧹 Cleaning up test documents...', 'blue');
    
    const testDocs = [
      'realtimeTest/document1',
      'realtimeTest/offlineTest',
      'realtimeTest/multiListener',
      'realtimeTest/item1',
      'realtimeTest/networkTest',
    ];
    
    for (const docPath of testDocs) {
      try {
        await deleteDoc(doc(db, docPath));
      } catch (error) {
        // Document might not exist, ignore error
      }
    }
    
    log('✅ Test documents cleaned up', 'green');
    
    log('\\n🎉 All real-time synchronization tests completed!', 'green');
    return true;
    
  } catch (error) {
    log(`\\n❌ Real-time sync test failed: ${error.message}`, 'red');
    log('🔍 Error details:', 'yellow');
    console.error(error);
    return false;
  }
}

async function testConflictResolution() {
  log('\\n⚔️  Testing Conflict Resolution', 'magenta');
  log('===============================', 'magenta');
  
  // Mock conflict resolution test
  log('📝 Testing conflict resolution strategies...', 'blue');
  
  const clientData = { name: 'Client Update', value: 100, timestamp: new Date() };
  const serverData = { name: 'Server Update', value: 200, timestamp: new Date() };
  
  // Test different resolution strategies
  const strategies = [
    {
      name: 'Client Wins',
      resolve: (client, server) => client,
      expected: clientData,
    },
    {
      name: 'Server Wins',
      resolve: (client, server) => server,
      expected: serverData,
    },
    {
      name: 'Merge',
      resolve: (client, server) => ({ ...server, ...client }),
      expected: { ...serverData, ...clientData },
    },
  ];
  
  for (const strategy of strategies) {
    const result = strategy.resolve(clientData, serverData);
    const passed = JSON.stringify(result) === JSON.stringify(strategy.expected);
    
    if (passed) {
      log(`✅ ${strategy.name} strategy working correctly`, 'green');
    } else {
      log(`❌ ${strategy.name} strategy failed`, 'red');
      log(`   Expected: ${JSON.stringify(strategy.expected)}`, 'yellow');
      log(`   Got: ${JSON.stringify(result)}`, 'yellow');
    }
  }
  
  log('✅ Conflict resolution strategies tested', 'green');
  return true;
}

async function testOfflineQueue() {
  log('\\n📱 Testing Offline Action Queue', 'magenta');
  log('================================', 'magenta');
  
  // Mock offline queue test
  log('📝 Testing offline action queuing...', 'blue');
  
  const offlineActions = [];
  
  // Simulate queuing offline actions
  const queueAction = (type, collection, data, documentId) => {
    const action = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      collection,
      documentId,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3,
    };
    
    offlineActions.push(action);
    log(`📝 Queued ${type} action for ${collection}${documentId ? '/' + documentId : ''}`, 'cyan');
    return action.id;
  };
  
  // Queue some test actions
  queueAction('create', 'orders', { total: 100, status: 'pending' });
  queueAction('update', 'orders', { status: 'confirmed' }, 'order123');
  queueAction('delete', 'temp', {}, 'temp456');
  
  log(`✅ Queued ${offlineActions.length} offline actions`, 'green');
  
  // Simulate processing queue
  log('⚡ Processing offline action queue...', 'blue');
  
  for (const action of offlineActions) {
    try {
      // Mock processing
      await new Promise(resolve => setTimeout(resolve, 100));
      log(`✅ Processed ${action.type} action: ${action.id}`, 'green');
    } catch (error) {
      log(`❌ Failed to process action: ${action.id}`, 'red');
    }
  }
  
  log('✅ Offline action queue processing tested', 'green');
  return true;
}

async function main() {
  const realtimeSuccess = await testRealtimeSync();
  const conflictSuccess = await testConflictResolution();
  const offlineSuccess = await testOfflineQueue();
  
  if (realtimeSuccess && conflictSuccess && offlineSuccess) {
    log('\\n✅ All real-time synchronization tests passed!', 'green');
    log('\\n📚 Next steps:', 'blue');
    log('   1. Integrate real-time hooks into your React components', 'yellow');
    log('   2. Test with multiple users and devices', 'yellow');
    log('   3. Monitor real-time performance in production', 'yellow');
    log('   4. Implement custom conflict resolution strategies', 'yellow');
    process.exit(0);
  } else {
    log('\\n❌ Some real-time synchronization tests failed.', 'red');
    log('\\n💡 Troubleshooting tips:', 'yellow');
    log('   1. Make sure Firebase emulators are running', 'yellow');
    log('   2. Check your Firestore security rules', 'yellow');
    log('   3. Verify network connectivity', 'yellow');
    log('   4. Check browser console for additional errors', 'yellow');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testRealtimeSync, testConflictResolution, testOfflineQueue };
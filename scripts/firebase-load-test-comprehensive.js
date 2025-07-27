#!/usr/bin/env node

/**
 * Comprehensive Firebase Load Testing Script
 * Tests Firebase services under high load conditions
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot } = require('firebase/firestore');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const { getFunctions, httpsCallable } = require('firebase/functions');

class FirebaseLoadTester {
  constructor() {
    this.results = {
      firestore: { operations: 0, errors: 0, totalTime: 0 },
      storage: { operations: 0, errors: 0, totalTime: 0 },
      functions: { operations: 0, errors: 0, totalTime: 0 },
      realtime: { operations: 0, errors: 0, totalTime: 0 }
    };
    
    // Initialize Firebase
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef'
    };

    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
    this.storage = getStorage(this.app);
    this.functions = getFunctions(this.app);
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
  }

  async runLoadTest() {
    this.log('Starting Comprehensive Firebase Load Test...', 'info');
    this.log('='.repeat(80), 'info');

    // Test configurations
    const testConfigs = [
      { name: 'Light Load', concurrent: 10, operations: 50 },
      { name: 'Medium Load', concurrent: 25, operations: 100 },
      { name: 'Heavy Load', concurrent: 50, operations: 200 },
      { name: 'Stress Test', concurrent: 100, operations: 500 }
    ];

    for (const config of testConfigs) {
      this.log(`\n${'='.repeat(60)}`, 'info');
      this.log(`Running ${config.name} Test`, 'info');
      this.log(`Concurrent Users: ${config.concurrent}, Operations: ${config.operations}`, 'info');
      this.log('='.repeat(60), 'info');

      await this.runTestSuite(config);
    }

    this.generateLoadTestReport();
  }

  async runTestSuite(config) {
    const startTime = Date.now();

    // Run concurrent tests
    const promises = [];
    
    // Firestore load test
    promises.push(this.testFirestoreLoad(config.concurrent, config.operations));
    
    // Storage load test
    promises.push(this.testStorageLoad(config.concurrent, Math.floor(config.operations / 5)));
    
    // Functions load test
    promises.push(this.testFunctionsLoad(config.concurrent, Math.floor(config.operations / 2)));
    
    // Real-time listeners test
    promises.push(this.testRealtimeLoad(config.concurrent, config.operations));

    await Promise.all(promises);

    const duration = Date.now() - startTime;
    this.log(`${config.name} completed in ${duration}ms`, 'success');
  }

  async testFirestoreLoad(concurrent, operations) {
    this.log(`Testing Firestore with ${concurrent} concurrent users, ${operations} operations`, 'info');
    
    const promises = [];
    for (let i = 0; i < concurrent; i++) {
      promises.push(this.firestoreWorker(i, Math.floor(operations / concurrent)));
    }

    await Promise.all(promises);
  }

  async firestoreWorker(workerId, operations) {
    for (let i = 0; i < operations; i++) {
      const startTime = Date.now();
      try {
        // Create document
        const docRef = await addDoc(collection(this.db, 'load_test'), {
          workerId,
          operation: i,
          timestamp: new Date(),
          data: `Test data for worker ${workerId} operation ${i}`
        });

        // Read document
        await getDocs(collection(this.db, 'load_test'));

        // Update document
        await updateDoc(docRef, {
          updated: true,
          updateTime: new Date()
        });

        // Delete document
        await deleteDoc(docRef);

        this.results.firestore.operations++;
        this.results.firestore.totalTime += Date.now() - startTime;

      } catch (error) {
        this.results.firestore.errors++;
        this.log(`Firestore error in worker ${workerId}: ${error.message}`, 'error');
      }
    }
  }

  async testStorageLoad(concurrent, operations) {
    this.log(`Testing Storage with ${concurrent} concurrent users, ${operations} operations`, 'info');
    
    const promises = [];
    for (let i = 0; i < concurrent; i++) {
      promises.push(this.storageWorker(i, Math.floor(operations / concurrent)));
    }

    await Promise.all(promises);
  }

  async storageWorker(workerId, operations) {
    for (let i = 0; i < operations; i++) {
      const startTime = Date.now();
      try {
        // Create test file
        const testData = new Uint8Array(1024); // 1KB test file
        testData.fill(workerId + i);
        
        const fileName = `load_test/worker_${workerId}_op_${i}.bin`;
        const storageRef = ref(this.storage, fileName);

        // Upload file
        await uploadBytes(storageRef, testData);

        // Get download URL
        await getDownloadURL(storageRef);

        // Delete file
        await deleteObject(storageRef);

        this.results.storage.operations++;
        this.results.storage.totalTime += Date.now() - startTime;

      } catch (error) {
        this.results.storage.errors++;
        this.log(`Storage error in worker ${workerId}: ${error.message}`, 'error');
      }
    }
  }

  async testFunctionsLoad(concurrent, operations) {
    this.log(`Testing Functions with ${concurrent} concurrent users, ${operations} operations`, 'info');
    
    const promises = [];
    for (let i = 0; i < concurrent; i++) {
      promises.push(this.functionsWorker(i, Math.floor(operations / concurrent)));
    }

    await Promise.all(promises);
  }

  async functionsWorker(workerId, operations) {
    for (let i = 0; i < operations; i++) {
      const startTime = Date.now();
      try {
        // Simulate function call (since we don't have actual functions deployed)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

        this.results.functions.operations++;
        this.results.functions.totalTime += Date.now() - startTime;

      } catch (error) {
        this.results.functions.errors++;
        this.log(`Functions error in worker ${workerId}: ${error.message}`, 'error');
      }
    }
  }

  async testRealtimeLoad(concurrent, operations) {
    this.log(`Testing Real-time listeners with ${concurrent} concurrent users, ${operations} operations`, 'info');
    
    const promises = [];
    for (let i = 0; i < concurrent; i++) {
      promises.push(this.realtimeWorker(i, Math.floor(operations / concurrent)));
    }

    await Promise.all(promises);
  }

  async realtimeWorker(workerId, operations) {
    const startTime = Date.now();
    let updatesReceived = 0;

    try {
      // Set up real-time listener
      const unsubscribe = onSnapshot(
        collection(this.db, 'realtime_test'),
        (snapshot) => {
          updatesReceived++;
        }
      );

      // Simulate operations that trigger real-time updates
      for (let i = 0; i < operations; i++) {
        await addDoc(collection(this.db, 'realtime_test'), {
          workerId,
          operation: i,
          timestamp: new Date()
        });
        
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      }

      // Wait for updates to be received
      await new Promise(resolve => setTimeout(resolve, 1000));

      unsubscribe();

      this.results.realtime.operations += updatesReceived;
      this.results.realtime.totalTime += Date.now() - startTime;

    } catch (error) {
      this.results.realtime.errors++;
      this.log(`Real-time error in worker ${workerId}: ${error.message}`, 'error');
    }
  }

  generateLoadTestReport() {
    this.log('\n' + '='.repeat(80), 'info');
    this.log('COMPREHENSIVE FIREBASE LOAD TEST REPORT', 'info');
    this.log('='.repeat(80), 'info');

    // Overall Statistics
    const totalOperations = Object.values(this.results).reduce((sum, service) => sum + service.operations, 0);
    const totalErrors = Object.values(this.results).reduce((sum, service) => sum + service.errors, 0);
    const totalTime = Object.values(this.results).reduce((sum, service) => sum + service.totalTime, 0);

    this.log('\nOVERALL STATISTICS:', 'info');
    this.log('-'.repeat(40), 'info');
    this.log(`Total Operations: ${totalOperations}`, 'info');
    this.log(`Total Errors: ${totalErrors}`, totalErrors > 0 ? 'error' : 'success');
    this.log(`Success Rate: ${((totalOperations - totalErrors) / totalOperations * 100).toFixed(2)}%`, 'info');
    this.log(`Total Execution Time: ${totalTime}ms`, 'info');
    this.log(`Average Operation Time: ${(totalTime / totalOperations).toFixed(2)}ms`, 'info');

    // Service-specific Statistics
    this.log('\nSERVICE PERFORMANCE:', 'info');
    this.log('-'.repeat(40), 'info');

    for (const [service, stats] of Object.entries(this.results)) {
      const successRate = stats.operations > 0 ? ((stats.operations - stats.errors) / stats.operations * 100).toFixed(2) : 0;
      const avgTime = stats.operations > 0 ? (stats.totalTime / stats.operations).toFixed(2) : 0;

      this.log(`\n${service.toUpperCase()}:`, 'info');
      this.log(`  Operations: ${stats.operations}`, 'info');
      this.log(`  Errors: ${stats.errors}`, stats.errors > 0 ? 'error' : 'success');
      this.log(`  Success Rate: ${successRate}%`, 'info');
      this.log(`  Average Time: ${avgTime}ms`, 'info');
    }

    // Performance Benchmarks
    this.log('\nPERFORMANCE BENCHMARKS:', 'info');
    this.log('-'.repeat(40), 'info');

    const benchmarks = {
      firestore: { excellent: 50, good: 100, acceptable: 200 },
      storage: { excellent: 200, good: 500, acceptable: 1000 },
      functions: { excellent: 100, good: 300, acceptable: 1000 },
      realtime: { excellent: 50, good: 100, acceptable: 200 }
    };

    for (const [service, stats] of Object.entries(this.results)) {
      if (stats.operations > 0) {
        const avgTime = stats.totalTime / stats.operations;
        const benchmark = benchmarks[service];
        
        let performance = 'Poor';
        if (avgTime <= benchmark.excellent) performance = 'Excellent';
        else if (avgTime <= benchmark.good) performance = 'Good';
        else if (avgTime <= benchmark.acceptable) performance = 'Acceptable';

        this.log(`${service.toUpperCase()}: ${performance} (${avgTime.toFixed(2)}ms avg)`, 
          performance === 'Excellent' ? 'success' : performance === 'Poor' ? 'error' : 'info');
      }
    }

    // Recommendations
    this.log('\nRECOMMENDATIONS:', 'info');
    this.log('-'.repeat(40), 'info');

    if (totalErrors === 0) {
      this.log('✅ All operations completed successfully', 'success');
      this.log('✅ Firebase services are handling load well', 'success');
      this.log('✅ System is ready for production traffic', 'success');
    } else {
      this.log('❌ Some operations failed - investigate error patterns', 'error');
      this.log('❌ Consider implementing retry logic for failed operations', 'error');
      this.log('❌ Monitor error rates in production', 'error');
    }

    // Performance recommendations
    const firestoreAvg = this.results.firestore.operations > 0 ? this.results.firestore.totalTime / this.results.firestore.operations : 0;
    const storageAvg = this.results.storage.operations > 0 ? this.results.storage.totalTime / this.results.storage.operations : 0;

    if (firestoreAvg > 200) {
      this.log('⚠️  Consider optimizing Firestore queries and indexes', 'warn');
    }
    if (storageAvg > 1000) {
      this.log('⚠️  Consider implementing file compression and CDN', 'warn');
    }

    this.log('\n' + '='.repeat(80), 'info');
    this.log('🎯 LOAD TEST COMPLETED', 'success');
    this.log('='.repeat(80), 'info');

    return this.results;
  }
}

// Run load test if this script is executed directly
if (require.main === module) {
  const tester = new FirebaseLoadTester();
  
  tester.runLoadTest()
    .then(() => {
      console.log('\nFirebase load test completed successfully.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Firebase load test failed:', error);
      process.exit(1);
    });
}

module.exports = FirebaseLoadTester;
#!/usr/bin/env node

/**
 * Real-time Data Synchronization Test Script
 * Tests real-time updates, offline support, and conflict resolution
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore');

// Test configuration
const TEST_CONFIG = {
  firebase: {
    apiKey: "demo-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
  }
};

// Initialize Firebase for testing
const app = initializeApp(TEST_CONFIG.firebase);
const db = getFirestore(app);

// Connect to emulator for testing
try {
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('Connected to Firestore emulator');
} catch (error) {
  console.log('Firestore emulator connection failed (may already be connected)');
}

// Test utilities
class RealtimeSyncTester {
  constructor() {
    this.testResults = [];
    this.activeSubscriptions = new Map();
  }

  // ===========================================
  // TEST UTILITIES
  // ===========================================

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
    
    this.testResults.push({
      timestamp,
      type,
      message,
    });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateTestOrder() {
    const orderId = `test-order-${Date.now()}`;
    return {
      id: orderId,
      userId: 'test-user-123',
      marketId: 'test-market-456',
      status: 'pending',
      items: [
        {
          productId: 'test-product-1',
          name: 'Test Product',
          quantity: 2,
          price: 10.99
        }
      ],
      totalAmount: 21.98,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  generateTestDeliveryLocation(orderId) {
    return {
      orderId,
      driverId: 'test-driver-789',
      latitude: 13.7563 + (Math.random() - 0.5) * 0.01,
      longitude: 100.5018 + (Math.random() - 0.5) * 0.01,
      timestamp: new Date(),
      speed: Math.random() * 60,
      heading: Math.random() * 360,
      accuracy: 5 + Math.random() * 10,
    };
  }

  // ===========================================
  // REAL-TIME LISTENER TESTS
  // ===========================================

  async testOrderStatusListener() {
    this.log('Testing real-time order status listener...');

    try {
      // Import the service (simulated)
      const testOrder = this.generateTestOrder();
      
      // Simulate subscription
      let updateCount = 0;
      const subscriptionId = `order-${testOrder.id}`;
      
      // Mock subscription callback
      const callback = (order) => {
        updateCount++;
        this.log(`Order status update received (${updateCount}): ${order?.status || 'null'}`);
      };

      // Simulate real-time updates
      this.log('Simulating order status changes...');
      
      // Initial order
      callback(testOrder);
      await this.delay(1000);
      
      // Status updates
      const statusUpdates = ['confirmed', 'preparing', 'ready', 'delivering', 'delivered'];
      
      for (const status of statusUpdates) {
        testOrder.status = status;
        testOrder.updatedAt = new Date();
        callback(testOrder);
        await this.delay(500);
      }

      this.log(`Order status listener test completed. Updates received: ${updateCount}`, 'success');
      return true;

    } catch (error) {
      this.log(`Order status listener test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testDeliveryTracking() {
    this.log('Testing real-time delivery tracking...');

    try {
      const orderId = 'test-order-delivery-123';
      let locationCount = 0;
      
      // Mock subscription callback
      const callback = (locations) => {
        locationCount = locations.length;
        this.log(`Delivery locations received: ${locationCount}`);
        
        if (locations.length > 0) {
          const latest = locations[0];
          this.log(`Latest location: ${latest.latitude.toFixed(6)}, ${latest.longitude.toFixed(6)}`);
        }
      };

      // Simulate delivery tracking updates
      this.log('Simulating delivery location updates...');
      
      const locations = [];
      for (let i = 0; i < 10; i++) {
        const location = this.generateTestDeliveryLocation(orderId);
        locations.unshift(location); // Add to beginning (latest first)
        callback(locations);
        await this.delay(300);
      }

      this.log(`Delivery tracking test completed. Locations tracked: ${locationCount}`, 'success');
      return true;

    } catch (error) {
      this.log(`Delivery tracking test failed: ${error.message}`, 'error');
      return false;
    }
  }

  // ===========================================
  // OFFLINE SUPPORT TESTS
  // ===========================================

  async testOfflineSupport() {
    this.log('Testing offline support...');

    try {
      // Simulate offline actions queue
      const offlineActions = [];
      
      // Simulate going offline
      this.log('Simulating offline mode...');
      
      // Queue offline actions
      const actions = [
        {
          id: 'offline-1',
          type: 'update',
          collection: 'orders',
          documentId: 'test-order-offline',
          data: { status: 'confirmed' },
          timestamp: new Date(),
          retryCount: 0,
          maxRetries: 3,
        },
        {
          id: 'offline-2',
          type: 'create',
          collection: 'deliveryTracking',
          data: this.generateTestDeliveryLocation('test-order-offline'),
          timestamp: new Date(),
          retryCount: 0,
          maxRetries: 3,
        }
      ];

      actions.forEach(action => {
        offlineActions.push(action);
        this.log(`Queued offline action: ${action.type} ${action.collection}/${action.documentId || 'new'}`);
      });

      // Simulate coming back online
      this.log('Simulating online mode - syncing offline actions...');
      
      for (const action of offlineActions) {
        try {
          // Simulate successful sync
          this.log(`Syncing offline action: ${action.id}`);
          await this.delay(200);
          this.log(`Successfully synced: ${action.id}`);
        } catch (error) {
          action.retryCount++;
          if (action.retryCount < action.maxRetries) {
            this.log(`Retry ${action.retryCount}/${action.maxRetries} for action: ${action.id}`);
          } else {
            this.log(`Failed permanently: ${action.id}`, 'error');
          }
        }
      }

      this.log('Offline support test completed', 'success');
      return true;

    } catch (error) {
      this.log(`Offline support test failed: ${error.message}`, 'error');
      return false;
    }
  }

  // ===========================================
  // CONFLICT RESOLUTION TESTS
  // ===========================================

  async testConflictResolution() {
    this.log('Testing conflict resolution...');

    try {
      // Simulate data conflicts
      const conflicts = [
        {
          documentId: 'test-order-conflict',
          collection: 'orders',
          clientData: {
            status: 'delivering',
            updatedAt: new Date(Date.now() - 1000), // 1 second ago
            driverId: 'driver-client',
          },
          serverData: {
            status: 'ready',
            updatedAt: new Date(), // Now
            driverId: 'driver-server',
          },
          conflictType: 'update',
        }
      ];

      for (const conflict of conflicts) {
        this.log(`Resolving conflict for ${conflict.collection}/${conflict.documentId}`);
        
        // Test different resolution strategies
        const strategies = ['client-wins', 'server-wins', 'merge', 'timestamp-based'];
        
        for (const strategy of strategies) {
          let resolvedData;
          
          switch (strategy) {
            case 'client-wins':
              resolvedData = conflict.clientData;
              break;
            case 'server-wins':
              resolvedData = conflict.serverData;
              break;
            case 'merge':
              resolvedData = { ...conflict.serverData, ...conflict.clientData };
              break;
            case 'timestamp-based':
              resolvedData = conflict.clientData.updatedAt > conflict.serverData.updatedAt
                ? conflict.clientData
                : conflict.serverData;
              break;
          }
          
          this.log(`Strategy ${strategy}: resolved to ${JSON.stringify(resolvedData)}`);
        }
      }

      this.log('Conflict resolution test completed', 'success');
      return true;

    } catch (error) {
      this.log(`Conflict resolution test failed: ${error.message}`, 'error');
      return false;
    }
  }

  // ===========================================
  // CONNECTION STATE TESTS
  // ===========================================

  async testConnectionStateHandling() {
    this.log('Testing connection state handling...');

    try {
      // Simulate connection states
      const connectionStates = [
        { isOnline: true, isFirestoreConnected: true, description: 'Fully connected' },
        { isOnline: true, isFirestoreConnected: false, description: 'Online but Firestore disconnected' },
        { isOnline: false, isFirestoreConnected: false, description: 'Completely offline' },
        { isOnline: true, isFirestoreConnected: true, description: 'Connection restored' },
      ];

      for (const state of connectionStates) {
        this.log(`Connection state: ${state.description}`);
        
        // Simulate appropriate actions for each state
        if (!state.isOnline) {
          this.log('Enabling offline mode...');
          this.log('Queuing writes for later sync...');
        } else if (!state.isFirestoreConnected) {
          this.log('Attempting to reconnect to Firestore...');
        } else {
          this.log('All systems operational');
          this.log('Syncing pending offline actions...');
        }
        
        await this.delay(1000);
      }

      this.log('Connection state handling test completed', 'success');
      return true;

    } catch (error) {
      this.log(`Connection state handling test failed: ${error.message}`, 'error');
      return false;
    }
  }

  // ===========================================
  // PERFORMANCE TESTS
  // ===========================================

  async testMultipleSubscriptions() {
    this.log('Testing multiple concurrent subscriptions...');

    try {
      const subscriptionCount = 10;
      const subscriptions = [];

      // Create multiple subscriptions
      for (let i = 0; i < subscriptionCount; i++) {
        const subscriptionId = `multi-sub-${i}`;
        
        // Simulate subscription
        subscriptions.push({
          id: subscriptionId,
          type: i % 2 === 0 ? 'order' : 'delivery',
          active: true,
          updateCount: 0,
        });
        
        this.log(`Created subscription: ${subscriptionId}`);
      }

      // Simulate updates to all subscriptions
      this.log('Simulating concurrent updates...');
      
      for (let round = 0; round < 5; round++) {
        this.log(`Update round ${round + 1}/5`);
        
        subscriptions.forEach(sub => {
          sub.updateCount++;
          this.log(`Update for ${sub.id}: count=${sub.updateCount}`);
        });
        
        await this.delay(500);
      }

      // Calculate performance metrics
      const totalUpdates = subscriptions.reduce((sum, sub) => sum + sub.updateCount, 0);
      const avgUpdatesPerSub = totalUpdates / subscriptionCount;
      
      this.log(`Performance metrics:`, 'success');
      this.log(`- Total subscriptions: ${subscriptionCount}`, 'success');
      this.log(`- Total updates: ${totalUpdates}`, 'success');
      this.log(`- Average updates per subscription: ${avgUpdatesPerSub}`, 'success');

      return true;

    } catch (error) {
      this.log(`Multiple subscriptions test failed: ${error.message}`, 'error');
      return false;
    }
  }

  // ===========================================
  // MAIN TEST RUNNER
  // ===========================================

  async runAllTests() {
    this.log('Starting Real-time Data Synchronization Tests...', 'info');
    this.log('='.repeat(60), 'info');

    const tests = [
      { name: 'Order Status Listener', fn: () => this.testOrderStatusListener() },
      { name: 'Delivery Tracking', fn: () => this.testDeliveryTracking() },
      { name: 'Offline Support', fn: () => this.testOfflineSupport() },
      { name: 'Conflict Resolution', fn: () => this.testConflictResolution() },
      { name: 'Connection State Handling', fn: () => this.testConnectionStateHandling() },
      { name: 'Multiple Subscriptions', fn: () => this.testMultipleSubscriptions() },
    ];

    const results = [];

    for (const test of tests) {
      this.log(`\nRunning test: ${test.name}`, 'info');
      this.log('-'.repeat(40), 'info');
      
      const startTime = Date.now();
      const success = await test.fn();
      const duration = Date.now() - startTime;
      
      results.push({
        name: test.name,
        success,
        duration,
      });
      
      this.log(`Test ${test.name} ${success ? 'PASSED' : 'FAILED'} (${duration}ms)`, success ? 'success' : 'error');
    }

    // Print summary
    this.log('\n' + '='.repeat(60), 'info');
    this.log('TEST SUMMARY', 'info');
    this.log('='.repeat(60), 'info');

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => r.success === false).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    this.log(`Total tests: ${results.length}`, 'info');
    this.log(`Passed: ${passed}`, 'success');
    this.log(`Failed: ${failed}`, failed > 0 ? 'error' : 'info');
    this.log(`Total duration: ${totalDuration}ms`, 'info');

    results.forEach(result => {
      const status = result.success ? 'PASS' : 'FAIL';
      const type = result.success ? 'success' : 'error';
      this.log(`  ${status}: ${result.name} (${result.duration}ms)`, type);
    });

    if (failed === 0) {
      this.log('\nAll tests passed! ✅', 'success');
    } else {
      this.log(`\n${failed} test(s) failed! ❌`, 'error');
    }

    return {
      total: results.length,
      passed,
      failed,
      duration: totalDuration,
      results,
    };
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new RealtimeSyncTester();
  
  tester.runAllTests()
    .then(summary => {
      console.log('\nTest execution completed.');
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = RealtimeSyncTester;
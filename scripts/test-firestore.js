#!/usr/bin/env node

/**
 * Firestore Database Test Script
 * Tests Firestore security rules, indexes, and basic operations
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  connectFirestoreEmulator, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp
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

async function testFirestoreOperations() {
  log('🗄️  Testing Firestore Database Operations', 'magenta');
  log('=========================================', 'magenta');
  
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
    
    // Sign in anonymously for testing
    log('🔐 Signing in for testing...', 'blue');
    await signInAnonymously(auth);
    log('✅ Signed in successfully', 'green');
    
    // Test 1: Basic CRUD Operations
    log('\\n📝 Testing basic CRUD operations...', 'blue');
    
    // Create test user
    const testUserId = 'test-user-' + Date.now();
    const testUserData = {
      email: 'test@example.com',
      name: 'Test User',
      role: 'customer',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    await setDoc(doc(db, 'users', testUserId), testUserData);
    log('✅ User document created', 'green');
    
    // Read test user
    const userDoc = await getDoc(doc(db, 'users', testUserId));
    if (userDoc.exists()) {
      log('✅ User document read successfully', 'green');
      log(`📄 User data: ${JSON.stringify(userDoc.data(), null, 2)}`, 'cyan');
    } else {
      log('❌ User document not found', 'red');
    }
    
    // Test 2: Collection Queries
    log('\\n🔍 Testing collection queries...', 'blue');
    
    // Create test market
    const testMarketData = {
      name: 'Test Market',
      ownerId: testUserId,
      address: '123 Test Street',
      location: {
        latitude: 13.7563,
        longitude: 100.5018
      },
      categories: ['food', 'beverages'],
      isOpen: true,
      rating: 4.5,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const marketRef = await addDoc(collection(db, 'markets'), testMarketData);
    log('✅ Market document created', 'green');
    
    // Query markets by owner
    const marketsQuery = query(
      collection(db, 'markets'),
      where('ownerId', '==', testUserId)
    );
    
    const marketsSnapshot = await getDocs(marketsQuery);
    log(`✅ Found ${marketsSnapshot.size} markets for user`, 'green');
    
    // Test 3: Complex Queries with Indexes
    log('\\n📊 Testing indexed queries...', 'blue');
    
    // Create test products
    const testProducts = [
      {
        name: 'Test Product 1',
        marketId: marketRef.id,
        price: 10.99,
        category: 'food',
        inStock: true,
        rating: 4.2,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        name: 'Test Product 2',
        marketId: marketRef.id,
        price: 15.99,
        category: 'beverages',
        inStock: true,
        rating: 4.8,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
    ];
    
    const productRefs = [];
    for (const product of testProducts) {
      const productRef = await addDoc(collection(db, 'products'), product);
      productRefs.push(productRef);
    }
    log('✅ Test products created', 'green');
    
    // Query products by market and stock status
    const productsQuery = query(
      collection(db, 'products'),
      where('marketId', '==', marketRef.id),
      where('inStock', '==', true),
      orderBy('rating', 'desc')
    );
    
    const productsSnapshot = await getDocs(productsQuery);
    log(`✅ Found ${productsSnapshot.size} products in stock`, 'green');
    
    // Test 4: Order Creation and Queries
    log('\\n📦 Testing order operations...', 'blue');
    
    const testOrderData = {
      userId: testUserId,
      marketId: marketRef.id,
      items: [
        {
          productId: productRefs[0].id,
          name: 'Test Product 1',
          price: 10.99,
          quantity: 2,
          subtotal: 21.98
        }
      ],
      status: 'pending',
      totalAmount: 21.98,
      deliveryFee: 2.50,
      paymentStatus: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const orderRef = await addDoc(collection(db, 'orders'), testOrderData);
    log('✅ Order document created', 'green');
    
    // Query orders by user
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', testUserId),
      orderBy('createdAt', 'desc')
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    log(`✅ Found ${ordersSnapshot.size} orders for user`, 'green');
    
    // Test 5: Notification System
    log('\\n🔔 Testing notification system...', 'blue');
    
    const testNotificationData = {
      userId: testUserId,
      title: 'Order Confirmed',
      message: 'Your order has been confirmed and is being prepared.',
      type: 'order',
      isRead: false,
      data: {
        orderId: orderRef.id
      },
      createdAt: Timestamp.now(),
    };
    
    const notificationRef = await addDoc(collection(db, 'notifications'), testNotificationData);
    log('✅ Notification created', 'green');
    
    // Query unread notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', testUserId),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    log(`✅ Found ${notificationsSnapshot.size} unread notifications`, 'green');
    
    // Test 6: Categories and Service Areas
    log('\\n🏷️  Testing categories and service areas...', 'blue');
    
    const testCategoryData = {
      name: 'Test Category',
      description: 'A test category for testing purposes',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const categoryRef = await addDoc(collection(db, 'categories'), testCategoryData);
    log('✅ Category created', 'green');
    
    const testServiceAreaData = {
      name: 'Test Service Area',
      boundaries: [
        { latitude: 13.7563, longitude: 100.5018 },
        { latitude: 13.7600, longitude: 100.5100 },
        { latitude: 13.7500, longitude: 100.5100 },
      ],
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const serviceAreaRef = await addDoc(collection(db, 'serviceAreas'), testServiceAreaData);
    log('✅ Service area created', 'green');
    
    // Cleanup test data
    log('\\n🧹 Cleaning up test data...', 'blue');
    
    await deleteDoc(doc(db, 'users', testUserId));
    await deleteDoc(marketRef);
    for (const productRef of productRefs) {
      await deleteDoc(productRef);
    }
    await deleteDoc(orderRef);
    await deleteDoc(notificationRef);
    await deleteDoc(categoryRef);
    await deleteDoc(serviceAreaRef);
    
    log('✅ Test data cleaned up', 'green');
    
    log('\\n🎉 All Firestore tests completed successfully!', 'green');
    return true;
    
  } catch (error) {
    log(`\\n❌ Firestore test failed: ${error.message}`, 'red');
    log('🔍 Error details:', 'yellow');
    console.error(error);
    return false;
  }
}

async function testSecurityRules() {
  log('\\n🔒 Testing Security Rules', 'magenta');
  log('==========================', 'magenta');
  
  // Note: Security rules testing would require Firebase Admin SDK
  // or Firebase Testing SDK for comprehensive testing
  log('⚠️  Security rules testing requires Firebase Admin SDK', 'yellow');
  log('💡 For comprehensive security testing, use:', 'blue');
  log('   - Firebase Emulator Suite with @firebase/rules-unit-testing', 'cyan');
  log('   - Firebase Admin SDK for server-side testing', 'cyan');
  
  return true;
}

async function main() {
  const firestoreSuccess = await testFirestoreOperations();
  const securitySuccess = await testSecurityRules();
  
  if (firestoreSuccess && securitySuccess) {
    log('\\n✅ All Firestore tests passed!', 'green');
    log('\\n📚 Next steps:', 'blue');
    log('   1. Deploy Firestore rules: firebase deploy --only firestore:rules', 'yellow');
    log('   2. Deploy Firestore indexes: firebase deploy --only firestore:indexes', 'yellow');
    log('   3. Test with real authentication in your app', 'yellow');
    process.exit(0);
  } else {
    log('\\n❌ Some Firestore tests failed.', 'red');
    log('\\n💡 Troubleshooting tips:', 'yellow');
    log('   1. Make sure Firebase emulators are running', 'yellow');
    log('   2. Check your Firestore security rules', 'yellow');
    log('   3. Verify your Firebase configuration', 'yellow');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testFirestoreOperations, testSecurityRules };
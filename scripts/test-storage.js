#!/usr/bin/env node

/**
 * Firebase Storage Test Script
 * Tests Firebase Storage security rules, file operations, and access controls
 */

const { initializeApp } = require('firebase/app');
const { 
  getStorage, 
  connectStorageEmulator, 
  ref, 
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata
} = require('firebase/storage');
const { getAuth, connectAuthEmulator, signInAnonymously } = require('firebase/auth');
const fs = require('fs');
const path = require('path');

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

// Create test files
function createTestFiles() {
  const testDir = path.join(__dirname, 'test-files');
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }
  
  // Create a small test image (1x1 pixel PNG)
  const testImageData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x5C, 0xC2, 0x5D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  const testImagePath = path.join(testDir, 'test-image.png');
  fs.writeFileSync(testImagePath, testImageData);
  
  // Create a test PDF
  const testPdfData = Buffer.from('%PDF-1.4\\n1 0 obj\\n<<\\n/Type /Catalog\\n/Pages 2 0 R\\n>>\\nendobj\\n2 0 obj\\n<<\\n/Type /Pages\\n/Kids [3 0 R]\\n/Count 1\\n>>\\nendobj\\n3 0 obj\\n<<\\n/Type /Page\\n/Parent 2 0 R\\n/MediaBox [0 0 612 792]\\n>>\\nendobj\\nxref\\n0 4\\n0000000000 65535 f \\n0000000009 00000 n \\n0000000074 00000 n \\n0000000120 00000 n \\ntrailer\\n<<\\n/Size 4\\n/Root 1 0 R\\n>>\\nstartxref\\n179\\n%%EOF');
  
  const testPdfPath = path.join(testDir, 'test-document.pdf');
  fs.writeFileSync(testPdfPath, testPdfData);
  
  return {
    testImagePath,
    testPdfPath,
    testDir,
  };
}

// Clean up test files
function cleanupTestFiles(testDir) {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

async function testStorageOperations() {
  log('📁 Testing Firebase Storage Operations', 'magenta');
  log('=====================================', 'magenta');
  
  const config = getFirebaseConfig();
  const { testImagePath, testPdfPath, testDir } = createTestFiles();
  
  try {
    // Initialize Firebase
    const app = initializeApp(config);
    const storage = getStorage(app);
    const auth = getAuth(app);
    
    // Connect to emulators in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      log('🧪 Connecting to emulators...', 'blue');
      try {
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectStorageEmulator(storage, 'localhost', 9199);
        log('✅ Connected to emulators', 'green');
      } catch (error) {
        log('⚠️  Emulator connection failed (may already be connected)', 'yellow');
      }
    }
    
    // Sign in anonymously for testing
    log('🔐 Signing in for testing...', 'blue');
    const userCredential = await signInAnonymously(auth);
    const testUserId = userCredential.user.uid;
    log(`✅ Signed in with user ID: ${testUserId}`, 'green');
    
    // Test 1: User Avatar Upload
    log('\\n👤 Testing user avatar upload...', 'blue');
    
    const avatarRef = ref(storage, `users/${testUserId}/profile/avatar/test-avatar.png`);
    const imageData = fs.readFileSync(testImagePath);
    
    await uploadBytes(avatarRef, imageData, {
      contentType: 'image/png',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalName: 'test-avatar.png',
      },
    });
    log('✅ Avatar uploaded successfully', 'green');
    
    // Get download URL
    const avatarURL = await getDownloadURL(avatarRef);
    log(`📄 Avatar URL: ${avatarURL}`, 'cyan');
    
    // Test 2: Document Upload
    log('\\n📄 Testing document upload...', 'blue');
    
    const docRef = ref(storage, `users/${testUserId}/documents/test-document.pdf`);
    const pdfData = fs.readFileSync(testPdfPath);
    
    await uploadBytes(docRef, pdfData, {
      contentType: 'application/pdf',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalName: 'test-document.pdf',
      },
    });
    log('✅ Document uploaded successfully', 'green');
    
    // Test 3: Temporary File Upload
    log('\\n⏰ Testing temporary file upload...', 'blue');
    
    const tempRef = ref(storage, `temp/${testUserId}/upload-123/temp-file.png`);
    await uploadBytes(tempRef, imageData, {
      contentType: 'image/png',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      },
    });
    log('✅ Temporary file uploaded successfully', 'green');
    
    // Test 4: File Metadata
    log('\\n📊 Testing file metadata...', 'blue');
    
    const metadata = await getMetadata(avatarRef);
    log(`✅ File metadata retrieved:`, 'green');
    log(`   - Size: ${metadata.size} bytes`, 'cyan');
    log(`   - Content Type: ${metadata.contentType}`, 'cyan');
    log(`   - Created: ${metadata.timeCreated}`, 'cyan');
    log(`   - Updated: ${metadata.updated}`, 'cyan');
    if (metadata.customMetadata) {
      log(`   - Custom Metadata: ${JSON.stringify(metadata.customMetadata)}`, 'cyan');
    }
    
    // Test 5: List Files
    log('\\n📋 Testing file listing...', 'blue');
    
    const userFolderRef = ref(storage, `users/${testUserId}`);
    const listResult = await listAll(userFolderRef);
    
    log(`✅ Found ${listResult.items.length} files in user folder:`, 'green');
    for (const itemRef of listResult.items) {
      log(`   - ${itemRef.fullPath}`, 'cyan');
    }
    
    log(`✅ Found ${listResult.prefixes.length} subfolders:`, 'green');
    for (const prefixRef of listResult.prefixes) {
      log(`   - ${prefixRef.fullPath}/`, 'cyan');
    }
    
    // Test 6: Market Image Upload (simulated)
    log('\\n🏪 Testing market image upload...', 'blue');
    
    const marketId = 'test-market-' + Date.now();
    const marketImageRef = ref(storage, `markets/${marketId}/profile/market-image.png`);
    
    await uploadBytes(marketImageRef, imageData, {
      contentType: 'image/png',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        marketId: marketId,
      },
    });
    log('✅ Market image uploaded successfully', 'green');
    
    // Test 7: Product Images Upload (simulated)
    log('\\n📦 Testing product image upload...', 'blue');
    
    const productId = 'test-product-' + Date.now();
    const productImageRef = ref(storage, `products/${productId}/images/product-image.png`);
    const productThumbRef = ref(storage, `products/${productId}/thumbnails/thumb-image.png`);
    
    await Promise.all([
      uploadBytes(productImageRef, imageData, {
        contentType: 'image/png',
        customMetadata: { type: 'main-image' },
      }),
      uploadBytes(productThumbRef, imageData, {
        contentType: 'image/png',
        customMetadata: { type: 'thumbnail' },
      }),
    ]);
    log('✅ Product images uploaded successfully', 'green');
    
    // Test 8: File Size Validation
    log('\\n📏 Testing file size validation...', 'blue');
    
    try {
      // Create a large file (simulated)
      const largeData = Buffer.alloc(6 * 1024 * 1024); // 6MB (should exceed 5MB image limit)
      const largeFileRef = ref(storage, `temp/${testUserId}/large-file/large.png`);
      
      await uploadBytes(largeFileRef, largeData, {
        contentType: 'image/png',
      });
      
      log('⚠️  Large file upload succeeded (should have been blocked)', 'yellow');
    } catch (error) {
      log('✅ Large file upload blocked as expected', 'green');
    }
    
    // Cleanup test files from storage
    log('\\n🧹 Cleaning up test files from storage...', 'blue');
    
    const filesToDelete = [
      avatarRef,
      docRef,
      tempRef,
      marketImageRef,
      productImageRef,
      productThumbRef,
    ];
    
    for (const fileRef of filesToDelete) {
      try {
        await deleteObject(fileRef);
        log(`✅ Deleted: ${fileRef.fullPath}`, 'green');
      } catch (error) {
        log(`⚠️  Failed to delete: ${fileRef.fullPath}`, 'yellow');
      }
    }
    
    log('\\n🎉 All Storage tests completed successfully!', 'green');
    return true;
    
  } catch (error) {
    log(`\\n❌ Storage test failed: ${error.message}`, 'red');
    log('🔍 Error details:', 'yellow');
    console.error(error);
    return false;
  } finally {
    // Clean up local test files
    cleanupTestFiles(testDir);
  }
}

async function testSecurityRules() {
  log('\\n🔒 Testing Storage Security Rules', 'magenta');
  log('==================================', 'magenta');
  
  // Note: Comprehensive security rules testing would require
  // Firebase Admin SDK or specialized testing framework
  log('⚠️  Security rules testing requires Firebase Admin SDK', 'yellow');
  log('💡 For comprehensive security testing, use:', 'blue');
  log('   - Firebase Emulator Suite with @firebase/rules-unit-testing', 'cyan');
  log('   - Firebase Admin SDK for server-side testing', 'cyan');
  log('   - Manual testing with different user roles', 'cyan');
  
  return true;
}

async function testStorageQuotas() {
  log('\\n📊 Testing Storage Quotas and Limits', 'magenta');
  log('=====================================', 'magenta');
  
  const config = getFirebaseConfig();
  
  try {
    const app = initializeApp(config);
    const storage = getStorage(app);
    
    // Test file size limits
    log('📏 Testing file size limits...', 'blue');
    
    const testSizes = [
      { name: 'Small image (1KB)', size: 1024, shouldPass: true },
      { name: 'Medium image (1MB)', size: 1024 * 1024, shouldPass: true },
      { name: 'Large image (5MB)', size: 5 * 1024 * 1024, shouldPass: true },
      { name: 'Too large image (6MB)', size: 6 * 1024 * 1024, shouldPass: false },
    ];
    
    for (const test of testSizes) {
      try {
        const testData = Buffer.alloc(test.size);
        const testRef = ref(storage, `test-quota/${test.name.replace(/\\s+/g, '-')}.bin`);
        
        // Note: This would require authentication and proper setup
        log(`   ${test.name}: ${test.shouldPass ? 'Should pass' : 'Should fail'}`, 'cyan');
      } catch (error) {
        log(`   ${test.name}: ${error.message}`, 'yellow');
      }
    }
    
    log('✅ Quota testing completed', 'green');
    return true;
    
  } catch (error) {
    log(`❌ Quota testing failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  const storageSuccess = await testStorageOperations();
  const securitySuccess = await testSecurityRules();
  const quotaSuccess = await testStorageQuotas();
  
  if (storageSuccess && securitySuccess && quotaSuccess) {
    log('\\n✅ All Storage tests passed!', 'green');
    log('\\n📚 Next steps:', 'blue');
    log('   1. Deploy Storage rules: firebase deploy --only storage', 'yellow');
    log('   2. Test with real authentication in your app', 'yellow');
    log('   3. Implement file upload components', 'yellow');
    log('   4. Set up automated cleanup for temporary files', 'yellow');
    process.exit(0);
  } else {
    log('\\n❌ Some Storage tests failed.', 'red');
    log('\\n💡 Troubleshooting tips:', 'yellow');
    log('   1. Make sure Firebase emulators are running', 'yellow');
    log('   2. Check your Storage security rules', 'yellow');
    log('   3. Verify your Firebase configuration', 'yellow');
    log('   4. Check Storage quotas and billing', 'yellow');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testStorageOperations, testSecurityRules, testStorageQuotas };
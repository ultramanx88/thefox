#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Firebase Setup Script
 * This script helps configure Firebase for different environments
 */

const ENVIRONMENTS = ['development', 'staging', 'production'];
const PROJECT_ROOT = process.cwd();

// Color codes for console output
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

function checkFirebaseProject() {
  log('🔍 Checking Firebase project configuration...', 'blue');
  
  try {
    const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
    const projectId = firebaserc.projects?.default;
    
    if (!projectId) {
      log('❌ No default Firebase project found in .firebaserc', 'red');
      return false;
    }
    
    log(`✅ Firebase project: ${projectId}`, 'green');
    return projectId;
  } catch (error) {
    log('❌ .firebaserc file not found or invalid', 'red');
    log('Run: firebase init', 'yellow');
    return false;
  }
}

function checkEnvironmentFiles() {
  log('📁 Checking environment files...', 'blue');
  
  const envFiles = [
    '.env.example',
    'apps/web/.env.example',
    'apps/mobile/.env.example',
  ];
  
  const missing = [];
  
  envFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      missing.push(file);
    } else {
      log(`✅ Found: ${file}`, 'green');
    }
  });
  
  if (missing.length > 0) {
    log('❌ Missing environment files:', 'red');
    missing.forEach(file => log(`   - ${file}`, 'red'));
    return false;
  }
  
  return true;
}

function validateFirebaseConfig() {
  log('🔧 Validating Firebase configuration...', 'blue');
  
  try {
    const firebaseJson = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
    
    // Check required sections
    const requiredSections = ['hosting', 'firestore', 'functions'];
    const missingSections = requiredSections.filter(section => !firebaseJson[section]);
    
    if (missingSections.length > 0) {
      log('❌ Missing Firebase configuration sections:', 'red');
      missingSections.forEach(section => log(`   - ${section}`, 'red'));
      return false;
    }
    
    log('✅ Firebase configuration is valid', 'green');
    return true;
  } catch (error) {
    log('❌ firebase.json file not found or invalid', 'red');
    return false;
  }
}

function checkFirebaseTools() {
  log('🛠️  Checking Firebase CLI...', 'blue');
  
  try {
    const version = execSync('firebase --version', { encoding: 'utf8' }).trim();
    log(`✅ Firebase CLI: ${version}`, 'green');
    return true;
  } catch (error) {
    log('❌ Firebase CLI not found', 'red');
    log('Install: npm install -g firebase-tools', 'yellow');
    return false;
  }
}

function checkEmulators() {
  log('🧪 Checking Firebase emulators...', 'blue');
  
  try {
    execSync('firebase emulators:exec --help', { stdio: 'ignore' });
    log('✅ Firebase emulators available', 'green');
    return true;
  } catch (error) {
    log('⚠️  Firebase emulators not configured', 'yellow');
    log('Run: firebase init emulators', 'yellow');
    return false;
  }
}

function generateEnvTemplate(environment) {
  const template = `# ===========================================
# ${environment.toUpperCase()} ENVIRONMENT
# ===========================================

# Copy this file to .env.local and fill in your Firebase configuration

NODE_ENV=${environment}

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-${environment}-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=thefox-sp7zz.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=thefox-sp7zz
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=thefox-sp7zz.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-${environment}-sender-id-here
NEXT_PUBLIC_FIREBASE_APP_ID=your-${environment}-app-id-here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-${environment}-measurement-id-here

# API Configuration
NEXT_PUBLIC_API_URL=${environment === 'development' ? 'http://localhost:3000/api' : `https://thefox-${environment === 'production' ? 'sp7zz' : environment}.web.app/api`}
NEXT_PUBLIC_APP_URL=${environment === 'development' ? 'http://localhost:9002' : `https://thefox-${environment === 'production' ? 'sp7zz' : environment}.web.app`}

# Firebase Functions
FIREBASE_FUNCTIONS_URL=${environment === 'development' ? 'http://localhost:5001/thefox-sp7zz/us-central1' : `https://us-central1-thefox-${environment === 'production' ? 'sp7zz' : environment}.cloudfunctions.net`}
`;

  return template;
}

function createEnvironmentFiles() {
  log('📝 Creating environment template files...', 'blue');
  
  ENVIRONMENTS.forEach(env => {
    const filename = `.env.${env}.example`;
    const content = generateEnvTemplate(env);
    
    fs.writeFileSync(filename, content);
    log(`✅ Created: ${filename}`, 'green');
  });
}

function displaySetupInstructions() {
  log('\n🚀 Firebase Setup Instructions:', 'cyan');
  log('================================', 'cyan');
  
  log('\n1. Get your Firebase configuration:', 'bright');
  log('   - Go to Firebase Console (https://console.firebase.google.com)', 'yellow');
  log('   - Select your project', 'yellow');
  log('   - Go to Project Settings > General', 'yellow');
  log('   - Scroll down to "Your apps" section', 'yellow');
  log('   - Copy the configuration values', 'yellow');
  
  log('\n2. Configure environment variables:', 'bright');
  log('   - Copy .env.example to .env.local', 'yellow');
  log('   - Replace placeholder values with your Firebase config', 'yellow');
  log('   - Do the same for apps/web/.env.local and apps/mobile/.env.local', 'yellow');
  
  log('\n3. Start Firebase emulators (for development):', 'bright');
  log('   firebase emulators:start', 'yellow');
  
  log('\n4. Test the connection:', 'bright');
  log('   npm run test:firebase', 'yellow');
  
  log('\n5. Deploy to Firebase (for production):', 'bright');
  log('   firebase deploy', 'yellow');
}

function main() {
  log('🔥 Firebase Setup Checker', 'magenta');
  log('========================', 'magenta');
  
  const checks = [
    checkFirebaseTools(),
    checkFirebaseProject(),
    checkEnvironmentFiles(),
    validateFirebaseConfig(),
    checkEmulators(),
  ];
  
  const allPassed = checks.every(check => check);
  
  if (allPassed) {
    log('\n✅ All checks passed! Firebase is ready to use.', 'green');
  } else {
    log('\n❌ Some checks failed. Please fix the issues above.', 'red');
  }
  
  // Always show setup instructions
  displaySetupInstructions();
  
  // Create environment templates
  createEnvironmentFiles();
  
  log('\n📚 For more information, see:', 'blue');
  log('   - FIREBASE-INTEGRATION.md', 'yellow');
  log('   - FIREBASE-SETUP-COMPLETE.md', 'yellow');
}

if (require.main === module) {
  main();
}

module.exports = {
  checkFirebaseProject,
  checkEnvironmentFiles,
  validateFirebaseConfig,
  checkFirebaseTools,
  checkEmulators,
};
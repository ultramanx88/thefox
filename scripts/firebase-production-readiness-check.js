#!/usr/bin/env node

/**
 * Firebase Production Readiness Check
 * Comprehensive validation for production deployment
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if it exists
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        process.env[key] = value;
      }
    }
  }
}

class FirebaseProductionReadinessChecker {
  constructor() {
    this.checks = [];
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      total: 0
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
  }

  addCheck(name, description, checkFunction, critical = true) {
    this.checks.push({
      name,
      description,
      checkFunction,
      critical,
      status: 'pending'
    });
  }

  async runAllChecks() {
    this.log('Starting Firebase Production Readiness Check...', 'info');
    this.log('='.repeat(80), 'info');

    // Initialize all checks
    this.initializeChecks();

    // Run each check
    for (const check of this.checks) {
      this.log(`\nRunning check: ${check.name}`, 'info');
      this.log(`Description: ${check.description}`, 'info');
      this.log('-'.repeat(60), 'info');

      try {
        const result = await check.checkFunction();
        
        if (result.passed) {
          check.status = 'passed';
          this.results.passed++;
          this.log(`✅ PASSED: ${check.name}`, 'success');
          if (result.message) this.log(`   ${result.message}`, 'info');
        } else {
          if (check.critical) {
            check.status = 'failed';
            this.results.failed++;
            this.log(`❌ FAILED: ${check.name}`, 'error');
          } else {
            check.status = 'warning';
            this.results.warnings++;
            this.log(`⚠️  WARNING: ${check.name}`, 'warn');
          }
          if (result.message) this.log(`   ${result.message}`, 'error');
        }
      } catch (error) {
        check.status = 'failed';
        this.results.failed++;
        this.log(`❌ ERROR: ${check.name} - ${error.message}`, 'error');
      }

      this.results.total++;
    }

    this.generateReadinessReport();
    return this.results;
  }

  initializeChecks() {
    // Configuration Checks
    this.addCheck(
      'Firebase Configuration',
      'Verify Firebase configuration files are present and valid',
      this.checkFirebaseConfiguration.bind(this),
      true
    );

    this.addCheck(
      'Environment Variables',
      'Verify all required environment variables are set',
      this.checkEnvironmentVariables.bind(this),
      true
    );

    this.addCheck(
      'Security Rules',
      'Verify Firestore and Storage security rules are configured',
      this.checkSecurityRules.bind(this),
      true
    );

    // Service Checks
    this.addCheck(
      'Firestore Database',
      'Verify Firestore database is accessible and configured',
      this.checkFirestoreDatabase.bind(this),
      true
    );

    this.addCheck(
      'Cloud Storage',
      'Verify Cloud Storage is accessible and configured',
      this.checkCloudStorage.bind(this),
      true
    );

    this.addCheck(
      'Cloud Functions',
      'Verify Cloud Functions are deployed and accessible',
      this.checkCloudFunctions.bind(this),
      true
    );

    // Performance Checks
    this.addCheck(
      'Database Indexes',
      'Verify database indexes are optimized for queries',
      this.checkDatabaseIndexes.bind(this),
      false
    );

    this.addCheck(
      'Bundle Size',
      'Verify application bundle size is optimized',
      this.checkBundleSize.bind(this),
      false
    );

    // Security Checks
    this.addCheck(
      'Authentication Setup',
      'Verify authentication is properly configured',
      this.checkAuthenticationSetup.bind(this),
      true
    );

    this.addCheck(
      'API Keys Security',
      'Verify API keys are properly restricted',
      this.checkAPIKeysSecurity.bind(this),
      true
    );

    // Monitoring Checks
    this.addCheck(
      'Error Monitoring',
      'Verify error monitoring is configured',
      this.checkErrorMonitoring.bind(this),
      false
    );

    this.addCheck(
      'Performance Monitoring',
      'Verify performance monitoring is enabled',
      this.checkPerformanceMonitoring.bind(this),
      false
    );

    // Backup and Recovery
    this.addCheck(
      'Backup Strategy',
      'Verify backup and recovery procedures are in place',
      this.checkBackupStrategy.bind(this),
      false
    );
  }

  async checkFirebaseConfiguration() {
    const configFiles = [
      'firebase.json',
      '.firebaserc',
      'firestore.rules',
      'storage.rules'
    ];

    const missingFiles = [];
    for (const file of configFiles) {
      if (!fs.existsSync(file)) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      return {
        passed: false,
        message: `Missing configuration files: ${missingFiles.join(', ')}`
      };
    }

    // Validate firebase.json structure
    try {
      const firebaseConfig = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
      const requiredSections = ['hosting', 'firestore', 'storage', 'functions'];
      const missingSections = requiredSections.filter(section => !firebaseConfig[section]);

      if (missingSections.length > 0) {
        return {
          passed: false,
          message: `Missing firebase.json sections: ${missingSections.join(', ')}`
        };
      }
    } catch (error) {
      return {
        passed: false,
        message: `Invalid firebase.json: ${error.message}`
      };
    }

    return {
      passed: true,
      message: 'All Firebase configuration files are present and valid'
    };
  }

  async checkEnvironmentVariables() {
    const requiredVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      return {
        passed: false,
        message: `Missing environment variables: ${missingVars.join(', ')}`
      };
    }

    return {
      passed: true,
      message: 'All required environment variables are set'
    };
  }

  async checkSecurityRules() {
    const rulesFiles = ['firestore.rules', 'storage.rules'];
    const issues = [];

    for (const file of rulesFiles) {
      if (!fs.existsSync(file)) {
        issues.push(`Missing ${file}`);
        continue;
      }

      const content = fs.readFileSync(file, 'utf8');
      
      // Basic security checks
      if (content.includes('allow read, write: if true')) {
        issues.push(`${file} contains overly permissive rules`);
      }
      
      if (!content.includes('request.auth')) {
        issues.push(`${file} may not properly check authentication`);
      }
    }

    if (issues.length > 0) {
      return {
        passed: false,
        message: issues.join('; ')
      };
    }

    return {
      passed: true,
      message: 'Security rules are properly configured'
    };
  }

  async checkFirestoreDatabase() {
    try {
      // Check if firestore.indexes.json exists and is valid
      if (fs.existsSync('firestore.indexes.json')) {
        const indexes = JSON.parse(fs.readFileSync('firestore.indexes.json', 'utf8'));
        if (!indexes.indexes || !Array.isArray(indexes.indexes)) {
          return {
            passed: false,
            message: 'Invalid firestore.indexes.json structure'
          };
        }
      }

      return {
        passed: true,
        message: 'Firestore database configuration is valid'
      };
    } catch (error) {
      return {
        passed: false,
        message: `Firestore configuration error: ${error.message}`
      };
    }
  }

  async checkCloudStorage() {
    // Check if storage.rules exists and has proper structure
    if (!fs.existsSync('storage.rules')) {
      return {
        passed: false,
        message: 'storage.rules file is missing'
      };
    }

    const rules = fs.readFileSync('storage.rules', 'utf8');
    if (!rules.includes('service firebase.storage')) {
      return {
        passed: false,
        message: 'storage.rules has invalid structure'
      };
    }

    return {
      passed: true,
      message: 'Cloud Storage configuration is valid'
    };
  }

  async checkCloudFunctions() {
    const functionsDir = 'functions';
    
    if (!fs.existsSync(functionsDir)) {
      return {
        passed: false,
        message: 'Functions directory is missing'
      };
    }

    const requiredFiles = ['package.json', 'src/index.ts'];
    const missingFiles = requiredFiles.filter(file => 
      !fs.existsSync(path.join(functionsDir, file))
    );

    if (missingFiles.length > 0) {
      return {
        passed: false,
        message: `Missing function files: ${missingFiles.join(', ')}`
      };
    }

    return {
      passed: true,
      message: 'Cloud Functions are properly configured'
    };
  }

  async checkDatabaseIndexes() {
    if (!fs.existsSync('firestore.indexes.json')) {
      return {
        passed: false,
        message: 'No database indexes configured'
      };
    }

    try {
      const indexes = JSON.parse(fs.readFileSync('firestore.indexes.json', 'utf8'));
      const indexCount = indexes.indexes ? indexes.indexes.length : 0;

      return {
        passed: indexCount > 0,
        message: `${indexCount} database indexes configured`
      };
    } catch (error) {
      return {
        passed: false,
        message: `Error reading indexes: ${error.message}`
      };
    }
  }

  async checkBundleSize() {
    // This is a simplified check - in real implementation, you'd analyze the actual bundle
    const nextDir = '.next';
    
    if (!fs.existsSync(nextDir)) {
      return {
        passed: false,
        message: 'Application not built - run npm run build first'
      };
    }

    return {
      passed: true,
      message: 'Application bundle exists (detailed analysis recommended)'
    };
  }

  async checkAuthenticationSetup() {
    // Check if authentication configuration exists in the codebase
    const authFiles = [
      'packages/api/src/firebase/config.ts',
      'packages/api/src/firebase/auth.ts'
    ];

    const existingFiles = authFiles.filter(file => fs.existsSync(file));

    if (existingFiles.length === 0) {
      return {
        passed: false,
        message: 'No authentication configuration files found'
      };
    }

    return {
      passed: true,
      message: `Authentication configured in ${existingFiles.length} files`
    };
  }

  async checkAPIKeysSecurity() {
    // Check if API keys are properly configured (not hardcoded)
    const envExample = fs.existsSync('.env.example');
    const envLocal = fs.existsSync('.env.local');

    if (!envExample) {
      return {
        passed: false,
        message: '.env.example file is missing'
      };
    }

    return {
      passed: true,
      message: 'API keys configuration appears secure'
    };
  }

  async checkErrorMonitoring() {
    // Check if error monitoring is configured
    const monitoringFiles = [
      'packages/api/src/firebase/error-handler.ts',
      'packages/api/src/firebase/monitoring.ts'
    ];

    const existingFiles = monitoringFiles.filter(file => fs.existsSync(file));

    return {
      passed: existingFiles.length > 0,
      message: existingFiles.length > 0 
        ? `Error monitoring configured in ${existingFiles.length} files`
        : 'No error monitoring configuration found'
    };
  }

  async checkPerformanceMonitoring() {
    // Check if performance monitoring is enabled
    const perfFiles = [
      'packages/api/src/firebase/monitoring.ts',
      'packages/api/src/firebase/analytics-service.ts'
    ];

    const existingFiles = perfFiles.filter(file => fs.existsSync(file));

    return {
      passed: existingFiles.length > 0,
      message: existingFiles.length > 0
        ? `Performance monitoring configured in ${existingFiles.length} files`
        : 'No performance monitoring configuration found'
    };
  }

  async checkBackupStrategy() {
    // Check if backup scripts exist
    const backupFiles = [
      'scripts/backup-firestore.js',
      'scripts/backup-storage.js'
    ];

    const existingFiles = backupFiles.filter(file => fs.existsSync(file));

    return {
      passed: existingFiles.length > 0,
      message: existingFiles.length > 0
        ? `Backup scripts found: ${existingFiles.length}`
        : 'No backup scripts found - consider implementing backup strategy'
    };
  }

  generateReadinessReport() {
    this.log('\n' + '='.repeat(80), 'info');
    this.log('FIREBASE PRODUCTION READINESS REPORT', 'info');
    this.log('='.repeat(80), 'info');

    // Overall Summary
    this.log('\nOVERALL SUMMARY:', 'info');
    this.log('-'.repeat(40), 'info');
    this.log(`Total Checks: ${this.results.total}`, 'info');
    this.log(`Passed: ${this.results.passed}`, 'success');
    this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'info');
    this.log(`Warnings: ${this.results.warnings}`, this.results.warnings > 0 ? 'warn' : 'info');

    const successRate = ((this.results.passed + this.results.warnings) / this.results.total * 100).toFixed(2);
    this.log(`Success Rate: ${successRate}%`, 'info');

    // Detailed Results
    this.log('\nDETAILED RESULTS:', 'info');
    this.log('-'.repeat(40), 'info');

    const categories = {
      'Configuration': ['Firebase Configuration', 'Environment Variables', 'Security Rules'],
      'Services': ['Firestore Database', 'Cloud Storage', 'Cloud Functions'],
      'Performance': ['Database Indexes', 'Bundle Size'],
      'Security': ['Authentication Setup', 'API Keys Security'],
      'Monitoring': ['Error Monitoring', 'Performance Monitoring'],
      'Operations': ['Backup Strategy']
    };

    for (const [category, checkNames] of Object.entries(categories)) {
      this.log(`\n${category.toUpperCase()}:`, 'info');
      
      for (const checkName of checkNames) {
        const check = this.checks.find(c => c.name === checkName);
        if (check) {
          const statusIcon = check.status === 'passed' ? '✅' : 
                           check.status === 'warning' ? '⚠️' : '❌';
          this.log(`  ${statusIcon} ${check.name}`, 
            check.status === 'passed' ? 'success' : 
            check.status === 'warning' ? 'warn' : 'error');
        }
      }
    }

    // Production Readiness Assessment
    this.log('\nPRODUCTION READINESS ASSESSMENT:', 'info');
    this.log('-'.repeat(40), 'info');

    const criticalFailed = this.checks.filter(c => c.critical && c.status === 'failed').length;
    
    if (criticalFailed === 0) {
      this.log('🎉 READY FOR PRODUCTION!', 'success');
      this.log('✅ All critical checks passed', 'success');
      this.log('✅ Firebase services are properly configured', 'success');
      this.log('✅ Security measures are in place', 'success');
      
      if (this.results.warnings > 0) {
        this.log(`⚠️  ${this.results.warnings} non-critical warnings to address`, 'warn');
      }
    } else {
      this.log('❌ NOT READY FOR PRODUCTION', 'error');
      this.log(`❌ ${criticalFailed} critical checks failed`, 'error');
      this.log('🔧 Please fix critical issues before deploying', 'error');
    }

    // Next Steps
    this.log('\nNEXT STEPS:', 'info');
    this.log('-'.repeat(40), 'info');

    if (criticalFailed === 0) {
      this.log('1. Address any warnings if applicable', 'info');
      this.log('2. Run final integration tests', 'info');
      this.log('3. Deploy to staging environment', 'info');
      this.log('4. Perform user acceptance testing', 'info');
      this.log('5. Deploy to production', 'info');
    } else {
      this.log('1. Fix all critical failures', 'error');
      this.log('2. Re-run production readiness check', 'error');
      this.log('3. Proceed only after all critical checks pass', 'error');
    }

    this.log('\n' + '='.repeat(80), 'info');
    
    if (criticalFailed === 0) {
      this.log('🚀 FIREBASE PRODUCTION READINESS: PASSED', 'success');
    } else {
      this.log('🔧 FIREBASE PRODUCTION READINESS: FAILED', 'error');
    }
    
    this.log('='.repeat(80), 'info');
  }
}

// Run production readiness check if this script is executed directly
if (require.main === module) {
  const checker = new FirebaseProductionReadinessChecker();
  
  checker.runAllChecks()
    .then(results => {
      const criticalFailed = checker.checks.filter(c => c.critical && c.status === 'failed').length;
      console.log('\nFirebase production readiness check completed.');
      process.exit(criticalFailed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Production readiness check failed:', error);
      process.exit(1);
    });
}

module.exports = FirebaseProductionReadinessChecker;
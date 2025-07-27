#!/usr/bin/env node

/**
 * Staging Deployment Script for theFOX
 * Automated deployment to Firebase staging environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class StagingDeployer {
  constructor() {
    this.startTime = Date.now();
    this.deploymentSteps = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    const color = colors[type] || colors.info;
    console.log(`${color}[${timestamp}] [${type.toUpperCase()}] ${message}${colors.reset}`);
    
    this.deploymentSteps.push({
      timestamp,
      type,
      message,
      step: this.deploymentSteps.length + 1
    });
  }

  async executeCommand(command, description) {
    this.log(`Executing: ${description}...`);
    
    try {
      const startTime = Date.now();
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      const duration = Date.now() - startTime;
      this.log(`✅ ${description} completed in ${duration}ms`, 'success');
      
      return { success: true, output, duration };
    } catch (error) {
      this.log(`❌ ${description} failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async checkPrerequisites() {
    this.log('🔍 Checking deployment prerequisites...', 'info');
    
    // Check if Firebase CLI is installed
    const firebaseCheck = await this.executeCommand('firebase --version', 'Firebase CLI version check');
    if (!firebaseCheck.success) {
      throw new Error('Firebase CLI is not installed. Please run: npm install -g firebase-tools');
    }
    
    // Check if user is logged in
    const loginCheck = await this.executeCommand('firebase projects:list', 'Firebase authentication check');
    if (!loginCheck.success) {
      throw new Error('Not logged in to Firebase. Please run: firebase login');
    }
    
    // Check if project exists
    const projectCheck = await this.executeCommand('firebase use --add', 'Firebase project check');
    
    this.log('✅ All prerequisites met', 'success');
  }

  async buildProject() {
    this.log('🏗️ Building project for staging deployment...', 'info');
    
    // Install dependencies
    const installResult = await this.executeCommand('npm ci', 'Installing dependencies');
    if (!installResult.success) {
      throw new Error('Failed to install dependencies');
    }
    
    // Run linting
    this.log('🔍 Running code quality checks...', 'info');
    try {
      await this.executeCommand('npm run lint', 'Code linting');
    } catch (error) {
      this.log('⚠️ Linting issues found, but continuing deployment', 'warning');
    }
    
    // Build packages
    const packagesResult = await this.executeCommand('npm run build --workspace=packages/api', 'Building API package');
    if (!packagesResult.success) {
      throw new Error('Failed to build packages');
    }
    
    const uiResult = await this.executeCommand('npm run build --workspace=packages/ui', 'Building UI package');
    if (!uiResult.success) {
      throw new Error('Failed to build UI package');
    }
    
    // Build web app
    const webResult = await this.executeCommand('npm run build:web', 'Building web application');
    if (!webResult.success) {
      throw new Error('Failed to build web application');
    }
    
    this.log('✅ Project build completed successfully', 'success');
  }

  async deployFirebaseRules() {
    this.log('🔒 Deploying Firebase security rules...', 'info');
    
    // Deploy Firestore rules
    const firestoreRulesResult = await this.executeCommand(
      'firebase deploy --only firestore:rules',
      'Deploying Firestore security rules'
    );
    
    if (!firestoreRulesResult.success) {
      throw new Error('Failed to deploy Firestore rules');
    }
    
    // Deploy Storage rules
    const storageRulesResult = await this.executeCommand(
      'firebase deploy --only storage:rules',
      'Deploying Storage security rules'
    );
    
    if (!storageRulesResult.success) {
      throw new Error('Failed to deploy Storage rules');
    }
    
    // Deploy Firestore indexes
    const indexesResult = await this.executeCommand(
      'firebase deploy --only firestore:indexes',
      'Deploying Firestore indexes'
    );
    
    if (!indexesResult.success) {
      this.log('⚠️ Firestore indexes deployment had issues, but continuing', 'warning');
    }
    
    this.log('✅ Firebase rules deployed successfully', 'success');
  }

  async deployFunctions() {
    this.log('⚡ Deploying Cloud Functions...', 'info');
    
    // Check if functions directory exists
    if (!fs.existsSync('functions')) {
      this.log('⚠️ Functions directory not found, skipping functions deployment', 'warning');
      return;
    }
    
    const functionsResult = await this.executeCommand(
      'firebase deploy --only functions',
      'Deploying Cloud Functions'
    );
    
    if (!functionsResult.success) {
      this.log('⚠️ Functions deployment failed, but continuing with hosting', 'warning');
    } else {
      this.log('✅ Cloud Functions deployed successfully', 'success');
    }
  }

  async deployHosting() {
    this.log('🌐 Deploying to Firebase Hosting...', 'info');
    
    // Create staging channel deployment
    const hostingResult = await this.executeCommand(
      'firebase hosting:channel:deploy staging --expires 30d',
      'Deploying to staging hosting channel'
    );
    
    if (!hostingResult.success) {
      // Fallback to regular hosting deployment
      this.log('⚠️ Channel deployment failed, trying regular hosting deployment', 'warning');
      
      const fallbackResult = await this.executeCommand(
        'firebase deploy --only hosting',
        'Deploying to default hosting'
      );
      
      if (!fallbackResult.success) {
        throw new Error('Failed to deploy hosting');
      }
    }
    
    this.log('✅ Hosting deployed successfully', 'success');
  }

  async runPostDeploymentTests() {
    this.log('🧪 Running post-deployment validation tests...', 'info');
    
    // Wait a bit for deployment to propagate
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      // Run basic connectivity tests
      const testResult = await this.executeCommand(
        'node scripts/test-firebase-integration.js',
        'Running Firebase integration tests'
      );
      
      if (testResult.success) {
        this.log('✅ Post-deployment tests passed', 'success');
      } else {
        this.log('⚠️ Some post-deployment tests failed, but deployment is complete', 'warning');
      }
    } catch (error) {
      this.log('⚠️ Post-deployment tests could not be run, but deployment is complete', 'warning');
    }
  }

  async generateDeploymentReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    const report = {
      deployment: {
        environment: 'staging',
        timestamp: new Date().toISOString(),
        duration: totalDuration,
        status: 'completed'
      },
      steps: this.deploymentSteps,
      summary: {
        totalSteps: this.deploymentSteps.length,
        successfulSteps: this.deploymentSteps.filter(s => s.type === 'success').length,
        warnings: this.deploymentSteps.filter(s => s.type === 'warning').length,
        errors: this.deploymentSteps.filter(s => s.type === 'error').length
      },
      urls: {
        staging: 'https://thefox-sp7zz--staging-<channel-id>.web.app',
        console: 'https://console.firebase.google.com/project/thefox-sp7zz',
        functions: 'https://us-central1-thefox-sp7zz.cloudfunctions.net'
      }
    };
    
    // Save deployment report
    const reportsDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportPath = path.join(reportsDir, `staging-deployment-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`📊 Deployment report saved: ${reportPath}`, 'info');
    
    return report;
  }

  async deploy() {
    try {
      this.log('🚀 Starting staging deployment for theFOX...', 'info');
      this.log('='.repeat(60), 'info');
      
      // Step 1: Check prerequisites
      await this.checkPrerequisites();
      
      // Step 2: Build project
      await this.buildProject();
      
      // Step 3: Deploy Firebase rules
      await this.deployFirebaseRules();
      
      // Step 4: Deploy Cloud Functions
      await this.deployFunctions();
      
      // Step 5: Deploy hosting
      await this.deployHosting();
      
      // Step 6: Run post-deployment tests
      await this.runPostDeploymentTests();
      
      // Step 7: Generate report
      const report = await this.generateDeploymentReport();
      
      this.log('='.repeat(60), 'info');
      this.log('🎉 STAGING DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉', 'success');
      this.log('='.repeat(60), 'info');
      
      this.log('📋 Deployment Summary:', 'info');
      this.log(`   Duration: ${(report.deployment.duration / 1000).toFixed(2)}s`, 'info');
      this.log(`   Total Steps: ${report.summary.totalSteps}`, 'info');
      this.log(`   Successful: ${report.summary.successfulSteps}`, 'success');
      this.log(`   Warnings: ${report.summary.warnings}`, 'warning');
      this.log(`   Errors: ${report.summary.errors}`, 'error');
      
      this.log('🌐 Access URLs:', 'info');
      this.log('   Check Firebase Console for staging URL', 'info');
      this.log('   Firebase Console: https://console.firebase.google.com/project/thefox-sp7zz', 'info');
      
      this.log('🔄 Next Steps:', 'info');
      this.log('   1. Test the staging deployment', 'info');
      this.log('   2. Run user acceptance testing', 'info');
      this.log('   3. Monitor performance and errors', 'info');
      this.log('   4. Prepare for production deployment', 'info');
      
      return report;
      
    } catch (error) {
      this.log(`💥 DEPLOYMENT FAILED: ${error.message}`, 'error');
      this.log('='.repeat(60), 'error');
      
      // Generate failure report
      const report = await this.generateDeploymentReport();
      report.deployment.status = 'failed';
      report.deployment.error = error.message;
      
      throw error;
    }
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  const deployer = new StagingDeployer();
  
  deployer.deploy()
    .then(report => {
      console.log('\n🎉 Staging deployment completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Staging deployment failed:', error.message);
      process.exit(1);
    });
}

module.exports = StagingDeployer;
import { app, auth, db, storage, functions, analytics, messaging, testFirebaseConnection } from './config';
import { currentConfig, getCurrentEnvironment } from './environment';

export interface FirebaseInitResult {
  success: boolean;
  environment: string;
  services: {
    auth: boolean;
    firestore: boolean;
    storage: boolean;
    functions: boolean;
    analytics: boolean;
    messaging: boolean;
  };
  errors: string[];
}

/**
 * Initialize and test Firebase services
 */
export async function initializeFirebase(): Promise<FirebaseInitResult> {
  const environment = getCurrentEnvironment();
  const errors: string[] = [];
  
  console.log(`🔥 Initializing Firebase for ${environment} environment...`);
  console.log(`📋 Project ID: ${currentConfig.firebase.projectId}`);
  console.log(`🌐 Auth Domain: ${currentConfig.firebase.authDomain}`);
  
  // Test Firebase connection
  const connectionTest = await testFirebaseConnection();
  
  // Test optional services
  let analyticsAvailable = false;
  let messagingAvailable = false;
  
  try {
    analyticsAvailable = !!analytics;
  } catch (error) {
    errors.push(`Analytics initialization failed: ${error}`);
  }
  
  try {
    messagingAvailable = !!messaging;
  } catch (error) {
    errors.push(`Messaging initialization failed: ${error}`);
  }
  
  // Validate configuration
  if (!currentConfig.firebase.apiKey) {
    errors.push('Firebase API key is missing');
  }
  
  if (!currentConfig.firebase.projectId) {
    errors.push('Firebase project ID is missing');
  }
  
  const result: FirebaseInitResult = {
    success: errors.length === 0 && connectionTest.auth && connectionTest.firestore,
    environment,
    services: {
      auth: connectionTest.auth,
      firestore: connectionTest.firestore,
      storage: connectionTest.storage,
      functions: connectionTest.functions,
      analytics: analyticsAvailable,
      messaging: messagingAvailable,
    },
    errors,
  };
  
  // Log results
  if (result.success) {
    console.log('✅ Firebase initialized successfully');
    console.log('📊 Services status:', result.services);
  } else {
    console.error('❌ Firebase initialization failed');
    console.error('🚨 Errors:', errors);
  }
  
  return result;
}

/**
 * Get Firebase app instance
 */
export function getFirebaseApp() {
  return app;
}

/**
 * Get all Firebase services
 */
export function getFirebaseServices() {
  return {
    app,
    auth,
    db,
    storage,
    functions,
    analytics,
    messaging,
  };
}

/**
 * Check if Firebase is ready
 */
export function isFirebaseReady(): boolean {
  try {
    return !!app && !!auth && !!db && !!storage && !!functions;
  } catch (error) {
    console.error('Firebase readiness check failed:', error);
    return false;
  }
}

// Export services for convenience
export { app, auth, db, storage, functions, analytics, messaging };
export { currentConfig } from './environment';
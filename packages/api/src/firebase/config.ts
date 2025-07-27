import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getMessaging, Messaging } from 'firebase/messaging';
import { currentConfig, getCurrentEnvironment } from './environment';

// Get Firebase configuration from environment
const firebaseConfig = currentConfig.firebase;

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app);

// Initialize optional services (only in browser environment)
let analytics: Analytics | null = null;
let messaging: Messaging | null = null;

if (typeof window !== 'undefined') {
  try {
    if (firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    }
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Failed to initialize optional Firebase services:', error);
  }
}

// Connect to emulators in development
const environment = getCurrentEnvironment();
if (environment === 'development') {
  try {
    // Connect to Firestore emulator
    if (!db._delegate._databaseId.projectId.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
    
    // Connect to Functions emulator
    if (!functions._delegate._url?.includes('localhost')) {
      connectFunctionsEmulator(functions, 'localhost', 5001);
    }
    
    // Connect to Storage emulator
    if (!storage._delegate._host.includes('localhost')) {
      connectStorageEmulator(storage, 'localhost', 9199);
    }
  } catch (error) {
    console.warn('Emulator connection failed (may already be connected):', error);
  }
}

// Connection test function
export async function testFirebaseConnection(): Promise<{
  auth: boolean;
  firestore: boolean;
  storage: boolean;
  functions: boolean;
}> {
  const results = {
    auth: false,
    firestore: false,
    storage: false,
    functions: false,
  };

  try {
    // Test Auth
    results.auth = !!auth.app;
    
    // Test Firestore
    await db._delegate._databaseId;
    results.firestore = true;
    
    // Test Storage
    results.storage = !!storage.app;
    
    // Test Functions
    results.functions = !!functions.app;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
  }

  return results;
}

// Export real-time sync services
export { realtimeDataSyncService, initializeRealtimeSync } from './realtime-sync';
export { orderTrackingService } from './order-tracking';
export { connectionManager } from './connection-manager';
export { realtimeSyncService } from './realtime';

// Export monitoring and error handling services
export { firebaseErrorHandler } from './error-handler';
export { firebaseMonitoringService } from './monitoring';
export { firebaseLogger } from './logger';
export { integratedFirebaseMonitoring } from './integrated-monitoring';

// Export analytics and reporting services
export { firebaseAnalyticsService } from './analytics-service';
export { automatedReportingService } from './reporting-service';
export { dataExportService } from './data-export-service';

export { app, analytics, messaging };
export default app;
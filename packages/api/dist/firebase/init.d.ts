import { app, auth, db, storage, functions, analytics, messaging } from './config';
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
export declare function initializeFirebase(): Promise<FirebaseInitResult>;
/**
 * Get Firebase app instance
 */
export declare function getFirebaseApp(): import("@firebase/app").FirebaseApp;
/**
 * Get all Firebase services
 */
export declare function getFirebaseServices(): {
    app: import("@firebase/app").FirebaseApp;
    auth: import("@firebase/auth").Auth;
    db: import("@firebase/firestore").Firestore;
    storage: import("@firebase/storage").FirebaseStorage;
    functions: import("@firebase/functions").Functions;
    analytics: import("@firebase/analytics").Analytics;
    messaging: import("@firebase/messaging").Messaging;
};
/**
 * Check if Firebase is ready
 */
export declare function isFirebaseReady(): boolean;
export { app, auth, db, storage, functions, analytics, messaging };
export { currentConfig } from './environment';

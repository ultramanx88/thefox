"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messaging = exports.analytics = exports.app = exports.dataExportService = exports.automatedReportingService = exports.firebaseAnalyticsService = exports.integratedFirebaseMonitoring = exports.firebaseLogger = exports.firebaseMonitoringService = exports.firebaseErrorHandler = exports.realtimeSyncService = exports.connectionManager = exports.orderTrackingService = exports.initializeRealtimeSync = exports.realtimeDataSyncService = exports.functions = exports.storage = exports.db = exports.auth = void 0;
exports.testFirebaseConnection = testFirebaseConnection;
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const storage_1 = require("firebase/storage");
const functions_1 = require("firebase/functions");
const analytics_1 = require("firebase/analytics");
const messaging_1 = require("firebase/messaging");
const environment_1 = require("./environment");
// Get Firebase configuration from environment
const firebaseConfig = environment_1.currentConfig.firebase;
// Initialize Firebase
let app;
if ((0, app_1.getApps)().length === 0) {
    exports.app = app = (0, app_1.initializeApp)(firebaseConfig);
}
else {
    exports.app = app = (0, app_1.getApps)()[0];
}
// Initialize Firebase services
exports.auth = (0, auth_1.getAuth)(app);
exports.db = (0, firestore_1.getFirestore)(app);
exports.storage = (0, storage_1.getStorage)(app);
exports.functions = (0, functions_1.getFunctions)(app);
// Initialize optional services (only in browser environment)
let analytics = null;
exports.analytics = analytics;
let messaging = null;
exports.messaging = messaging;
if (typeof window !== 'undefined') {
    try {
        if (firebaseConfig.measurementId) {
            exports.analytics = analytics = (0, analytics_1.getAnalytics)(app);
        }
        exports.messaging = messaging = (0, messaging_1.getMessaging)(app);
    }
    catch (error) {
        console.warn('Failed to initialize optional Firebase services:', error);
    }
}
// Connect to emulators in development
const environment = (0, environment_1.getCurrentEnvironment)();
if (environment === 'development') {
    try {
        // Connect to Firestore emulator
        if (!exports.db._delegate._databaseId.projectId.includes('localhost')) {
            (0, firestore_1.connectFirestoreEmulator)(exports.db, 'localhost', 8080);
        }
        // Connect to Functions emulator
        if (!exports.functions._delegate._url?.includes('localhost')) {
            (0, functions_1.connectFunctionsEmulator)(exports.functions, 'localhost', 5001);
        }
        // Connect to Storage emulator
        if (!exports.storage._delegate._host.includes('localhost')) {
            (0, storage_1.connectStorageEmulator)(exports.storage, 'localhost', 9199);
        }
    }
    catch (error) {
        console.warn('Emulator connection failed (may already be connected):', error);
    }
}
// Connection test function
async function testFirebaseConnection() {
    const results = {
        auth: false,
        firestore: false,
        storage: false,
        functions: false,
    };
    try {
        // Test Auth
        results.auth = !!exports.auth.app;
        // Test Firestore
        await exports.db._delegate._databaseId;
        results.firestore = true;
        // Test Storage
        results.storage = !!exports.storage.app;
        // Test Functions
        results.functions = !!exports.functions.app;
    }
    catch (error) {
        console.error('Firebase connection test failed:', error);
    }
    return results;
}
// Export real-time sync services
var realtime_sync_1 = require("./realtime-sync");
Object.defineProperty(exports, "realtimeDataSyncService", { enumerable: true, get: function () { return realtime_sync_1.realtimeDataSyncService; } });
Object.defineProperty(exports, "initializeRealtimeSync", { enumerable: true, get: function () { return realtime_sync_1.initializeRealtimeSync; } });
var order_tracking_1 = require("./order-tracking");
Object.defineProperty(exports, "orderTrackingService", { enumerable: true, get: function () { return order_tracking_1.orderTrackingService; } });
var connection_manager_1 = require("./connection-manager");
Object.defineProperty(exports, "connectionManager", { enumerable: true, get: function () { return connection_manager_1.connectionManager; } });
var realtime_1 = require("./realtime");
Object.defineProperty(exports, "realtimeSyncService", { enumerable: true, get: function () { return realtime_1.realtimeSyncService; } });
// Export monitoring and error handling services
var error_handler_1 = require("./error-handler");
Object.defineProperty(exports, "firebaseErrorHandler", { enumerable: true, get: function () { return error_handler_1.firebaseErrorHandler; } });
var monitoring_1 = require("./monitoring");
Object.defineProperty(exports, "firebaseMonitoringService", { enumerable: true, get: function () { return monitoring_1.firebaseMonitoringService; } });
var logger_1 = require("./logger");
Object.defineProperty(exports, "firebaseLogger", { enumerable: true, get: function () { return logger_1.firebaseLogger; } });
var integrated_monitoring_1 = require("./integrated-monitoring");
Object.defineProperty(exports, "integratedFirebaseMonitoring", { enumerable: true, get: function () { return integrated_monitoring_1.integratedFirebaseMonitoring; } });
// Export analytics and reporting services
var analytics_service_1 = require("./analytics-service");
Object.defineProperty(exports, "firebaseAnalyticsService", { enumerable: true, get: function () { return analytics_service_1.firebaseAnalyticsService; } });
var reporting_service_1 = require("./reporting-service");
Object.defineProperty(exports, "automatedReportingService", { enumerable: true, get: function () { return reporting_service_1.automatedReportingService; } });
var data_export_service_1 = require("./data-export-service");
Object.defineProperty(exports, "dataExportService", { enumerable: true, get: function () { return data_export_service_1.dataExportService; } });
exports.default = app;

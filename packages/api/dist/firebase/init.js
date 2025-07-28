"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentConfig = exports.messaging = exports.analytics = exports.functions = exports.storage = exports.db = exports.auth = exports.app = void 0;
exports.initializeFirebase = initializeFirebase;
exports.getFirebaseApp = getFirebaseApp;
exports.getFirebaseServices = getFirebaseServices;
exports.isFirebaseReady = isFirebaseReady;
const config_1 = require("./config");
Object.defineProperty(exports, "app", { enumerable: true, get: function () { return config_1.app; } });
Object.defineProperty(exports, "auth", { enumerable: true, get: function () { return config_1.auth; } });
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return config_1.db; } });
Object.defineProperty(exports, "storage", { enumerable: true, get: function () { return config_1.storage; } });
Object.defineProperty(exports, "functions", { enumerable: true, get: function () { return config_1.functions; } });
Object.defineProperty(exports, "analytics", { enumerable: true, get: function () { return config_1.analytics; } });
Object.defineProperty(exports, "messaging", { enumerable: true, get: function () { return config_1.messaging; } });
const environment_1 = require("./environment");
/**
 * Initialize and test Firebase services
 */
async function initializeFirebase() {
    const environment = (0, environment_1.getCurrentEnvironment)();
    const errors = [];
    console.log(`🔥 Initializing Firebase for ${environment} environment...`);
    console.log(`📋 Project ID: ${environment_1.currentConfig.firebase.projectId}`);
    console.log(`🌐 Auth Domain: ${environment_1.currentConfig.firebase.authDomain}`);
    // Test Firebase connection
    const connectionTest = await (0, config_1.testFirebaseConnection)();
    // Test optional services
    let analyticsAvailable = false;
    let messagingAvailable = false;
    try {
        analyticsAvailable = !!config_1.analytics;
    }
    catch (error) {
        errors.push(`Analytics initialization failed: ${error}`);
    }
    try {
        messagingAvailable = !!config_1.messaging;
    }
    catch (error) {
        errors.push(`Messaging initialization failed: ${error}`);
    }
    // Validate configuration
    if (!environment_1.currentConfig.firebase.apiKey) {
        errors.push('Firebase API key is missing');
    }
    if (!environment_1.currentConfig.firebase.projectId) {
        errors.push('Firebase project ID is missing');
    }
    const result = {
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
    }
    else {
        console.error('❌ Firebase initialization failed');
        console.error('🚨 Errors:', errors);
    }
    return result;
}
/**
 * Get Firebase app instance
 */
function getFirebaseApp() {
    return config_1.app;
}
/**
 * Get all Firebase services
 */
function getFirebaseServices() {
    return {
        app: config_1.app,
        auth: config_1.auth,
        db: config_1.db,
        storage: config_1.storage,
        functions: config_1.functions,
        analytics: config_1.analytics,
        messaging: config_1.messaging,
    };
}
/**
 * Check if Firebase is ready
 */
function isFirebaseReady() {
    try {
        return !!config_1.app && !!config_1.auth && !!config_1.db && !!config_1.storage && !!config_1.functions;
    }
    catch (error) {
        console.error('Firebase readiness check failed:', error);
        return false;
    }
}
var environment_2 = require("./environment");
Object.defineProperty(exports, "currentConfig", { enumerable: true, get: function () { return environment_2.currentConfig; } });

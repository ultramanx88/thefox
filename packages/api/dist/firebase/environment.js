"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentConfig = void 0;
exports.getCurrentEnvironment = getCurrentEnvironment;
exports.getEnvironmentConfig = getEnvironmentConfig;
// Environment configurations
const environments = {
    development: {
        firebase: {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'thefox-sp7zz.firebaseapp.com',
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'thefox-sp7zz',
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'thefox-sp7zz.appspot.com',
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
            measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
        },
        functionsUrl: process.env.FIREBASE_FUNCTIONS_URL || 'http://localhost:5001/thefox-sp7zz/us-central1',
        apiUrl: process.env.NEXT_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002',
        environment: 'development',
    },
    staging: {
        firebase: {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_STAGING || process.env.EXPO_PUBLIC_FIREBASE_API_KEY_STAGING || '',
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_STAGING || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_STAGING || 'thefox-staging.firebaseapp.com',
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_STAGING || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID_STAGING || 'thefox-staging',
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_STAGING || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET_STAGING || 'thefox-staging.appspot.com',
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_STAGING || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_STAGING || '',
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID_STAGING || process.env.EXPO_PUBLIC_FIREBASE_APP_ID_STAGING || '',
            measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID_STAGING || process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID_STAGING,
        },
        functionsUrl: process.env.FIREBASE_FUNCTIONS_URL_STAGING || 'https://us-central1-thefox-staging.cloudfunctions.net',
        apiUrl: process.env.NEXT_PUBLIC_API_URL_STAGING || process.env.EXPO_PUBLIC_API_URL_STAGING || 'https://thefox-staging.web.app/api',
        appUrl: process.env.NEXT_PUBLIC_APP_URL_STAGING || 'https://thefox-staging.web.app',
        environment: 'staging',
    },
    production: {
        firebase: {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_PROD || process.env.EXPO_PUBLIC_FIREBASE_API_KEY_PROD || '',
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_PROD || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_PROD || 'thefox-sp7zz.firebaseapp.com',
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PROD || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID_PROD || 'thefox-sp7zz',
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_PROD || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET_PROD || 'thefox-sp7zz.appspot.com',
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_PROD || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_PROD || '',
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID_PROD || process.env.EXPO_PUBLIC_FIREBASE_APP_ID_PROD || '',
            measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID_PROD || process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID_PROD,
        },
        functionsUrl: process.env.FIREBASE_FUNCTIONS_URL_PROD || 'https://us-central1-thefox-sp7zz.cloudfunctions.net',
        apiUrl: process.env.NEXT_PUBLIC_API_URL_PROD || process.env.EXPO_PUBLIC_API_URL_PROD || 'https://thefox-sp7zz.web.app/api',
        appUrl: process.env.NEXT_PUBLIC_APP_URL_PROD || 'https://thefox-sp7zz.web.app',
        environment: 'production',
    },
};
// Get current environment
function getCurrentEnvironment() {
    return process.env.NODE_ENV || process.env.EXPO_PUBLIC_NODE_ENV || 'development';
}
// Get environment configuration
function getEnvironmentConfig() {
    const env = getCurrentEnvironment();
    const config = environments[env] || environments.development;
    // Validate required configuration
    if (!config.firebase.apiKey || !config.firebase.projectId) {
        console.warn(`Missing Firebase configuration for environment: ${env}`);
    }
    return config;
}
// Export current config
exports.currentConfig = getEnvironmentConfig();

export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
}
export interface EnvironmentConfig {
    firebase: FirebaseConfig;
    functionsUrl: string;
    apiUrl: string;
    appUrl: string;
    environment: 'development' | 'staging' | 'production';
}
export declare function getCurrentEnvironment(): string;
export declare function getEnvironmentConfig(): EnvironmentConfig;
export declare const currentConfig: EnvironmentConfig;

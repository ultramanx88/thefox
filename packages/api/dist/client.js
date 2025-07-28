"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = exports.ApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
class ApiClient {
    constructor(baseURL = 'https://api.thefox.com') {
        this.client = axios_1.default.create({
            baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use(async (config) => {
            // Add auth token if available
            const token = await this.getAuthToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response?.status === 401) {
                // Handle unauthorized access
                this.handleUnauthorized();
            }
            return Promise.reject(error);
        });
    }
    async getAuthToken() {
        try {
            // Import Firebase auth service dynamically to avoid circular dependencies
            const { FirebaseAuthService } = await Promise.resolve().then(() => __importStar(require('./firebase/auth')));
            return await FirebaseAuthService.getUserToken();
        }
        catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }
    // Set auth token (for Firebase integration)
    setAuthToken(token) {
        if (typeof window !== 'undefined') {
            // Web
            if (token) {
                localStorage.setItem('auth_token', token);
            }
            else {
                localStorage.removeItem('auth_token');
            }
        }
        // For React Native, implement with SecureStore
    }
    async handleUnauthorized() {
        try {
            // Import Firebase auth service dynamically
            const { FirebaseAuthService } = await Promise.resolve().then(() => __importStar(require('./firebase/auth')));
            await FirebaseAuthService.signOut();
            console.log('User signed out due to unauthorized access');
        }
        catch (error) {
            console.error('Error during unauthorized handling:', error);
        }
    }
    // Generic request method
    async request(config) {
        const response = await this.client.request(config);
        return response.data;
    }
    // HTTP methods
    async get(url, config) {
        return this.request({ ...config, method: 'GET', url });
    }
    async post(url, data, config) {
        return this.request({ ...config, method: 'POST', url, data });
    }
    async put(url, data, config) {
        return this.request({ ...config, method: 'PUT', url, data });
    }
    async delete(url, config) {
        return this.request({ ...config, method: 'DELETE', url });
    }
}
exports.ApiClient = ApiClient;
// Default instance
exports.apiClient = new ApiClient();

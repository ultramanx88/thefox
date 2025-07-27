import axios from 'axios';
export class ApiClient {
    constructor(baseURL = 'https://api.thefox.com') {
        this.client = axios.create({
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
            const { FirebaseAuthService } = await import('./firebase/auth');
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
            const { FirebaseAuthService } = await import('./firebase/auth');
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
// Default instance
export const apiClient = new ApiClient();

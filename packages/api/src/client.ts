import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL?: string) {
    const resolvedBaseURL = baseURL
      || (typeof process !== 'undefined' && (process as any).env?.NEXT_PUBLIC_API_BASE_URL)
      || (typeof window !== 'undefined' && (window as any).__API_BASE_URL__)
      || 'http://localhost:3000';
    this.client = axios.create({
      baseURL: resolvedBaseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Add auth token if available
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      if (typeof window !== 'undefined') {
        const token = window.localStorage?.getItem('auth_token');
        if (token) return token;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Set auth token (for Firebase integration)
  setAuthToken(token: string | null): void {
    if (typeof window !== 'undefined') {
      // Web
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
    // For React Native, implement with SecureStore
  }

  private async handleUnauthorized() {
    // Try refresh token flow once
    if (typeof window === 'undefined') return;
    const refreshToken = window.localStorage?.getItem('refresh_token');
    if (!refreshToken) return;
    try {
      const res = await fetch(`${(this.client.defaults.baseURL || '').replace(/\/$/, '')}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.accessToken) window.localStorage.setItem('auth_token', data.accessToken);
      if (data?.refreshToken) window.localStorage.setItem('refresh_token', data.refreshToken);
    } catch {
      // ignore
    }
  }

  // Generic request method
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  // HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}

// Default instance
export const apiClient = new ApiClient();
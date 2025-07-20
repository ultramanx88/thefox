import { apiClient } from './client';
import type {
  Market,
  Product,
  Order,
  User,
  ApiResponse,
  PaginatedResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from './types';

// Auth endpoints
export const authApi = {
  login: (data: LoginRequest): Promise<ApiResponse<LoginResponse>> =>
    apiClient.post('/auth/login', data),

  register: (data: RegisterRequest): Promise<ApiResponse<User>> =>
    apiClient.post('/auth/register', data),

  logout: (): Promise<ApiResponse<null>> =>
    apiClient.post('/auth/logout'),

  refreshToken: (refreshToken: string): Promise<ApiResponse<{ token: string }>> =>
    apiClient.post('/auth/refresh', { refreshToken }),

  getProfile: (): Promise<ApiResponse<User>> =>
    apiClient.get('/auth/profile'),
};

// Markets endpoints
export const marketsApi = {
  getMarkets: (params?: {
    lat?: number;
    lng?: number;
    radius?: number;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Market>> =>
    apiClient.get('/markets', { params }),

  getMarket: (id: string): Promise<ApiResponse<Market>> =>
    apiClient.get(`/markets/${id}`),

  searchMarkets: (query: string): Promise<ApiResponse<Market[]>> =>
    apiClient.get('/markets/search', { params: { q: query } }),
};

// Products endpoints
export const productsApi = {
  getProducts: (marketId: string, params?: {
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Product>> =>
    apiClient.get(`/markets/${marketId}/products`, { params }),

  getProduct: (id: string): Promise<ApiResponse<Product>> =>
    apiClient.get(`/products/${id}`),

  searchProducts: (query: string, marketId?: string): Promise<ApiResponse<Product[]>> =>
    apiClient.get('/products/search', { params: { q: query, marketId } }),
};

// Orders endpoints
export const ordersApi = {
  getOrders: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Order>> =>
    apiClient.get('/orders', { params }),

  getOrder: (id: string): Promise<ApiResponse<Order>> =>
    apiClient.get(`/orders/${id}`),

  createOrder: (data: {
    marketId: string;
    items: Array<{ productId: string; quantity: number }>;
    deliveryAddressId: string;
  }): Promise<ApiResponse<Order>> =>
    apiClient.post('/orders', data),

  updateOrderStatus: (id: string, status: string): Promise<ApiResponse<Order>> =>
    apiClient.put(`/orders/${id}/status`, { status }),

  cancelOrder: (id: string): Promise<ApiResponse<Order>> =>
    apiClient.put(`/orders/${id}/cancel`),
};

// User endpoints
export const userApi = {
  updateProfile: (data: Partial<User>): Promise<ApiResponse<User>> =>
    apiClient.put('/user/profile', data),

  getAddresses: (): Promise<ApiResponse<User['addresses']>> =>
    apiClient.get('/user/addresses'),

  addAddress: (address: Omit<User['addresses'][0], 'id'>): Promise<ApiResponse<User['addresses'][0]>> =>
    apiClient.post('/user/addresses', address),

  updateAddress: (id: string, address: Partial<User['addresses'][0]>): Promise<ApiResponse<User['addresses'][0]>> =>
    apiClient.put(`/user/addresses/${id}`, address),

  deleteAddress: (id: string): Promise<ApiResponse<null>> =>
    apiClient.delete(`/user/addresses/${id}`),
};
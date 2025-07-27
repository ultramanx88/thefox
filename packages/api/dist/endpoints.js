import { apiClient } from './client';
// Auth endpoints
export const authApi = {
    login: (data) => apiClient.post('/auth/login', data),
    register: (data) => apiClient.post('/auth/register', data),
    logout: () => apiClient.post('/auth/logout'),
    refreshToken: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
    getProfile: () => apiClient.get('/auth/profile'),
};
// Markets endpoints
export const marketsApi = {
    getMarkets: (params) => apiClient.get('/markets', { params }),
    getMarket: (id) => apiClient.get(`/markets/${id}`),
    searchMarkets: (query) => apiClient.get('/markets/search', { params: { q: query } }),
};
// Products endpoints
export const productsApi = {
    getProducts: (marketId, params) => apiClient.get(`/markets/${marketId}/products`, { params }),
    getProduct: (id) => apiClient.get(`/products/${id}`),
    searchProducts: (query, marketId) => apiClient.get('/products/search', { params: { q: query, marketId } }),
};
// Orders endpoints
export const ordersApi = {
    getOrders: (params) => apiClient.get('/orders', { params }),
    getOrder: (id) => apiClient.get(`/orders/${id}`),
    createOrder: (data) => apiClient.post('/orders', data),
    updateOrderStatus: (id, status) => apiClient.put(`/orders/${id}/status`, { status }),
    cancelOrder: (id) => apiClient.put(`/orders/${id}/cancel`),
};
// User endpoints
export const userApi = {
    updateProfile: (data) => apiClient.put('/user/profile', data),
    getAddresses: () => apiClient.get('/user/addresses'),
    addAddress: (address) => apiClient.post('/user/addresses', address),
    updateAddress: (id, address) => apiClient.put(`/user/addresses/${id}`, address),
    deleteAddress: (id) => apiClient.delete(`/user/addresses/${id}`),
};

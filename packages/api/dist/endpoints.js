"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userApi = exports.ordersApi = exports.productsApi = exports.marketsApi = exports.authApi = void 0;
const client_1 = require("./client");
// Auth endpoints
exports.authApi = {
    login: (data) => client_1.apiClient.post('/auth/login', data),
    register: (data) => client_1.apiClient.post('/auth/register', data),
    logout: () => client_1.apiClient.post('/auth/logout'),
    refreshToken: (refreshToken) => client_1.apiClient.post('/auth/refresh', { refreshToken }),
    getProfile: () => client_1.apiClient.get('/auth/profile'),
};
// Markets endpoints
exports.marketsApi = {
    getMarkets: (params) => client_1.apiClient.get('/markets', { params }),
    getMarket: (id) => client_1.apiClient.get(`/markets/${id}`),
    searchMarkets: (query) => client_1.apiClient.get('/markets/search', { params: { q: query } }),
};
// Products endpoints
exports.productsApi = {
    getProducts: (marketId, params) => client_1.apiClient.get(`/markets/${marketId}/products`, { params }),
    getProduct: (id) => client_1.apiClient.get(`/products/${id}`),
    searchProducts: (query, marketId) => client_1.apiClient.get('/products/search', { params: { q: query, marketId } }),
};
// Orders endpoints
exports.ordersApi = {
    getOrders: (params) => client_1.apiClient.get('/orders', { params }),
    getOrder: (id) => client_1.apiClient.get(`/orders/${id}`),
    createOrder: (data) => client_1.apiClient.post('/orders', data),
    updateOrderStatus: (id, status) => client_1.apiClient.put(`/orders/${id}/status`, { status }),
    cancelOrder: (id) => client_1.apiClient.put(`/orders/${id}/cancel`),
};
// User endpoints
exports.userApi = {
    updateProfile: (data) => client_1.apiClient.put('/user/profile', data),
    getAddresses: () => client_1.apiClient.get('/user/addresses'),
    addAddress: (address) => client_1.apiClient.post('/user/addresses', address),
    updateAddress: (id, address) => client_1.apiClient.put(`/user/addresses/${id}`, address),
    deleteAddress: (id) => client_1.apiClient.delete(`/user/addresses/${id}`),
};

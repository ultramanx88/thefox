import type { Market, Product, Order, User, ApiResponse, PaginatedResponse, LoginRequest, LoginResponse, RegisterRequest } from './types';
export declare const authApi: {
    login: (data: LoginRequest) => Promise<ApiResponse<LoginResponse>>;
    register: (data: RegisterRequest) => Promise<ApiResponse<User>>;
    logout: () => Promise<ApiResponse<null>>;
    refreshToken: (refreshToken: string) => Promise<ApiResponse<{
        token: string;
    }>>;
    getProfile: () => Promise<ApiResponse<User>>;
};
export declare const marketsApi: {
    getMarkets: (params?: {
        lat?: number;
        lng?: number;
        radius?: number;
        category?: string;
        page?: number;
        limit?: number;
    }) => Promise<PaginatedResponse<Market>>;
    getMarket: (id: string) => Promise<ApiResponse<Market>>;
    searchMarkets: (query: string) => Promise<ApiResponse<Market[]>>;
};
export declare const productsApi: {
    getProducts: (marketId: string, params?: {
        category?: string;
        page?: number;
        limit?: number;
    }) => Promise<PaginatedResponse<Product>>;
    getProduct: (id: string) => Promise<ApiResponse<Product>>;
    searchProducts: (query: string, marketId?: string) => Promise<ApiResponse<Product[]>>;
};
export declare const ordersApi: {
    getOrders: (params?: {
        status?: string;
        page?: number;
        limit?: number;
    }) => Promise<PaginatedResponse<Order>>;
    getOrder: (id: string) => Promise<ApiResponse<Order>>;
    createOrder: (data: {
        marketId: string;
        items: Array<{
            productId: string;
            quantity: number;
        }>;
        deliveryAddressId: string;
    }) => Promise<ApiResponse<Order>>;
    updateOrderStatus: (id: string, status: string) => Promise<ApiResponse<Order>>;
    cancelOrder: (id: string) => Promise<ApiResponse<Order>>;
};
export declare const userApi: {
    updateProfile: (data: Partial<User>) => Promise<ApiResponse<User>>;
    getAddresses: () => Promise<ApiResponse<User["addresses"]>>;
    addAddress: (address: Omit<User["addresses"][0], "id">) => Promise<ApiResponse<User["addresses"][0]>>;
    updateAddress: (id: string, address: Partial<User["addresses"][0]>) => Promise<ApiResponse<User["addresses"][0]>>;
    deleteAddress: (id: string) => Promise<ApiResponse<null>>;
};

import { Timestamp, QueryConstraint, Unsubscribe } from 'firebase/firestore';
export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: 'customer' | 'vendor' | 'driver' | 'admin';
    addresses?: Address[];
    preferences?: UserPreferences;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface Address {
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
}
export interface UserPreferences {
    language: string;
    currency: string;
    notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };
}
export interface Market {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    address: string;
    location: {
        latitude: number;
        longitude: number;
    };
    categories: string[];
    isOpen: boolean;
    operatingHours: OperatingHours;
    rating: number;
    imageUrl?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface OperatingHours {
    [key: string]: {
        open: string;
        close: string;
        isOpen: boolean;
    };
}
export interface Product {
    id: string;
    marketId: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrls: string[];
    inStock: boolean;
    quantity?: number;
    unit: string;
    rating: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface Order {
    id: string;
    userId: string;
    marketId: string;
    items: OrderItem[];
    status: OrderStatus;
    totalAmount: number;
    deliveryFee: number;
    deliveryAddress: Address;
    paymentMethod: string;
    paymentStatus: PaymentStatus;
    estimatedDeliveryTime?: Timestamp;
    driverId?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
}
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export interface Category {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    isActive: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface ServiceArea {
    id: string;
    name: string;
    boundaries: {
        latitude: number;
        longitude: number;
    }[];
    isActive: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'order' | 'delivery' | 'system' | 'promotion';
    isRead: boolean;
    data?: any;
    createdAt: Timestamp;
}
export interface Review {
    id: string;
    userId: string;
    marketId: string;
    orderId: string;
    rating: number;
    comment: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface Delivery {
    id: string;
    orderId: string;
    userId: string;
    driverId: string;
    marketId: string;
    status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
    pickupTime?: Timestamp;
    deliveryTime?: Timestamp;
    location?: {
        latitude: number;
        longitude: number;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export declare class FirestoreService {
    create<T>(collectionName: string, data: Omit<T, 'id'>): Promise<string>;
    createWithId<T>(collectionName: string, id: string, data: Omit<T, 'id'>): Promise<void>;
    get<T>(collectionName: string, id: string): Promise<T | null>;
    update<T>(collectionName: string, id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<void>;
    delete(collectionName: string, id: string): Promise<void>;
    list<T>(collectionName: string, constraints?: QueryConstraint[], limitCount?: number): Promise<T[]>;
    onDocumentChange<T>(collectionName: string, id: string, callback: (data: T | null) => void): Unsubscribe;
    onCollectionChange<T>(collectionName: string, constraints: QueryConstraint[] | undefined, callback: (data: T[]) => void): Unsubscribe;
    getUserByEmail(email: string): Promise<User | null>;
    getUsersByRole(role: string): Promise<User[]>;
    getOpenMarkets(): Promise<Market[]>;
    getMarketsByOwner(ownerId: string): Promise<Market[]>;
    getMarketsByCategory(category: string): Promise<Market[]>;
    getProductsByMarket(marketId: string): Promise<Product[]>;
    getProductsByCategory(category: string): Promise<Product[]>;
    getOrdersByUser(userId: string): Promise<Order[]>;
    getOrdersByMarket(marketId: string): Promise<Order[]>;
    getOrdersByDriver(driverId: string): Promise<Order[]>;
    getOrdersByStatus(status: OrderStatus): Promise<Order[]>;
    getNotificationsByUser(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
    getReviewsByMarket(marketId: string): Promise<Review[]>;
    getDeliveriesByDriver(driverId: string, status?: string): Promise<Delivery[]>;
    enableOfflineSupport(): Promise<void>;
    disableOfflineSupport(): Promise<void>;
    batchUpdate(operations: Array<{
        collection: string;
        id: string;
        data: any;
    }>): Promise<void>;
}
export declare const firestoreService: FirestoreService;
export declare const COLLECTIONS: {
    readonly USERS: "users";
    readonly MARKETS: "markets";
    readonly PRODUCTS: "products";
    readonly ORDERS: "orders";
    readonly CATEGORIES: "categories";
    readonly SERVICE_AREAS: "serviceAreas";
    readonly NOTIFICATIONS: "notifications";
    readonly REVIEWS: "reviews";
    readonly DELIVERIES: "deliveries";
    readonly ANALYTICS: "analytics";
    readonly SETTINGS: "settings";
};

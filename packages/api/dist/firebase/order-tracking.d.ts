/**
 * Real-time Order Tracking Service
 * Handles real-time order status updates and delivery tracking
 */
import { GeoPoint } from 'firebase/firestore';
export interface OrderStatusUpdate {
    orderId: string;
    status: OrderStatus;
    timestamp: Date;
    location?: {
        latitude: number;
        longitude: number;
    };
    driverId?: string;
    estimatedDeliveryTime?: Date;
    notes?: string;
}
export interface DeliveryLocation {
    orderId: string;
    driverId: string;
    latitude: number;
    longitude: number;
    timestamp: Date;
    speed?: number;
    heading?: number;
    accuracy?: number;
}
export interface OrderStatusHistory {
    status: OrderStatus;
    timestamp: Date;
    location?: GeoPoint;
    driverId?: string;
    notes?: string;
}
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
export declare class OrderTrackingService {
    private static instance;
    private orderSubscriptions;
    private deliverySubscriptions;
    static getInstance(): OrderTrackingService;
    /**
     * Subscribe to real-time order status updates
     */
    subscribeToOrderStatus(orderId: string, callback: (order: any) => void, errorCallback?: (error: Error) => void): string;
    /**
     * Update order status with real-time sync
     */
    updateOrderStatus(update: OrderStatusUpdate): Promise<void>;
    /**
     * Get order status history
     */
    private getOrderStatusHistory;
    /**
     * Subscribe to real-time delivery location updates
     */
    subscribeToDeliveryTracking(orderId: string, callback: (locations: DeliveryLocation[]) => void, errorCallback?: (error: Error) => void): string;
    /**
     * Update delivery location
     */
    updateDeliveryLocation(location: DeliveryLocation): Promise<void>;
    /**
     * Subscribe to multiple orders for a user
     */
    subscribeToUserOrders(userId: string, callback: (orders: any[]) => void, errorCallback?: (error: Error) => void): string;
    /**
     * Subscribe to market orders for vendors
     */
    subscribeToMarketOrders(marketId: string, status?: OrderStatus, callback: (orders: any[]) => void, errorCallback?: (error: Error) => void): string;
    /**
     * Subscribe to driver orders
     */
    subscribeToDriverOrders(driverId: string, status?: OrderStatus, callback: (orders: any[]) => void, errorCallback?: (error: Error) => void): string;
    /**
     * Unsubscribe from order status updates
     */
    unsubscribeFromOrderStatus(orderId: string): void;
    /**
     * Unsubscribe from delivery tracking
     */
    unsubscribeFromDeliveryTracking(orderId: string): void;
    /**
     * Unsubscribe from all order-related subscriptions
     */
    unsubscribeAll(): void;
    /**
     * Get active subscriptions count
     */
    getActiveSubscriptionsCount(): number;
    /**
     * Check if order is being tracked
     */
    isOrderBeingTracked(orderId: string): boolean;
    /**
     * Get estimated delivery time based on current location and destination
     */
    calculateEstimatedDeliveryTime(currentLocation: {
        latitude: number;
        longitude: number;
    }, destinationLocation: {
        latitude: number;
        longitude: number;
    }): Promise<Date>;
    /**
     * Calculate distance between two points (Haversine formula)
     */
    private calculateDistance;
    private toRadians;
}
export declare const orderTrackingService: OrderTrackingService;

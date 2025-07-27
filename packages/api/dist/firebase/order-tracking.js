/**
 * Real-time Order Tracking Service
 * Handles real-time order status updates and delivery tracking
 */
import { doc, collection, onSnapshot, updateDoc, serverTimestamp, query, where, orderBy, GeoPoint } from 'firebase/firestore';
import { db } from './config';
import { realtimeSyncService } from './realtime';
// ===========================================
// ORDER TRACKING SERVICE
// ===========================================
export class OrderTrackingService {
    constructor() {
        this.orderSubscriptions = new Map();
        this.deliverySubscriptions = new Map();
    }
    static getInstance() {
        if (!OrderTrackingService.instance) {
            OrderTrackingService.instance = new OrderTrackingService();
        }
        return OrderTrackingService.instance;
    }
    // ===========================================
    // ORDER STATUS TRACKING
    // ===========================================
    /**
     * Subscribe to real-time order status updates
     */
    subscribeToOrderStatus(orderId, callback, errorCallback) {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const unsubscribe = onSnapshot(orderRef, (snapshot) => {
                if (snapshot.exists()) {
                    const orderData = {
                        id: snapshot.id,
                        ...snapshot.data(),
                        updatedAt: snapshot.data().updatedAt?.toDate(),
                        createdAt: snapshot.data().createdAt?.toDate(),
                        estimatedDeliveryTime: snapshot.data().estimatedDeliveryTime?.toDate(),
                    };
                    callback(orderData);
                }
                else {
                    callback(null);
                }
            }, (error) => {
                console.error(`Order status subscription error for ${orderId}:`, error);
                errorCallback?.(error);
            });
            this.orderSubscriptions.set(orderId, unsubscribe);
            console.log(`Order status subscription created for: ${orderId}`);
            return orderId;
        }
        catch (error) {
            console.error(`Failed to subscribe to order status for ${orderId}:`, error);
            errorCallback?.(error);
            throw error;
        }
    }
    /**
     * Update order status with real-time sync
     */
    async updateOrderStatus(update) {
        try {
            const orderRef = doc(db, 'orders', update.orderId);
            // Prepare update data
            const updateData = {
                status: update.status,
                updatedAt: serverTimestamp(),
            };
            // Add optional fields
            if (update.driverId) {
                updateData.driverId = update.driverId;
            }
            if (update.estimatedDeliveryTime) {
                updateData.estimatedDeliveryTime = update.estimatedDeliveryTime;
            }
            if (update.location) {
                updateData.currentLocation = new GeoPoint(update.location.latitude, update.location.longitude);
            }
            // Add to status history
            const statusHistoryEntry = {
                status: update.status,
                timestamp: new Date(),
                notes: update.notes,
            };
            if (update.location) {
                statusHistoryEntry.location = new GeoPoint(update.location.latitude, update.location.longitude);
            }
            if (update.driverId) {
                statusHistoryEntry.driverId = update.driverId;
            }
            updateData.statusHistory = [...(await this.getOrderStatusHistory(update.orderId)), statusHistoryEntry];
            // Update order document
            await updateDoc(orderRef, updateData);
            // Queue offline action if network is unavailable
            if (!navigator.onLine) {
                realtimeSyncService.queueOfflineAction({
                    type: 'update',
                    collection: 'orders',
                    documentId: update.orderId,
                    data: updateData,
                    maxRetries: 3,
                });
            }
            console.log(`Order status updated: ${update.orderId} -> ${update.status}`);
        }
        catch (error) {
            console.error(`Failed to update order status for ${update.orderId}:`, error);
            throw error;
        }
    }
    /**
     * Get order status history
     */
    async getOrderStatusHistory(orderId) {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await orderRef.get();
            if (orderSnap.exists()) {
                return orderSnap.data().statusHistory || [];
            }
            return [];
        }
        catch (error) {
            console.error(`Failed to get order status history for ${orderId}:`, error);
            return [];
        }
    }
    // ===========================================
    // DELIVERY TRACKING
    // ===========================================
    /**
     * Subscribe to real-time delivery location updates
     */
    subscribeToDeliveryTracking(orderId, callback, errorCallback) {
        try {
            const deliveryRef = collection(db, 'deliveryTracking');
            const q = query(deliveryRef, where('orderId', '==', orderId), orderBy('timestamp', 'desc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const locations = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate(),
                }));
                callback(locations);
            }, (error) => {
                console.error(`Delivery tracking subscription error for ${orderId}:`, error);
                errorCallback?.(error);
            });
            this.deliverySubscriptions.set(orderId, unsubscribe);
            console.log(`Delivery tracking subscription created for: ${orderId}`);
            return orderId;
        }
        catch (error) {
            console.error(`Failed to subscribe to delivery tracking for ${orderId}:`, error);
            errorCallback?.(error);
            throw error;
        }
    }
    /**
     * Update delivery location
     */
    async updateDeliveryLocation(location) {
        try {
            const deliveryRef = collection(db, 'deliveryTracking');
            const locationData = {
                ...location,
                timestamp: serverTimestamp(),
                location: new GeoPoint(location.latitude, location.longitude),
            };
            // Add new location entry
            await deliveryRef.add(locationData);
            // Also update the order's current location
            const orderRef = doc(db, 'orders', location.orderId);
            await updateDoc(orderRef, {
                currentLocation: new GeoPoint(location.latitude, location.longitude),
                lastLocationUpdate: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            // Queue offline action if network is unavailable
            if (!navigator.onLine) {
                realtimeSyncService.queueOfflineAction({
                    type: 'create',
                    collection: 'deliveryTracking',
                    data: locationData,
                    maxRetries: 3,
                });
            }
            console.log(`Delivery location updated for order: ${location.orderId}`);
        }
        catch (error) {
            console.error(`Failed to update delivery location for ${location.orderId}:`, error);
            throw error;
        }
    }
    // ===========================================
    // BATCH OPERATIONS
    // ===========================================
    /**
     * Subscribe to multiple orders for a user
     */
    subscribeToUserOrders(userId, callback, errorCallback) {
        return realtimeSyncService.subscribeToCollection('orders', [
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        ], callback, errorCallback);
    }
    /**
     * Subscribe to market orders for vendors
     */
    subscribeToMarketOrders(marketId, status, callback, errorCallback) {
        const constraints = [
            where('marketId', '==', marketId),
            orderBy('createdAt', 'desc')
        ];
        if (status) {
            constraints.unshift(where('status', '==', status));
        }
        return realtimeSyncService.subscribeToCollection('orders', constraints, callback, errorCallback);
    }
    /**
     * Subscribe to driver orders
     */
    subscribeToDriverOrders(driverId, status, callback, errorCallback) {
        const constraints = [
            where('driverId', '==', driverId),
            orderBy('createdAt', 'desc')
        ];
        if (status) {
            constraints.unshift(where('status', '==', status));
        }
        return realtimeSyncService.subscribeToCollection('orders', constraints, callback, errorCallback);
    }
    // ===========================================
    // SUBSCRIPTION MANAGEMENT
    // ===========================================
    /**
     * Unsubscribe from order status updates
     */
    unsubscribeFromOrderStatus(orderId) {
        const unsubscribe = this.orderSubscriptions.get(orderId);
        if (unsubscribe) {
            unsubscribe();
            this.orderSubscriptions.delete(orderId);
            console.log(`Order status subscription removed for: ${orderId}`);
        }
    }
    /**
     * Unsubscribe from delivery tracking
     */
    unsubscribeFromDeliveryTracking(orderId) {
        const unsubscribe = this.deliverySubscriptions.get(orderId);
        if (unsubscribe) {
            unsubscribe();
            this.deliverySubscriptions.delete(orderId);
            console.log(`Delivery tracking subscription removed for: ${orderId}`);
        }
    }
    /**
     * Unsubscribe from all order-related subscriptions
     */
    unsubscribeAll() {
        // Unsubscribe from order status subscriptions
        this.orderSubscriptions.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.orderSubscriptions.clear();
        // Unsubscribe from delivery tracking subscriptions
        this.deliverySubscriptions.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.deliverySubscriptions.clear();
        // Also unsubscribe from realtime sync service
        realtimeSyncService.unsubscribeAll();
        console.log('All order tracking subscriptions removed');
    }
    // ===========================================
    // UTILITY METHODS
    // ===========================================
    /**
     * Get active subscriptions count
     */
    getActiveSubscriptionsCount() {
        return this.orderSubscriptions.size + this.deliverySubscriptions.size;
    }
    /**
     * Check if order is being tracked
     */
    isOrderBeingTracked(orderId) {
        return this.orderSubscriptions.has(orderId) || this.deliverySubscriptions.has(orderId);
    }
    /**
     * Get estimated delivery time based on current location and destination
     */
    async calculateEstimatedDeliveryTime(currentLocation, destinationLocation) {
        // Simple calculation - in production, you'd use a routing service
        const distance = this.calculateDistance(currentLocation, destinationLocation);
        const averageSpeed = 30; // km/h
        const estimatedMinutes = (distance / averageSpeed) * 60;
        const estimatedTime = new Date();
        estimatedTime.setMinutes(estimatedTime.getMinutes() + estimatedMinutes);
        return estimatedTime;
    }
    /**
     * Calculate distance between two points (Haversine formula)
     */
    calculateDistance(point1, point2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(point2.latitude - point1.latitude);
        const dLon = this.toRadians(point2.longitude - point1.longitude);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(point1.latitude)) *
                Math.cos(this.toRadians(point2.latitude)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    }
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
}
// Export singleton instance
export const orderTrackingService = OrderTrackingService.getInstance();

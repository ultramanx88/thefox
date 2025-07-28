"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLLECTIONS = exports.firestoreService = exports.FirestoreService = void 0;
const firestore_1 = require("firebase/firestore");
const config_1 = require("./config");
// ===========================================
// DATABASE SERVICE CLASS
// ===========================================
class FirestoreService {
    // ===========================================
    // GENERIC CRUD OPERATIONS
    // ===========================================
    async create(collectionName, data) {
        try {
            const docRef = await (0, firestore_1.addDoc)((0, firestore_1.collection)(config_1.db, collectionName), {
                ...data,
                createdAt: firestore_1.Timestamp.now(),
                updatedAt: firestore_1.Timestamp.now(),
            });
            return docRef.id;
        }
        catch (error) {
            console.error(`Error creating document in ${collectionName}:`, error);
            throw error;
        }
    }
    async createWithId(collectionName, id, data) {
        try {
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(config_1.db, collectionName, id), {
                ...data,
                createdAt: firestore_1.Timestamp.now(),
                updatedAt: firestore_1.Timestamp.now(),
            });
        }
        catch (error) {
            console.error(`Error creating document with ID in ${collectionName}:`, error);
            throw error;
        }
    }
    async get(collectionName, id) {
        try {
            const docRef = (0, firestore_1.doc)(config_1.db, collectionName, id);
            const docSnap = await (0, firestore_1.getDoc)(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        }
        catch (error) {
            console.error(`Error getting document from ${collectionName}:`, error);
            throw error;
        }
    }
    async update(collectionName, id, data) {
        try {
            const docRef = (0, firestore_1.doc)(config_1.db, collectionName, id);
            await (0, firestore_1.updateDoc)(docRef, {
                ...data,
                updatedAt: firestore_1.Timestamp.now(),
            });
        }
        catch (error) {
            console.error(`Error updating document in ${collectionName}:`, error);
            throw error;
        }
    }
    async delete(collectionName, id) {
        try {
            await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(config_1.db, collectionName, id));
        }
        catch (error) {
            console.error(`Error deleting document from ${collectionName}:`, error);
            throw error;
        }
    }
    async list(collectionName, constraints = [], limitCount = 50) {
        try {
            const q = (0, firestore_1.query)((0, firestore_1.collection)(config_1.db, collectionName), ...constraints, (0, firestore_1.limit)(limitCount));
            const querySnapshot = await (0, firestore_1.getDocs)(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error(`Error listing documents from ${collectionName}:`, error);
            throw error;
        }
    }
    // ===========================================
    // REAL-TIME LISTENERS
    // ===========================================
    onDocumentChange(collectionName, id, callback) {
        const docRef = (0, firestore_1.doc)(config_1.db, collectionName, id);
        return (0, firestore_1.onSnapshot)(docRef, (doc) => {
            if (doc.exists()) {
                callback({ id: doc.id, ...doc.data() });
            }
            else {
                callback(null);
            }
        });
    }
    onCollectionChange(collectionName, constraints = [], callback) {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(config_1.db, collectionName), ...constraints);
        return (0, firestore_1.onSnapshot)(q, (querySnapshot) => {
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(data);
        });
    }
    // ===========================================
    // SPECIALIZED QUERY METHODS
    // ===========================================
    // Users
    async getUserByEmail(email) {
        const users = await this.list('users', [(0, firestore_1.where)('email', '==', email)], 1);
        return users.length > 0 ? users[0] : null;
    }
    async getUsersByRole(role) {
        return this.list('users', [
            (0, firestore_1.where)('role', '==', role),
            (0, firestore_1.orderBy)('createdAt', 'desc')
        ]);
    }
    // Markets
    async getOpenMarkets() {
        return this.list('markets', [
            (0, firestore_1.where)('isOpen', '==', true),
            (0, firestore_1.orderBy)('rating', 'desc')
        ]);
    }
    async getMarketsByOwner(ownerId) {
        return this.list('markets', [
            (0, firestore_1.where)('ownerId', '==', ownerId),
            (0, firestore_1.orderBy)('createdAt', 'desc')
        ]);
    }
    async getMarketsByCategory(category) {
        return this.list('markets', [
            (0, firestore_1.where)('categories', 'array-contains', category),
            (0, firestore_1.where)('isOpen', '==', true),
            (0, firestore_1.orderBy)('rating', 'desc')
        ]);
    }
    // Products
    async getProductsByMarket(marketId) {
        return this.list('products', [
            (0, firestore_1.where)('marketId', '==', marketId),
            (0, firestore_1.where)('inStock', '==', true),
            (0, firestore_1.orderBy)('createdAt', 'desc')
        ]);
    }
    async getProductsByCategory(category) {
        return this.list('products', [
            (0, firestore_1.where)('category', '==', category),
            (0, firestore_1.where)('inStock', '==', true),
            (0, firestore_1.orderBy)('rating', 'desc')
        ]);
    }
    // Orders
    async getOrdersByUser(userId) {
        return this.list('orders', [
            (0, firestore_1.where)('userId', '==', userId),
            (0, firestore_1.orderBy)('createdAt', 'desc')
        ]);
    }
    async getOrdersByMarket(marketId) {
        return this.list('orders', [
            (0, firestore_1.where)('marketId', '==', marketId),
            (0, firestore_1.orderBy)('createdAt', 'desc')
        ]);
    }
    async getOrdersByDriver(driverId) {
        return this.list('orders', [
            (0, firestore_1.where)('driverId', '==', driverId),
            (0, firestore_1.orderBy)('createdAt', 'desc')
        ]);
    }
    async getOrdersByStatus(status) {
        return this.list('orders', [
            (0, firestore_1.where)('status', '==', status),
            (0, firestore_1.orderBy)('createdAt', 'desc')
        ]);
    }
    // Notifications
    async getNotificationsByUser(userId, unreadOnly = false) {
        const constraints = [(0, firestore_1.where)('userId', '==', userId)];
        if (unreadOnly) {
            constraints.push((0, firestore_1.where)('isRead', '==', false));
        }
        constraints.push((0, firestore_1.orderBy)('createdAt', 'desc'));
        return this.list('notifications', constraints);
    }
    // Reviews
    async getReviewsByMarket(marketId) {
        return this.list('reviews', [
            (0, firestore_1.where)('marketId', '==', marketId),
            (0, firestore_1.orderBy)('createdAt', 'desc')
        ]);
    }
    // Deliveries
    async getDeliveriesByDriver(driverId, status) {
        const constraints = [(0, firestore_1.where)('driverId', '==', driverId)];
        if (status) {
            constraints.push((0, firestore_1.where)('status', '==', status));
        }
        constraints.push((0, firestore_1.orderBy)('createdAt', 'desc'));
        return this.list('deliveries', constraints);
    }
    // ===========================================
    // OFFLINE SUPPORT
    // ===========================================
    async enableOfflineSupport() {
        try {
            await (0, firestore_1.enableNetwork)(config_1.db);
            console.log('Firestore offline support enabled');
        }
        catch (error) {
            console.error('Error enabling offline support:', error);
            throw error;
        }
    }
    async disableOfflineSupport() {
        try {
            await (0, firestore_1.disableNetwork)(config_1.db);
            console.log('Firestore offline support disabled');
        }
        catch (error) {
            console.error('Error disabling offline support:', error);
            throw error;
        }
    }
    // ===========================================
    // BATCH OPERATIONS
    // ===========================================
    async batchUpdate(operations) {
        try {
            // Note: For batch operations, we would use writeBatch from Firestore
            // This is a simplified version for demonstration
            const promises = operations.map(op => this.update(op.collection, op.id, op.data));
            await Promise.all(promises);
        }
        catch (error) {
            console.error('Error in batch update:', error);
            throw error;
        }
    }
}
exports.FirestoreService = FirestoreService;
// Export singleton instance
exports.firestoreService = new FirestoreService();
// Export collection names as constants
exports.COLLECTIONS = {
    USERS: 'users',
    MARKETS: 'markets',
    PRODUCTS: 'products',
    ORDERS: 'orders',
    CATEGORIES: 'categories',
    SERVICE_AREAS: 'serviceAreas',
    NOTIFICATIONS: 'notifications',
    REVIEWS: 'reviews',
    DELIVERIES: 'deliveries',
    ANALYTICS: 'analytics',
    SETTINGS: 'settings',
};

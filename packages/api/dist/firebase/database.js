import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, query, where, orderBy, limit, Timestamp, enableNetwork, disableNetwork, onSnapshot } from 'firebase/firestore';
import { db } from './config';
// ===========================================
// DATABASE SERVICE CLASS
// ===========================================
export class FirestoreService {
    // ===========================================
    // GENERIC CRUD OPERATIONS
    // ===========================================
    async create(collectionName, data) {
        try {
            const docRef = await addDoc(collection(db, collectionName), {
                ...data,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
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
            await setDoc(doc(db, collectionName, id), {
                ...data,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
        }
        catch (error) {
            console.error(`Error creating document with ID in ${collectionName}:`, error);
            throw error;
        }
    }
    async get(collectionName, id) {
        try {
            const docRef = doc(db, collectionName, id);
            const docSnap = await getDoc(docRef);
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
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, {
                ...data,
                updatedAt: Timestamp.now(),
            });
        }
        catch (error) {
            console.error(`Error updating document in ${collectionName}:`, error);
            throw error;
        }
    }
    async delete(collectionName, id) {
        try {
            await deleteDoc(doc(db, collectionName, id));
        }
        catch (error) {
            console.error(`Error deleting document from ${collectionName}:`, error);
            throw error;
        }
    }
    async list(collectionName, constraints = [], limitCount = 50) {
        try {
            const q = query(collection(db, collectionName), ...constraints, limit(limitCount));
            const querySnapshot = await getDocs(q);
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
        const docRef = doc(db, collectionName, id);
        return onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                callback({ id: doc.id, ...doc.data() });
            }
            else {
                callback(null);
            }
        });
    }
    onCollectionChange(collectionName, constraints = [], callback) {
        const q = query(collection(db, collectionName), ...constraints);
        return onSnapshot(q, (querySnapshot) => {
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
        const users = await this.list('users', [where('email', '==', email)], 1);
        return users.length > 0 ? users[0] : null;
    }
    async getUsersByRole(role) {
        return this.list('users', [
            where('role', '==', role),
            orderBy('createdAt', 'desc')
        ]);
    }
    // Markets
    async getOpenMarkets() {
        return this.list('markets', [
            where('isOpen', '==', true),
            orderBy('rating', 'desc')
        ]);
    }
    async getMarketsByOwner(ownerId) {
        return this.list('markets', [
            where('ownerId', '==', ownerId),
            orderBy('createdAt', 'desc')
        ]);
    }
    async getMarketsByCategory(category) {
        return this.list('markets', [
            where('categories', 'array-contains', category),
            where('isOpen', '==', true),
            orderBy('rating', 'desc')
        ]);
    }
    // Products
    async getProductsByMarket(marketId) {
        return this.list('products', [
            where('marketId', '==', marketId),
            where('inStock', '==', true),
            orderBy('createdAt', 'desc')
        ]);
    }
    async getProductsByCategory(category) {
        return this.list('products', [
            where('category', '==', category),
            where('inStock', '==', true),
            orderBy('rating', 'desc')
        ]);
    }
    // Orders
    async getOrdersByUser(userId) {
        return this.list('orders', [
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        ]);
    }
    async getOrdersByMarket(marketId) {
        return this.list('orders', [
            where('marketId', '==', marketId),
            orderBy('createdAt', 'desc')
        ]);
    }
    async getOrdersByDriver(driverId) {
        return this.list('orders', [
            where('driverId', '==', driverId),
            orderBy('createdAt', 'desc')
        ]);
    }
    async getOrdersByStatus(status) {
        return this.list('orders', [
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        ]);
    }
    // Notifications
    async getNotificationsByUser(userId, unreadOnly = false) {
        const constraints = [where('userId', '==', userId)];
        if (unreadOnly) {
            constraints.push(where('isRead', '==', false));
        }
        constraints.push(orderBy('createdAt', 'desc'));
        return this.list('notifications', constraints);
    }
    // Reviews
    async getReviewsByMarket(marketId) {
        return this.list('reviews', [
            where('marketId', '==', marketId),
            orderBy('createdAt', 'desc')
        ]);
    }
    // Deliveries
    async getDeliveriesByDriver(driverId, status) {
        const constraints = [where('driverId', '==', driverId)];
        if (status) {
            constraints.push(where('status', '==', status));
        }
        constraints.push(orderBy('createdAt', 'desc'));
        return this.list('deliveries', constraints);
    }
    // ===========================================
    // OFFLINE SUPPORT
    // ===========================================
    async enableOfflineSupport() {
        try {
            await enableNetwork(db);
            console.log('Firestore offline support enabled');
        }
        catch (error) {
            console.error('Error enabling offline support:', error);
            throw error;
        }
    }
    async disableOfflineSupport() {
        try {
            await disableNetwork(db);
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
// Export singleton instance
export const firestoreService = new FirestoreService();
// Export collection names as constants
export const COLLECTIONS = {
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

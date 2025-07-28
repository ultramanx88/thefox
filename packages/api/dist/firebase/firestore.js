"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreService = void 0;
const firestore_1 = require("firebase/firestore");
const config_1 = require("./config");
class FirestoreService {
    // Generic CRUD operations
    static async create(collectionName, data) {
        try {
            const docRef = await (0, firestore_1.addDoc)((0, firestore_1.collection)(config_1.db, collectionName), {
                ...data,
                createdAt: (0, firestore_1.serverTimestamp)(),
                updatedAt: (0, firestore_1.serverTimestamp)(),
            });
            return docRef.id;
        }
        catch (error) {
            console.error(`Error creating document in ${collectionName}:`, error);
            throw error;
        }
    }
    static async read(collectionName, docId) {
        try {
            const docRef = (0, firestore_1.doc)(config_1.db, collectionName, docId);
            const docSnap = await (0, firestore_1.getDoc)(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        }
        catch (error) {
            console.error(`Error reading document from ${collectionName}:`, error);
            throw error;
        }
    }
    static async update(collectionName, docId, data) {
        try {
            const docRef = (0, firestore_1.doc)(config_1.db, collectionName, docId);
            await (0, firestore_1.updateDoc)(docRef, {
                ...data,
                updatedAt: (0, firestore_1.serverTimestamp)(),
            });
        }
        catch (error) {
            console.error(`Error updating document in ${collectionName}:`, error);
            throw error;
        }
    }
    static async delete(collectionName, docId) {
        try {
            const docRef = (0, firestore_1.doc)(config_1.db, collectionName, docId);
            await (0, firestore_1.deleteDoc)(docRef);
        }
        catch (error) {
            console.error(`Error deleting document from ${collectionName}:`, error);
            throw error;
        }
    }
    // Query operations
    static async query(collectionName, filters, orderByField, orderDirection = 'asc', limitCount, startAfterDoc) {
        try {
            let q = (0, firestore_1.collection)(config_1.db, collectionName);
            let queryRef = (0, firestore_1.query)(q);
            // Apply filters
            if (filters) {
                filters.forEach(filter => {
                    queryRef = (0, firestore_1.query)(queryRef, (0, firestore_1.where)(filter.field, filter.operator, filter.value));
                });
            }
            // Apply ordering
            if (orderByField) {
                queryRef = (0, firestore_1.query)(queryRef, (0, firestore_1.orderBy)(orderByField, orderDirection));
            }
            // Apply limit
            if (limitCount) {
                queryRef = (0, firestore_1.query)(queryRef, (0, firestore_1.limit)(limitCount));
            }
            // Apply pagination
            if (startAfterDoc) {
                queryRef = (0, firestore_1.query)(queryRef, (0, firestore_1.startAfter)(startAfterDoc));
            }
            const querySnapshot = await (0, firestore_1.getDocs)(queryRef);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error(`Error querying ${collectionName}:`, error);
            throw error;
        }
    }
    // Real-time listeners
    static onSnapshot(collectionName, callback, filters, orderByField, orderDirection = 'asc') {
        try {
            let q = (0, firestore_1.collection)(config_1.db, collectionName);
            let queryRef = (0, firestore_1.query)(q);
            // Apply filters
            if (filters) {
                filters.forEach(filter => {
                    queryRef = (0, firestore_1.query)(queryRef, (0, firestore_1.where)(filter.field, filter.operator, filter.value));
                });
            }
            // Apply ordering
            if (orderByField) {
                queryRef = (0, firestore_1.query)(queryRef, (0, firestore_1.orderBy)(orderByField, orderDirection));
            }
            return (0, firestore_1.onSnapshot)(queryRef, (querySnapshot) => {
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(data);
            });
        }
        catch (error) {
            console.error(`Error setting up listener for ${collectionName}:`, error);
            throw error;
        }
    }
    // Specific service methods
    static async getMarkets(filters) {
        const queryFilters = [];
        if (filters?.category) {
            queryFilters.push({ field: 'categories', operator: 'array-contains', value: filters.category });
        }
        if (filters?.isOpen !== undefined) {
            queryFilters.push({ field: 'isOpen', operator: '==', value: filters.isOpen });
        }
        return this.query('markets', queryFilters, 'name');
    }
    static async getProducts(marketId, category) {
        const queryFilters = [
            { field: 'marketId', operator: '==', value: marketId }
        ];
        if (category) {
            queryFilters.push({ field: 'category', operator: '==', value: category });
        }
        return this.query('products', queryFilters, 'name');
    }
    static async getUserOrders(userId) {
        return this.query('orders', [{ field: 'userId', operator: '==', value: userId }], 'createdAt', 'desc');
    }
    static async createOrder(orderData) {
        return this.create('orders', orderData);
    }
    static async updateOrderStatus(orderId, status) {
        return this.update('orders', orderId, { status });
    }
    // User profile methods
    static async createUserProfile(userId, userData) {
        try {
            const userRef = (0, firestore_1.doc)(config_1.db, 'users', userId);
            await (0, firestore_1.updateDoc)(userRef, {
                ...userData,
                createdAt: (0, firestore_1.serverTimestamp)(),
                updatedAt: (0, firestore_1.serverTimestamp)(),
            });
        }
        catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    }
    static async getUserProfile(userId) {
        return this.read('users', userId);
    }
    // Utility methods
    static serverTimestamp() {
        return (0, firestore_1.serverTimestamp)();
    }
    static increment(value) {
        return (0, firestore_1.increment)(value);
    }
    static arrayUnion(...elements) {
        return (0, firestore_1.arrayUnion)(...elements);
    }
    static arrayRemove(...elements) {
        return (0, firestore_1.arrayRemove)(...elements);
    }
    static timestampToDate(timestamp) {
        return timestamp.toDate();
    }
}
exports.FirestoreService = FirestoreService;

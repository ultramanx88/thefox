import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, onSnapshot, serverTimestamp, increment, arrayUnion, arrayRemove, } from 'firebase/firestore';
import { db } from './config';
export class FirestoreService {
    // Generic CRUD operations
    static async create(collectionName, data) {
        try {
            const docRef = await addDoc(collection(db, collectionName), {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
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
            const docRef = doc(db, collectionName, docId);
            const docSnap = await getDoc(docRef);
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
            const docRef = doc(db, collectionName, docId);
            await updateDoc(docRef, {
                ...data,
                updatedAt: serverTimestamp(),
            });
        }
        catch (error) {
            console.error(`Error updating document in ${collectionName}:`, error);
            throw error;
        }
    }
    static async delete(collectionName, docId) {
        try {
            const docRef = doc(db, collectionName, docId);
            await deleteDoc(docRef);
        }
        catch (error) {
            console.error(`Error deleting document from ${collectionName}:`, error);
            throw error;
        }
    }
    // Query operations
    static async query(collectionName, filters, orderByField, orderDirection = 'asc', limitCount, startAfterDoc) {
        try {
            let q = collection(db, collectionName);
            let queryRef = query(q);
            // Apply filters
            if (filters) {
                filters.forEach(filter => {
                    queryRef = query(queryRef, where(filter.field, filter.operator, filter.value));
                });
            }
            // Apply ordering
            if (orderByField) {
                queryRef = query(queryRef, orderBy(orderByField, orderDirection));
            }
            // Apply limit
            if (limitCount) {
                queryRef = query(queryRef, limit(limitCount));
            }
            // Apply pagination
            if (startAfterDoc) {
                queryRef = query(queryRef, startAfter(startAfterDoc));
            }
            const querySnapshot = await getDocs(queryRef);
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
            let q = collection(db, collectionName);
            let queryRef = query(q);
            // Apply filters
            if (filters) {
                filters.forEach(filter => {
                    queryRef = query(queryRef, where(filter.field, filter.operator, filter.value));
                });
            }
            // Apply ordering
            if (orderByField) {
                queryRef = query(queryRef, orderBy(orderByField, orderDirection));
            }
            return onSnapshot(queryRef, (querySnapshot) => {
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
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                ...userData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
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
        return serverTimestamp();
    }
    static increment(value) {
        return increment(value);
    }
    static arrayUnion(...elements) {
        return arrayUnion(...elements);
    }
    static arrayRemove(...elements) {
        return arrayRemove(...elements);
    }
    static timestampToDate(timestamp) {
        return timestamp.toDate();
    }
}

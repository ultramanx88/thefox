import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  WhereFilterOp,
  OrderByDirection,
  Timestamp,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './config';
import type { Market, Product, Order, User } from '../types';

export class FirestoreService {
  // Generic CRUD operations
  static async create<T>(collectionName: string, data: Omit<T, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  static async read<T>(collectionName: string, docId: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error reading document from ${collectionName}:`, error);
      throw error;
    }
  }

  static async update<T>(collectionName: string, docId: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  static async delete(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // Query operations
  static async query<T>(
    collectionName: string,
    filters?: Array<{ field: string; operator: WhereFilterOp; value: any }>,
    orderByField?: string,
    orderDirection: OrderByDirection = 'asc',
    limitCount?: number,
    startAfterDoc?: DocumentSnapshot
  ): Promise<T[]> {
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
      })) as T[];
    } catch (error) {
      console.error(`Error querying ${collectionName}:`, error);
      throw error;
    }
  }

  // Real-time listeners
  static onSnapshot<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    filters?: Array<{ field: string; operator: WhereFilterOp; value: any }>,
    orderByField?: string,
    orderDirection: OrderByDirection = 'asc'
  ) {
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
        })) as T[];
        callback(data);
      });
    } catch (error) {
      console.error(`Error setting up listener for ${collectionName}:`, error);
      throw error;
    }
  }

  // Specific service methods
  static async getMarkets(filters?: { category?: string; isOpen?: boolean }): Promise<Market[]> {
    const queryFilters = [];
    
    if (filters?.category) {
      queryFilters.push({ field: 'categories', operator: 'array-contains' as WhereFilterOp, value: filters.category });
    }
    
    if (filters?.isOpen !== undefined) {
      queryFilters.push({ field: 'isOpen', operator: '==' as WhereFilterOp, value: filters.isOpen });
    }

    return this.query<Market>('markets', queryFilters, 'name');
  }

  static async getProducts(marketId: string, category?: string): Promise<Product[]> {
    const queryFilters = [
      { field: 'marketId', operator: '==' as WhereFilterOp, value: marketId }
    ];
    
    if (category) {
      queryFilters.push({ field: 'category', operator: '==' as WhereFilterOp, value: category });
    }

    return this.query<Product>('products', queryFilters, 'name');
  }

  static async getUserOrders(userId: string): Promise<Order[]> {
    return this.query<Order>(
      'orders',
      [{ field: 'userId', operator: '==' as WhereFilterOp, value: userId }],
      'createdAt',
      'desc'
    );
  }

  static async createOrder(orderData: Omit<Order, 'id'>): Promise<string> {
    return this.create<Order>('orders', orderData);
  }

  static async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    return this.update('orders', orderId, { status });
  }

  // User profile methods
  static async createUserProfile(userId: string, userData: Omit<User, 'id'>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  static async getUserProfile(userId: string): Promise<User | null> {
    return this.read<User>('users', userId);
  }

  // Utility methods
  static serverTimestamp() {
    return serverTimestamp();
  }

  static increment(value: number) {
    return increment(value);
  }

  static arrayUnion(...elements: any[]) {
    return arrayUnion(...elements);
  }

  static arrayRemove(...elements: any[]) {
    return arrayRemove(...elements);
  }

  static timestampToDate(timestamp: Timestamp): Date {
    return timestamp.toDate();
  }
}
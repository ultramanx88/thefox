import { DocumentSnapshot, WhereFilterOp, OrderByDirection, Timestamp } from 'firebase/firestore';
import type { Market, Product, Order, User } from '../types';
export declare class FirestoreService {
    static create<T>(collectionName: string, data: Omit<T, 'id'>): Promise<string>;
    static read<T>(collectionName: string, docId: string): Promise<T | null>;
    static update<T>(collectionName: string, docId: string, data: Partial<T>): Promise<void>;
    static delete(collectionName: string, docId: string): Promise<void>;
    static query<T>(collectionName: string, filters?: Array<{
        field: string;
        operator: WhereFilterOp;
        value: any;
    }>, orderByField?: string, orderDirection?: OrderByDirection, limitCount?: number, startAfterDoc?: DocumentSnapshot): Promise<T[]>;
    static onSnapshot<T>(collectionName: string, callback: (data: T[]) => void, filters?: Array<{
        field: string;
        operator: WhereFilterOp;
        value: any;
    }>, orderByField?: string, orderDirection?: OrderByDirection): import("@firebase/firestore").Unsubscribe;
    static getMarkets(filters?: {
        category?: string;
        isOpen?: boolean;
    }): Promise<Market[]>;
    static getProducts(marketId: string, category?: string): Promise<Product[]>;
    static getUserOrders(userId: string): Promise<Order[]>;
    static createOrder(orderData: Omit<Order, 'id'>): Promise<string>;
    static updateOrderStatus(orderId: string, status: Order['status']): Promise<void>;
    static createUserProfile(userId: string, userData: Omit<User, 'id'>): Promise<void>;
    static getUserProfile(userId: string): Promise<User | null>;
    static serverTimestamp(): import("@firebase/firestore").FieldValue;
    static increment(value: number): import("@firebase/firestore").FieldValue;
    static arrayUnion(...elements: any[]): import("@firebase/firestore").FieldValue;
    static arrayRemove(...elements: any[]): import("@firebase/firestore").FieldValue;
    static timestampToDate(timestamp: Timestamp): Date;
}

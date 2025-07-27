import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  Timestamp,
  DocumentReference,
  QueryConstraint,
  enableNetwork,
  disableNetwork,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';

// ===========================================
// TYPE DEFINITIONS
// ===========================================

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

// ===========================================
// DATABASE SERVICE CLASS
// ===========================================

export class FirestoreService {
  
  // ===========================================
  // GENERIC CRUD OPERATIONS
  // ===========================================
  
  async create<T>(collectionName: string, data: Omit<T, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }
  
  async createWithId<T>(collectionName: string, id: string, data: Omit<T, 'id'>): Promise<void> {
    try {
      await setDoc(doc(db, collectionName, id), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error(`Error creating document with ID in ${collectionName}:`, error);
      throw error;
    }
  }
  
  async get<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }
  
  async update<T>(collectionName: string, id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }
  
  async delete(collectionName: string, id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }
  
  async list<T>(
    collectionName: string, 
    constraints: QueryConstraint[] = [],
    limitCount: number = 50
  ): Promise<T[]> {
    try {
      const q = query(
        collection(db, collectionName),
        ...constraints,
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error(`Error listing documents from ${collectionName}:`, error);
      throw error;
    }
  }
  
  // ===========================================
  // REAL-TIME LISTENERS
  // ===========================================
  
  onDocumentChange<T>(
    collectionName: string, 
    id: string, 
    callback: (data: T | null) => void
  ): Unsubscribe {
    const docRef = doc(db, collectionName, id);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as T);
      } else {
        callback(null);
      }
    });
  }
  
  onCollectionChange<T>(
    collectionName: string,
    constraints: QueryConstraint[] = [],
    callback: (data: T[]) => void
  ): Unsubscribe {
    const q = query(collection(db, collectionName), ...constraints);
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      callback(data);
    });
  }
  
  // ===========================================
  // SPECIALIZED QUERY METHODS
  // ===========================================
  
  // Users
  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.list<User>('users', [where('email', '==', email)], 1);
    return users.length > 0 ? users[0] : null;
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return this.list<User>('users', [
      where('role', '==', role),
      orderBy('createdAt', 'desc')
    ]);
  }
  
  // Markets
  async getOpenMarkets(): Promise<Market[]> {
    return this.list<Market>('markets', [
      where('isOpen', '==', true),
      orderBy('rating', 'desc')
    ]);
  }
  
  async getMarketsByOwner(ownerId: string): Promise<Market[]> {
    return this.list<Market>('markets', [
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    ]);
  }
  
  async getMarketsByCategory(category: string): Promise<Market[]> {
    return this.list<Market>('markets', [
      where('categories', 'array-contains', category),
      where('isOpen', '==', true),
      orderBy('rating', 'desc')
    ]);
  }
  
  // Products
  async getProductsByMarket(marketId: string): Promise<Product[]> {
    return this.list<Product>('products', [
      where('marketId', '==', marketId),
      where('inStock', '==', true),
      orderBy('createdAt', 'desc')
    ]);
  }
  
  async getProductsByCategory(category: string): Promise<Product[]> {
    return this.list<Product>('products', [
      where('category', '==', category),
      where('inStock', '==', true),
      orderBy('rating', 'desc')
    ]);
  }
  
  // Orders
  async getOrdersByUser(userId: string): Promise<Order[]> {
    return this.list<Order>('orders', [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ]);
  }
  
  async getOrdersByMarket(marketId: string): Promise<Order[]> {
    return this.list<Order>('orders', [
      where('marketId', '==', marketId),
      orderBy('createdAt', 'desc')
    ]);
  }
  
  async getOrdersByDriver(driverId: string): Promise<Order[]> {
    return this.list<Order>('orders', [
      where('driverId', '==', driverId),
      orderBy('createdAt', 'desc')
    ]);
  }
  
  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return this.list<Order>('orders', [
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    ]);
  }
  
  // Notifications
  async getNotificationsByUser(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    const constraints = [where('userId', '==', userId)];
    if (unreadOnly) {
      constraints.push(where('isRead', '==', false));
    }
    constraints.push(orderBy('createdAt', 'desc'));
    
    return this.list<Notification>('notifications', constraints);
  }
  
  // Reviews
  async getReviewsByMarket(marketId: string): Promise<Review[]> {
    return this.list<Review>('reviews', [
      where('marketId', '==', marketId),
      orderBy('createdAt', 'desc')
    ]);
  }
  
  // Deliveries
  async getDeliveriesByDriver(driverId: string, status?: string): Promise<Delivery[]> {
    const constraints = [where('driverId', '==', driverId)];
    if (status) {
      constraints.push(where('status', '==', status));
    }
    constraints.push(orderBy('createdAt', 'desc'));
    
    return this.list<Delivery>('deliveries', constraints);
  }
  
  // ===========================================
  // OFFLINE SUPPORT
  // ===========================================
  
  async enableOfflineSupport(): Promise<void> {
    try {
      await enableNetwork(db);
      console.log('Firestore offline support enabled');
    } catch (error) {
      console.error('Error enabling offline support:', error);
      throw error;
    }
  }
  
  async disableOfflineSupport(): Promise<void> {
    try {
      await disableNetwork(db);
      console.log('Firestore offline support disabled');
    } catch (error) {
      console.error('Error disabling offline support:', error);
      throw error;
    }
  }
  
  // ===========================================
  // BATCH OPERATIONS
  // ===========================================
  
  async batchUpdate(operations: Array<{
    collection: string;
    id: string;
    data: any;
  }>): Promise<void> {
    try {
      // Note: For batch operations, we would use writeBatch from Firestore
      // This is a simplified version for demonstration
      const promises = operations.map(op => 
        this.update(op.collection, op.id, op.data)
      );
      await Promise.all(promises);
    } catch (error) {
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
} as const;
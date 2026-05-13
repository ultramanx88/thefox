import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Order } from '../types';

export const ProductService = {
  async getProducts(): Promise<Product[]> {
    const path = 'products';
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToProducts(callback: (products: Product[]) => void) {
    const path = 'products';
    return onSnapshot(collection(db, path), (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      callback(products);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<string | null> {
    const path = 'orders';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...order,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return null;
    }
  }
};

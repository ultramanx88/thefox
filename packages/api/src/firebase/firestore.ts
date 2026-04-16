import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  type WhereFilterOp,
} from 'firebase/firestore';
import { db } from './config';
import type { Market, Product, Order, User } from '../types';

interface Filter {
  field: string;
  operator: WhereFilterOp;
  value: unknown;
}

export const FirestoreService = {
  read: async <T>(col: string, id: string): Promise<T> => {
    const snap = await getDoc(doc(db, col, id));
    if (!snap.exists()) throw new Error(`${col}/${id} not found`);
    return { id: snap.id, ...snap.data() } as T;
  },

  create: async (col: string, data: object) => {
    const ref = await addDoc(collection(db, col), { ...data, createdAt: serverTimestamp() });
    return ref.id;
  },

  update: (col: string, id: string, data: object) =>
    updateDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() }),

  delete: (col: string, id: string) => deleteDoc(doc(db, col, id)),

  onSnapshot: <T>(
    col: string,
    callback: (items: T[]) => void,
    filters?: Filter[]
  ) => {
    let q = query(collection(db, col));
    if (filters) {
      filters.forEach((f) => {
        q = query(q, where(f.field, f.operator, f.value));
      });
    }
    return onSnapshot(q, (snap) =>
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T))
    );
  },

  getMarkets: async (params?: { category?: string; isOpen?: boolean }): Promise<Market[]> => {
    let q = query(collection(db, 'markets'), orderBy('name'));
    if (params?.category) q = query(q, where('categories', 'array-contains', params.category));
    if (params?.isOpen !== undefined) q = query(q, where('isOpen', '==', params.isOpen));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Market);
  },

  getProducts: async (marketId: string, category?: string): Promise<Product[]> => {
    let q = query(collection(db, 'products'), where('marketId', '==', marketId));
    if (category) q = query(q, where('category', '==', category));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
  },

  getUserOrders: async (userId: string): Promise<Order[]> => {
    const q = query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
  },

  getUserProfile: async (userId: string): Promise<User | null> => {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as User;
  },

  createUserProfile: (uid: string, data: object) =>
    updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() }).catch(() =>
      addDoc(collection(db, 'users'), { uid, ...data, createdAt: serverTimestamp() })
    ),
};

import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { Category, CategoryTree } from '../types';

const col = () => collection(db, 'categories');

export const CategoryService = {
  getCategories: async (activeOnly = true): Promise<Category[]> => {
    let q = query(col(), orderBy('order'));
    if (activeOnly) q = query(q, where('isActive', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category);
  },

  getCategory: async (id: string): Promise<Category> => {
    const snap = await getDoc(doc(db, 'categories', id));
    if (!snap.exists()) throw new Error('Category not found');
    return { id: snap.id, ...snap.data() } as Category;
  },

  createCategory: async (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const ref = await addDoc(col(), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return ref.id;
  },

  updateCategory: (id: string, updates: Partial<Category>) =>
    updateDoc(doc(db, 'categories', id), { ...updates, updatedAt: serverTimestamp() }),

  deleteCategory: (id: string) => deleteDoc(doc(db, 'categories', id)),

  getMainCategories: async (): Promise<Category[]> => {
    const q = query(col(), where('parentId', '==', null), where('isActive', '==', true), orderBy('order'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category);
  },

  getSubcategories: async (parentId: string): Promise<Category[]> => {
    const q = query(col(), where('parentId', '==', parentId), orderBy('order'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category);
  },

  getCategoryTree: async (): Promise<CategoryTree[]> => {
    const all = await CategoryService.getCategories(false);
    const map = new Map(all.map((c) => [c.id, { ...c, children: [] as Category[] }]));
    const roots: CategoryTree[] = [];
    map.forEach((cat) => {
      if (cat.parentId) map.get(cat.parentId)?.children.push(cat);
      else roots.push(cat as CategoryTree);
    });
    return roots;
  },

  searchCategories: async (term: string): Promise<Category[]> => {
    const all = await CategoryService.getCategories();
    const t = term.toLowerCase();
    return all.filter((c) => c.name.toLowerCase().includes(t));
  },

  getCategoriesWithProductCount: async (): Promise<Category[]> => {
    const cats = await CategoryService.getCategories();
    return cats; // product count can be added via aggregation query if needed
  },

  updateCategoryOrder: (categoryId: string, newOrder: number) =>
    updateDoc(doc(db, 'categories', categoryId), { order: newOrder, updatedAt: serverTimestamp() }),

  toggleCategoryStatus: async (categoryId: string) => {
    const snap = await getDoc(doc(db, 'categories', categoryId));
    if (!snap.exists()) return;
    await updateDoc(doc(db, 'categories', categoryId), {
      isActive: !snap.data().isActive,
      updatedAt: serverTimestamp(),
    });
  },

  initializeDefaultCategories: async () => {
    const defaults = ['อาหารสด', 'ผัก-ผลไม้', 'เนื้อสัตว์', 'อาหารทะเล', 'เครื่องดื่ม', 'ขนม'];
    for (const name of defaults) {
      await addDoc(col(), { name, slug: name, isActive: true, order: defaults.indexOf(name), parentId: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
  },

  onCategoriesChange: (callback: (categories: Category[]) => void) => {
    const q = query(col(), where('isActive', '==', true), orderBy('order'));
    return onSnapshot(q, (snap) =>
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category))
    );
  },
};

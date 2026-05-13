import { create } from 'zustand';
import { Product, CartItem } from '../types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  total: number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  total: 0,
  addItem: (product) => {
    const items = get().items;
    const existingItem = items.find((i) => i.id === product.id);

    if (existingItem) {
      const updatedItems = items.map((i) =>
        i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      );
      set({ items: updatedItems, total: get().total + product.price });
    } else {
      set({
        items: [...items, { ...product, quantity: 1 }],
        total: get().total + product.price,
      });
    }
  },
  removeItem: (id) => {
    const items = get().items;
    const itemToRemove = items.find((i) => i.id === id);
    if (itemToRemove) {
      set({
        items: items.filter((i) => i.id !== id),
        total: get().total - itemToRemove.price * itemToRemove.quantity,
      });
    }
  },
  clearCart: () => set({ items: [], total: 0 }),
}));

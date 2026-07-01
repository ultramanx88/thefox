import type { Product } from '@thefox/shared';
import { create } from 'zustand';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  clear: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (product) =>
    set((state) => {
      const existing = state.items.find(
        (item) => item.product.id === product.id
      );

      if (!existing) {
        return { items: [...state.items, { product, quantity: 1 }] };
      }

      return {
        items: state.items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      };
    }),
  clear: () => set({ items: [] })
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      
      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find(i => i.id === item.id);
        
        if (existingItem) {
          set({
            items: items.map(i => 
              i.id === item.id 
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            )
          });
        } else {
          set({
            items: [...items, { ...item, quantity: item.quantity || 1 }]
          });
        }
        
        // Recalculate total
        const newItems = get().items;
        const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        set({ total: newTotal });
      },
      
      removeItem: (id) => {
        const { items } = get();
        const newItems = items.filter(item => item.id !== id);
        const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        set({ items: newItems, total: newTotal });
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        
        const { items } = get();
        const newItems = items.map(item => 
          item.id === id ? { ...item, quantity } : item
        );
        const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        set({ items: newItems, total: newTotal });
      },
      
      clearCart: () => set({ items: [], total: 0 }),
      
      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'cart-storage',
    }
  )
);

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: 'user' | 'admin';
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  setToken: (token: string) => void;
  getToken: () => string | null;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      
      login: (user) => set({ user, isAuthenticated: true }),
      
      logout: () => {
        set({ user: null, isAuthenticated: false });
        // Clear token from cookies
        if (typeof document !== 'undefined') {
          document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
      },
      
      setToken: (token) => {
        // Set token in cookies
        if (typeof document !== 'undefined') {
          document.cookie = `auth-token=${token}; path=/; max-age=86400; secure; samesite=strict`;
        }
      },
      
      getToken: () => {
        if (typeof document === 'undefined') return null;
        const match = document.cookie.match(/auth-token=([^;]+)/);
        return match ? match[1] : null;
      },
    }),
    {
      name: 'user-storage',
    }
  )
);
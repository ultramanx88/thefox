import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

class MobileStore {
  private cartItems: CartItem[] = [];
  private user: User | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private async loadFromStorage() {
    try {
      const cartData = await AsyncStorage.getItem('cart');
      const userData = await AsyncStorage.getItem('user');
      
      if (cartData) this.cartItems = JSON.parse(cartData);
      if (userData) this.user = JSON.parse(userData);
      
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  }

  private async saveToStorage() {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(this.cartItems));
      if (this.user) {
        await AsyncStorage.setItem('user', JSON.stringify(this.user));
      } else {
        await AsyncStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Cart methods
  addToCart(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
    const existingIndex = this.cartItems.findIndex(i => i.id === item.id);
    
    if (existingIndex >= 0) {
      this.cartItems[existingIndex].quantity += item.quantity || 1;
    } else {
      this.cartItems.push({ ...item, quantity: item.quantity || 1 });
    }
    
    this.saveToStorage();
    this.notifyListeners();
  }

  removeFromCart(id: string) {
    this.cartItems = this.cartItems.filter(item => item.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(id);
      return;
    }
    
    const item = this.cartItems.find(i => i.id === id);
    if (item) {
      item.quantity = quantity;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  getCart() {
    return this.cartItems;
  }

  getCartTotal() {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getCartItemCount() {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }

  clearCart() {
    this.cartItems = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  // User methods
  setUser(user: User) {
    this.user = user;
    this.saveToStorage();
    this.notifyListeners();
  }

  getUser() {
    return this.user;
  }

  logout() {
    this.user = null;
    this.clearCart();
    this.saveToStorage();
    this.notifyListeners();
  }

  isAuthenticated() {
    return this.user !== null;
  }
}

export const mobileStore = new MobileStore();
export default mobileStore;
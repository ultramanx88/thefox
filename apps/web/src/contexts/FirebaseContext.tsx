'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  AuthService, 
  AuthUser, 
  MarketService, 
  ProductService, 
  OrderService,
  StorageService,
  FunctionsService 
} from '@repo/api';

interface FirebaseContextType {
  // Auth
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (email: string, password: string, displayName?: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  
  // Markets
  markets: any[];
  loadNearbyMarkets: (lat: number, lng: number) => Promise<void>;
  getMarket: (id: string) => Promise<any>;
  
  // Products
  products: any[];
  loadProductsByMarket: (marketId: string) => Promise<void>;
  searchProducts: (query: string, marketId?: string) => Promise<void>;
  getProduct: (id: string) => Promise<any>;
  
  // Orders
  orders: any[];
  createOrder: (orderData: any) => Promise<any>;
  getOrder: (id: string) => Promise<any>;
  calculateDeliveryFee: (data: any) => Promise<any>;
  
  // Storage
  uploadImage: (file: File, path: string, onProgress?: (progress: number) => void) => Promise<string>;
  uploadProfileImage: (userId: string, file: File, onProgress?: (progress: number) => void) => Promise<string>;
  uploadProductImage: (marketId: string, productId: string, file: File, onProgress?: (progress: number) => void) => Promise<string>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Data state
  const [markets, setMarkets] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Listen to user orders
  useEffect(() => {
    if (user) {
      const unsubscribe = OrderService.onUserOrdersSnapshot(user.uid, (userOrders) => {
        setOrders(userOrders);
      });
      return unsubscribe;
    }
  }, [user]);

  // Auth methods
  const signIn = async (email: string, password: string): Promise<AuthUser> => {
    try {
      const authUser = await AuthService.signIn(email, password);
      const token = await AuthService.getIdToken();
      if (token) {
        localStorage.setItem('auth_token', token);
      }
      return authUser;
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<AuthUser> => {
    try {
      const authUser = await AuthService.signUp(email, password, displayName);
      const token = await AuthService.getIdToken();
      if (token) {
        localStorage.setItem('auth_token', token);
      }
      return authUser;
    } catch (error) {
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await AuthService.signOut();
      localStorage.removeItem('auth_token');
      setOrders([]);
    } catch (error) {
      throw error;
    }
  };

  // Market methods
  const loadNearbyMarkets = async (lat: number, lng: number): Promise<void> => {
    try {
      const nearbyMarkets = await FunctionsService.getNearbyMarkets(lat, lng);
      setMarkets(nearbyMarkets);
    } catch (error) {
      console.error('Error loading markets:', error);
    }
  };

  const getMarket = async (id: string) => {
    try {
      return await MarketService.getMarket(id);
    } catch (error) {
      console.error('Error getting market:', error);
      return null;
    }
  };

  // Product methods
  const loadProductsByMarket = async (marketId: string): Promise<void> => {
    try {
      const marketProducts = await ProductService.getProductsByMarket(marketId);
      setProducts(marketProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const searchProducts = async (query: string, marketId?: string): Promise<void> => {
    try {
      const searchResults = await FunctionsService.searchProducts(query, marketId);
      setProducts(searchResults);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const getProduct = async (id: string) => {
    try {
      return await ProductService.getProduct(id);
    } catch (error) {
      console.error('Error getting product:', error);
      return null;
    }
  };

  // Order methods
  const createOrder = async (orderData: any) => {
    try {
      const result = await FunctionsService.createOrder(orderData);
      return result;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const getOrder = async (id: string) => {
    try {
      return await OrderService.getOrder(id);
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  };

  const calculateDeliveryFee = async (data: any) => {
    try {
      return await FunctionsService.calculateDeliveryFee(data);
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      throw error;
    }
  };

  // Storage methods
  const uploadImage = async (
    file: File,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    try {
      const downloadURL = await StorageService.uploadFile(
        path,
        file,
        (uploadProgress) => {
          onProgress?.(uploadProgress.progress);
        }
      );
      return downloadURL;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const uploadProfileImage = async (
    userId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    const path = StorageService.generateFilePath('users', userId, file.name, 'profile');
    return uploadImage(file, path, onProgress);
  };

  const uploadProductImage = async (
    marketId: string,
    productId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    const path = StorageService.generateFilePath('products', productId, file.name, 'images');
    return uploadImage(file, path, onProgress);
  };

  const value: FirebaseContextType = {
    // Auth
    user,
    loading,
    signIn,
    signUp,
    signOut,
    
    // Markets
    markets,
    loadNearbyMarkets,
    getMarket,
    
    // Products
    products,
    loadProductsByMarket,
    searchProducts,
    getProduct,
    
    // Orders
    orders,
    createOrder,
    getOrder,
    calculateDeliveryFee,
    
    // Storage
    uploadImage,
    uploadProfileImage,
    uploadProductImage,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
import { useState, useEffect } from 'react';
import { 
  AuthService, 
  AuthUser, 
  MarketService, 
  ProductService, 
  OrderService,
  StorageService,
  FunctionsService 
} from '@repo/api';
import * as SecureStore from 'expo-secure-store';

// Custom hook for Firebase Authentication
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const user = await AuthService.signIn(email, password);
      const token = await AuthService.getIdToken();
      if (token) {
        await SecureStore.setItemAsync('auth_token', token);
      }
      return user;
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const user = await AuthService.signUp(email, password, displayName);
      const token = await AuthService.getIdToken();
      if (token) {
        await SecureStore.setItemAsync('auth_token', token);
      }
      return user;
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
      await SecureStore.deleteItemAsync('auth_token');
    } catch (error) {
      throw error;
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
}

// Custom hook for Markets
export function useMarkets() {
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNearbyMarkets = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const nearbyMarkets = await FunctionsService.getNearbyMarkets(lat, lng);
      setMarkets(nearbyMarkets);
    } catch (error) {
      console.error('Error loading markets:', error);
    } finally {
      setLoading(false);
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

  return {
    markets,
    loading,
    loadNearbyMarkets,
    getMarket,
  };
}

// Custom hook for Products
export function useProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProductsByMarket = async (marketId: string) => {
    try {
      setLoading(true);
      const marketProducts = await ProductService.getProductsByMarket(marketId);
      setProducts(marketProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (query: string, marketId?: string) => {
    try {
      setLoading(true);
      const searchResults = await FunctionsService.searchProducts(query, marketId);
      setProducts(searchResults);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
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

  return {
    products,
    loading,
    loadProductsByMarket,
    searchProducts,
    getProduct,
  };
}

// Custom hook for Orders
export function useOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const unsubscribe = OrderService.onUserOrdersSnapshot(user.uid, (userOrders) => {
        setOrders(userOrders);
      });
      return unsubscribe;
    }
  }, [user]);

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

  return {
    orders,
    loading,
    createOrder,
    getOrder,
    calculateDeliveryFee,
  };
}

// Custom hook for File Upload
export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (
    uri: string,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    try {
      setUploading(true);
      setProgress(0);

      // Convert URI to blob for upload
      const response = await fetch(uri);
      const blob = await response.blob();

      const downloadURL = await StorageService.uploadFile(
        path,
        blob,
        (uploadProgress) => {
          const progressPercent = uploadProgress.progress;
          setProgress(progressPercent);
          onProgress?.(progressPercent);
        }
      );

      return downloadURL;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const uploadProfileImage = async (
    userId: string,
    imageUri: string,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    const path = StorageService.generateFilePath('users', userId, 'profile.jpg', 'profile');
    return uploadImage(imageUri, path, onProgress);
  };

  const uploadProductImage = async (
    marketId: string,
    productId: string,
    imageUri: string,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    const path = StorageService.generateFilePath('products', productId, 'product.jpg', 'images');
    return uploadImage(imageUri, path, onProgress);
  };

  return {
    uploading,
    progress,
    uploadImage,
    uploadProfileImage,
    uploadProductImage,
  };
}
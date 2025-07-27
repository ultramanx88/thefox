import { useState, useEffect, useCallback } from 'react';
import { 
  firestoreService, 
  User, 
  Market, 
  Product, 
  Order, 
  Notification,
  Category,
  ServiceArea,
  Review,
  Delivery,
  COLLECTIONS
} from '@/packages/api/src/firebase/database';
import { where, orderBy, QueryConstraint } from 'firebase/firestore';

// ===========================================
// GENERIC FIRESTORE HOOK
// ===========================================

export function useFirestoreDocument<T>(collection: string, id: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = firestoreService.onDocumentChange<T>(
      collection,
      id,
      (document) => {
        setData(document);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collection, id]);

  const updateDocument = useCallback(async (updates: Partial<T>) => {
    if (!id) return;
    
    try {
      await firestoreService.update(collection, id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      throw err;
    }
  }, [collection, id]);

  const deleteDocument = useCallback(async () => {
    if (!id) return;
    
    try {
      await firestoreService.delete(collection, id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      throw err;
    }
  }, [collection, id]);

  return {
    data,
    loading,
    error,
    updateDocument,
    deleteDocument,
  };
}

export function useFirestoreCollection<T>(
  collection: string,
  constraints: QueryConstraint[] = [],
  limit: number = 50
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = firestoreService.onCollectionChange<T>(
      collection,
      constraints,
      (documents) => {
        setData(documents);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collection, JSON.stringify(constraints), limit]);

  const addDocument = useCallback(async (document: Omit<T, 'id'>) => {
    try {
      return await firestoreService.create<T>(collection, document);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
      throw err;
    }
  }, [collection]);

  return {
    data,
    loading,
    error,
    addDocument,
  };
}

// ===========================================
// SPECIALIZED HOOKS
// ===========================================

// Users
export function useUser(userId: string | null) {
  return useFirestoreDocument<User>(COLLECTIONS.USERS, userId);
}

export function useUserByEmail(email: string | null) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    firestoreService.getUserByEmail(email)
      .then(setUser)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [email]);

  return { user, loading, error };
}

export function useUsersByRole(role: string) {
  return useFirestoreCollection<User>(
    COLLECTIONS.USERS,
    [where('role', '==', role), orderBy('createdAt', 'desc')]
  );
}

// Markets
export function useMarket(marketId: string | null) {
  return useFirestoreDocument<Market>(COLLECTIONS.MARKETS, marketId);
}

export function useOpenMarkets() {
  return useFirestoreCollection<Market>(
    COLLECTIONS.MARKETS,
    [where('isOpen', '==', true), orderBy('rating', 'desc')]
  );
}

export function useMarketsByOwner(ownerId: string | null) {
  const constraints = ownerId 
    ? [where('ownerId', '==', ownerId), orderBy('createdAt', 'desc')]
    : [];
    
  return useFirestoreCollection<Market>(COLLECTIONS.MARKETS, constraints);
}

export function useMarketsByCategory(category: string | null) {
  const constraints = category
    ? [
        where('categories', 'array-contains', category),
        where('isOpen', '==', true),
        orderBy('rating', 'desc')
      ]
    : [];
    
  return useFirestoreCollection<Market>(COLLECTIONS.MARKETS, constraints);
}

// Products
export function useProduct(productId: string | null) {
  return useFirestoreDocument<Product>(COLLECTIONS.PRODUCTS, productId);
}

export function useProductsByMarket(marketId: string | null) {
  const constraints = marketId
    ? [
        where('marketId', '==', marketId),
        where('inStock', '==', true),
        orderBy('createdAt', 'desc')
      ]
    : [];
    
  return useFirestoreCollection<Product>(COLLECTIONS.PRODUCTS, constraints);
}

export function useProductsByCategory(category: string | null) {
  const constraints = category
    ? [
        where('category', '==', category),
        where('inStock', '==', true),
        orderBy('rating', 'desc')
      ]
    : [];
    
  return useFirestoreCollection<Product>(COLLECTIONS.PRODUCTS, constraints);
}

// Orders
export function useOrder(orderId: string | null) {
  return useFirestoreDocument<Order>(COLLECTIONS.ORDERS, orderId);
}

export function useOrdersByUser(userId: string | null) {
  const constraints = userId
    ? [where('userId', '==', userId), orderBy('createdAt', 'desc')]
    : [];
    
  return useFirestoreCollection<Order>(COLLECTIONS.ORDERS, constraints);
}

export function useOrdersByMarket(marketId: string | null) {
  const constraints = marketId
    ? [where('marketId', '==', marketId), orderBy('createdAt', 'desc')]
    : [];
    
  return useFirestoreCollection<Order>(COLLECTIONS.ORDERS, constraints);
}

export function useOrdersByDriver(driverId: string | null) {
  const constraints = driverId
    ? [where('driverId', '==', driverId), orderBy('createdAt', 'desc')]
    : [];
    
  return useFirestoreCollection<Order>(COLLECTIONS.ORDERS, constraints);
}

export function useOrdersByStatus(status: string | null) {
  const constraints = status
    ? [where('status', '==', status), orderBy('createdAt', 'desc')]
    : [];
    
  return useFirestoreCollection<Order>(COLLECTIONS.ORDERS, constraints);
}

// Notifications
export function useNotificationsByUser(userId: string | null, unreadOnly: boolean = false) {
  const constraints = userId
    ? [
        where('userId', '==', userId),
        ...(unreadOnly ? [where('isRead', '==', false)] : []),
        orderBy('createdAt', 'desc')
      ]
    : [];
    
  return useFirestoreCollection<Notification>(COLLECTIONS.NOTIFICATIONS, constraints);
}

// Categories
export function useCategories() {
  return useFirestoreCollection<Category>(
    COLLECTIONS.CATEGORIES,
    [where('isActive', '==', true), orderBy('name', 'asc')]
  );
}

export function useCategory(categoryId: string | null) {
  return useFirestoreDocument<Category>(COLLECTIONS.CATEGORIES, categoryId);
}

// Service Areas
export function useServiceAreas() {
  return useFirestoreCollection<ServiceArea>(
    COLLECTIONS.SERVICE_AREAS,
    [where('isActive', '==', true), orderBy('name', 'asc')]
  );
}

export function useServiceArea(areaId: string | null) {
  return useFirestoreDocument<ServiceArea>(COLLECTIONS.SERVICE_AREAS, areaId);
}

// Reviews
export function useReviewsByMarket(marketId: string | null) {
  const constraints = marketId
    ? [where('marketId', '==', marketId), orderBy('createdAt', 'desc')]
    : [];
    
  return useFirestoreCollection<Review>(COLLECTIONS.REVIEWS, constraints);
}

export function useReview(reviewId: string | null) {
  return useFirestoreDocument<Review>(COLLECTIONS.REVIEWS, reviewId);
}

// Deliveries
export function useDeliveriesByDriver(driverId: string | null, status?: string) {
  const constraints = driverId
    ? [
        where('driverId', '==', driverId),
        ...(status ? [where('status', '==', status)] : []),
        orderBy('createdAt', 'desc')
      ]
    : [];
    
  return useFirestoreCollection<Delivery>(COLLECTIONS.DELIVERIES, constraints);
}

export function useDelivery(deliveryId: string | null) {
  return useFirestoreDocument<Delivery>(COLLECTIONS.DELIVERIES, deliveryId);
}

// ===========================================
// UTILITY HOOKS
// ===========================================

export function useFirestoreStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMarkets: 0,
    totalProducts: 0,
    totalOrders: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, markets, products, orders] = await Promise.all([
          firestoreService.list<User>(COLLECTIONS.USERS, [], 1000),
          firestoreService.list<Market>(COLLECTIONS.MARKETS, [], 1000),
          firestoreService.list<Product>(COLLECTIONS.PRODUCTS, [], 1000),
          firestoreService.list<Order>(COLLECTIONS.ORDERS, [], 1000),
        ]);

        setStats({
          totalUsers: users.length,
          totalMarkets: markets.length,
          totalProducts: products.length,
          totalOrders: orders.length,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  return stats;
}
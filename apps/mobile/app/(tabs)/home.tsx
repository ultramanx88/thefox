import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mobileApiClient } from '../../src/lib/api-client';
import { mobileStore } from '../../src/lib/store';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

export default function HomeTab() {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadProducts();
    
    const unsubscribe = mobileStore.subscribe(() => {
      setCartCount(mobileStore.getCartItemCount());
    });
    
    setCartCount(mobileStore.getCartItemCount());
    
    return unsubscribe;
  }, []);

  const loadProducts = async () => {
    try {
      const response = await mobileApiClient.getProducts();
      setProducts(response.data || sampleProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts(sampleProducts);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleAddToCart = (product: Product) => {
    mobileStore.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  };

  const sampleProducts: Product[] = [
    {
      id: '1',
      name: 'Fresh Organic Bananas',
      price: 4.99,
      image: 'https://via.placeholder.com/150',
      category: 'Fruits',
    },
    {
      id: '2',
      name: 'Premium Beef Steak',
      price: 24.99,
      image: 'https://via.placeholder.com/150',
      category: 'Meat',
    },
    {
      id: '3',
      name: 'Fresh Vegetables Mix',
      price: 8.99,
      image: 'https://via.placeholder.com/150',
      category: 'Vegetables',
    },
  ];

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productPrice}>${item.price}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddToCart(item)}
        >
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b35" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#ff6b35" />
      
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.headerTitle}>TheFox Market</Text>
        <View style={styles.cartBadge}>
          <Text style={styles.cartCount}>{cartCount}</Text>
        </View>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  header: {
    backgroundColor: '#ff6b35',
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  cartBadge: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  productList: {
    padding: 16,
  },
  productCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#ff6b35',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
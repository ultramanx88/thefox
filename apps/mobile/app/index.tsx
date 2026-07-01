import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import type { Product } from '@thefox/shared';
import { getProducts } from '../src/api/products';
import { useCartStore } from '../src/store/cart';

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);

  const cartCount = items.reduce((total, item) => total + item.quantity, 0);
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('th');
    return query
      ? products.filter((product) =>
          product.name.toLocaleLowerCase('th').includes(query)
        )
      : products;
  }, [products, search]);

  async function loadProducts(signal?: AbortSignal) {
    try {
      setError(null);
      setProducts(await getProducts(signal));
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === 'AbortError') {
        return;
      }
      setError('เชื่อมต่อรายการสินค้าไม่ได้ กรุณาตรวจสอบว่า API เปิดอยู่');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadProducts(controller.signal);
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e11d48" />
        <Text style={styles.muted}>กำลังโหลดสินค้า...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredProducts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void loadProducts();
          }}
          tintColor="#e11d48"
        />
      }
      ListHeaderComponent={
        <View>
          <View style={styles.summary}>
            <View>
              <Text style={styles.kicker}>ตลาดสดออนไลน์</Text>
              <Text style={styles.title}>ของสด ส่งถึงมือ</Text>
            </View>
            <View style={styles.cart}>
              <Text style={styles.cartIcon}>🛒</Text>
              <Text style={styles.cartCount}>{cartCount}</Text>
            </View>
          </View>

          <View style={styles.search}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="ค้นหาสินค้า"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {error ? (
            <View style={styles.error}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => void loadProducts()}>
                <Text style={styles.retry}>ลองอีกครั้ง</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
          <View style={styles.cardBody}>
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.productFooter}>
              <View>
                <Text style={styles.price}>฿{item.price}</Text>
                <Text style={styles.muted}>ต่อ {item.unit}</Text>
              </View>
              <Pressable style={styles.addButton} onPress={() => addItem(item)}>
                <Text style={styles.addButtonText}>เพิ่ม</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>ยังไม่พบสินค้าที่ค้นหา</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#f8fafc',
    flexGrow: 1
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18
  },
  kicker: { color: '#e11d48', fontWeight: '700', marginBottom: 4 },
  title: { color: '#111827', fontSize: 28, fontWeight: '800' },
  cart: {
    minWidth: 54,
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  cartCount: { color: '#111827', fontWeight: '800' },
  cartIcon: { fontSize: 20 },
  search: {
    height: 50,
    paddingHorizontal: 14,
    marginBottom: 18,
    borderRadius: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center'
  },
  searchIcon: { color: '#9ca3af', fontSize: 24 },
  searchInput: { flex: 1, marginLeft: 10, color: '#111827', fontSize: 16 },
  error: {
    padding: 14,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff1f2'
  },
  errorText: { color: '#9f1239' },
  retry: { color: '#e11d48', fontWeight: '700', marginTop: 8 },
  card: {
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fff'
  },
  image: { width: '100%', height: 190, backgroundColor: '#e5e7eb' },
  cardBody: { padding: 16 },
  category: {
    color: '#e11d48',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4
  },
  productName: { color: '#111827', fontSize: 20, fontWeight: '800' },
  description: { color: '#6b7280', lineHeight: 20, marginTop: 6 },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16
  },
  price: { color: '#e11d48', fontSize: 22, fontWeight: '800' },
  muted: { color: '#6b7280' },
  addButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#e11d48'
  },
  addButtonText: { color: '#fff', fontWeight: '800' },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 40 }
});

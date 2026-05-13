import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Pressable, 
  Image, 
  ActivityIndicator, 
  TextInput,
  useWindowDimensions 
} from 'react-native';
import { Stack } from 'expo-router';
import { 
  Dog, 
  ShoppingCart, 
  Search, 
  User as UserIcon,
  Filter
} from 'lucide-react-native';
import { ProductService } from '../src/services/productService';
import { AuthService } from '../src/services/authService';
import { Product, UserProfile } from '../src/types';
import { useCartStore } from '../src/store/cart';

export default function Home() {
  const { width } = useWindowDimensions();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [search, setSearch] = React.useState('');
  
  const addItem = useCartStore((state) => state.addItem);
  const cartCount = useCartStore((state) => state.items.reduce((acc, item) => acc + item.quantity, 0));

  const numColumns = width > 1024 ? 4 : width > 768 ? 3 : 2;

  React.useEffect(() => {
    // Auth Listener
    const unsubAuth = AuthService.onAuthChange(async (fbUser) => {
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          displayName: fbUser.displayName,
          email: fbUser.email,
          photoURL: fbUser.photoURL,
          role: 'customer',
          createdAt: new Date().toISOString()
        });
      } else {
        setUser(null);
      }
    });

    // Product Listener
    const unsubProducts = ProductService.subscribeToProducts((data) => {
      if (data.length > 0) {
        setProducts(data);
      } else {
        // Mock fallback for first-time use
        setProducts([
          { id: '1', name: 'ผักบุ้งจีนสด', price: 25, imageUrl: 'https://picsum.photos/seed/veg1/400/300', unit: 'กำ', category: 'ผักสด', vendorId: 'v1', stock: 10, description: 'สดใหม่จากสวน' },
          { id: '2', name: 'ไข่ไก่เบอร์ 2 (30 ฟอง)', price: 125, imageUrl: 'https://picsum.photos/seed/egg/400/300', unit: 'แพ็ค', category: 'เนื้อและไข่', vendorId: 'v1', stock: 50, description: 'ไข่สดส่งตรงจากฟาร์ม' },
          { id: '3', name: 'เนื้อหมูสันนอก 1กก.', price: 185, imageUrl: 'https://picsum.photos/seed/pork/400/300', unit: 'kg', category: 'เนื้อสด', vendorId: 'v2', stock: 20, description: 'เนื้อหมูสะอาด อนามัย' },
          { id: '4', name: 'มะม่วงน้ำดอกไม้', price: 65, imageUrl: 'https://picsum.photos/seed/mango/400/300', unit: 'kg', category: 'ผลไม้', vendorId: 'v2', stock: 15, description: 'หวาน หอม อร่อย' },
          { id: '5', name: 'กุ้งแชบ๊วยสด', price: 350, imageUrl: 'https://picsum.photos/seed/shrimp/400/300', unit: 'kg', category: 'อาหารทะเล', vendorId: 'v3', stock: 5, description: 'กุ้งตัวใหญ่ สดหวาน' },
          { id: '6', name: 'ข้าวหอมมะลิ 5กก.', price: 210, imageUrl: 'https://picsum.photos/seed/rice/400/300', unit: 'ถุง', category: 'ข้าวสาร', vendorId: 'v1', stock: 100, description: 'ข้าวใหม่ ต้นฤดู' },
        ] as any);
      }
      setLoading(false);
    });

    return () => {
      unsubAuth();
      unsubProducts();
    };
  }, []);

  const handleLogin = async () => {
    await AuthService.signInWithGoogle();
  };

  const handleLogout = async () => {
    await AuthService.signOut();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={[styles.card, { width: (width - 40) / numColumns - 10 }]}>
      <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      <View style={styles.cardContent}>
        <Text style={styles.categoryBadge}>{item.category}</Text>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>฿{item.price}</Text>
          <Text style={styles.unitText}>/ {item.unit}</Text>
        </View>
        <Pressable 
          style={({ pressed }) => [
            styles.addButton,
            pressed && { opacity: 0.8 }
          ]} 
          onPress={() => addItem(item)}
        >
          <Text style={styles.addButtonText}>เพิ่ม</Text>
          <ShoppingCart color="#fff" size={16} />
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e11d48" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <Dog color="#fff" size={24} />
              <Text style={styles.headerText}>theFOX</Text>
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <View style={styles.cartBadgeContainer}>
                <ShoppingCart color="#fff" size={24} />
                {cartCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartCount}</Text>
                  </View>
                )}
              </View>
              {user ? (
                <Pressable onPress={handleLogout} style={styles.userIcon}>
                  <Image source={{ uri: user.photoURL || undefined }} style={styles.avatar} />
                </Pressable>
              ) : (
                <Pressable onPress={handleLogin} style={styles.userIcon}>
                  <UserIcon color="#fff" size={24} />
                </Pressable>
              )}
            </View>
          )
        }} 
      />

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns} // Force re-render when columns change
        ListHeaderComponent={
          <>
            <View style={styles.searchBarContainer}>
              <View style={styles.searchBar}>
                <Search color="#9ca3af" size={20} />
                <TextInput 
                  style={styles.searchInput}
                  placeholder="ค้นหาสินค้าตลาดสด..."
                  value={search}
                  onChangeText={setSearch}
                />
                <Filter color="#e11d48" size={20} />
              </View>
            </View>

            <View style={styles.heroBanner}>
              <Text style={styles.heroTitle}>ตลาดสด...ส่งถึงมือ</Text>
              <Text style={styles.heroSubtitle}>สินค้าคุณภาพจากร้านค้าที่คนในพื้นที่ไว้วางใจ</Text>
            </View>
            
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>รายการสินค้าสดใหม่</Text>
              <Text style={styles.sectionTotal}>{filteredProducts.length} รายการ</Text>
            </View>
          </>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flexDirection: 'row', alignItems: 'center' },
  headerText: { color: '#fff', fontSize: 20, fontWeight: '800', marginLeft: 8, letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  cartBadgeContainer: { marginRight: 15, position: 'relative' },
  badge: { position: 'absolute', top: -5, right: -10, backgroundColor: '#fbbf24', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  userIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  searchBarContainer: { backgroundColor: '#e11d48', paddingHorizontal: 20, paddingBottom: 20 },
  searchBar: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 48, alignItems: 'center', elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1f2937' },
  heroBanner: { padding: 30, backgroundColor: '#fff' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#111827' },
  heroSubtitle: { fontSize: 16, color: '#6b7280', marginTop: 8 },
  sectionHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  sectionTotal: { fontSize: 14, color: '#6b7280' },
  listContent: { paddingBottom: 40 },
  card: { backgroundColor: '#fff', margin: 5, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4, overflow: 'hidden' },
  productImage: { width: '100%', height: 160 },
  cardContent: { padding: 15 },
  categoryBadge: { fontSize: 10, color: '#e11d48', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  productName: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 8 },
  productPrice: { fontSize: 22, color: '#e11d48', fontWeight: '800' },
  unitText: { fontSize: 14, color: '#9ca3af', marginLeft: 4 },
  addButton: { backgroundColor: '#e11d48', flexDirection: 'row', height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 }
});


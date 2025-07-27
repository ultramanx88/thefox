import { View, StyleSheet } from 'react-native';
import { CategoryList } from '@/components/CategoryList';
import type { Category } from '@repo/api';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function CategoriesScreen() {
  const router = useRouter();

  const handleCategorySelect = (category: Category) => {
    console.log('Selected category:', category);
    // ตัวอย่าง: Navigate ไปยังหน้าสินค้าของ Category ที่เลือก
    router.push(`/products?categoryId=${category.id}&categoryName=${category.name}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Categories' }} />
      <CategoryList
        onCategorySelect={handleCategorySelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
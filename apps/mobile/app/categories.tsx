import { View, Text, StyleSheet } from 'react-native';
import { CategoryList } from '../src/components/CategoryList';
import type { Category } from '@repo/api';

export default function CategoriesScreen() {
  const handleCategorySelect = (category: Category) => {
    console.log('Selected category:', category);
    // Navigate to products or markets for this category
  };

  return (
    <View style={styles.container}>
      <CategoryList 
        onCategorySelect={handleCategorySelect}
        showSubcategories={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
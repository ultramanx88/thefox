import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useCategories, useCategoryTree, firebaseApi } from '@repo/api';
import type { Category, CategoryTree } from '@repo/api';

interface CategoryListProps {
  onCategorySelect?: (category: Category) => void;
  showSubcategories?: boolean;
}

export function CategoryList({ onCategorySelect, showSubcategories = true }: CategoryListProps) {
  const { categories, loading, error, refetch } = useCategories(true, true);
  const { categoryTree, loading: treeLoading } = useCategoryTree();
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);

  // Initialize default categories on first load
  useEffect(() => {
    const initializeCategories = async () => {
      if (categories.length === 0 && !loading) {
        try {
          await firebaseApi.categories.initializeDefaultCategories();
          refetch();
        } catch (error) {
          console.error('Failed to initialize categories:', error);
        }
      }
    };

    initializeCategories();
  }, [categories.length, loading, refetch]);

  const renderMainCategory = ({ item }: { item: CategoryTree }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        { backgroundColor: item.color + '20' }
      ]}
      onPress={() => {
        if (showSubcategories && item.children && item.children.length > 0) {
          setSelectedMainCategory(selectedMainCategory === item.id ? null : item.id);
        } else {
          onCategorySelect?.(item);
        }
      }}
    >
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryIcon}>{item.icon}</Text>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryNameEn}>{item.nameEn}</Text>
          {item.description && (
            <Text style={styles.categoryDescription}>{item.description}</Text>
          )}
        </View>
        {showSubcategories && item.children && item.children.length > 0 && (
          <Text style={styles.expandIcon}>
            {selectedMainCategory === item.id ? '▼' : '▶'}
          </Text>
        )}
      </View>
      
      {/* Subcategories */}
      {showSubcategories && selectedMainCategory === item.id && item.children && (
        <View style={styles.subcategoriesContainer}>
          {item.children.map((subCategory) => (
            <TouchableOpacity
              key={subCategory.id}
              style={styles.subcategoryItem}
              onPress={() => onCategorySelect?.(subCategory)}
            >
              <Text style={styles.subcategoryIcon}>{subCategory.icon}</Text>
              <View style={styles.subcategoryInfo}>
                <Text style={styles.subcategoryName}>{subCategory.name}</Text>
                <Text style={styles.subcategoryNameEn}>{subCategory.nameEn}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSimpleCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.simpleCategoryCard,
        { borderLeftColor: item.color }
      ]}
      onPress={() => onCategorySelect?.(item)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryNameEn}>{item.nameEn}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading || treeLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b35" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showSubcategories ? (
        <FlatList
          data={categoryTree}
          renderItem={renderMainCategory}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <FlatList
          data={categories}
          renderItem={renderSimpleCategory}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

export function CategoryGrid({ onCategorySelect }: { onCategorySelect?: (category: Category) => void }) {
  const { categories, loading, error } = useCategories(true);

  const renderCategoryGrid = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.gridItem,
        { backgroundColor: item.color + '20' }
      ]}
      onPress={() => onCategorySelect?.(item)}
    >
      <Text style={styles.gridIcon}>{item.icon}</Text>
      <Text style={styles.gridName}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b35" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading categories</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={categories.filter(cat => cat.level === 0)} // Only main categories for grid
      renderItem={renderCategoryGrid}
      keyExtractor={(item) => item.id}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.gridContainer}
    />
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
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  categoryNameEn: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  expandIcon: {
    fontSize: 16,
    color: '#666',
  },
  subcategoriesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 12,
  },
  subcategoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  subcategoryInfo: {
    flex: 1,
  },
  subcategoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  subcategoryNameEn: {
    fontSize: 12,
    color: '#666',
  },
  simpleCategoryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  gridContainer: {
    padding: 16,
  },
  gridItem: {
    flex: 1,
    margin: 6,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  gridIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
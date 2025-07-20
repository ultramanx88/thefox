import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryGrid } from '../src/components/CategoryList';

export default function HomeTab() {
  const handleCategorySelect = (category: any) => {
    console.log('Selected category:', category);
    // Navigate to category products or markets
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning! 👋</Text>
        <Text style={styles.subtitle}>What would you like to order today?</Text>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="search" size={24} color="#ff6b35" />
            <Text style={styles.actionText}>Browse Markets</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="camera" size={24} color="#ff6b35" />
            <Text style={styles.actionText}>Scan QR Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="location" size={24} color="#ff6b35" />
            <Text style={styles.actionText}>Find Nearby</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="heart" size={24} color="#ff6b35" />
            <Text style={styles.actionText}>Favorites</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoriesContainer}>
          <CategoryGrid onCategorySelect={handleCategorySelect} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Markets</Text>
        <View style={styles.marketCard}>
          <Text style={styles.marketName}>Fresh Market Central</Text>
          <Text style={styles.marketDescription}>
            Fresh vegetables, fruits, and local products
          </Text>
          <Text style={styles.marketDistance}>📍 2.5 km away</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  quickActions: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  marketCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
  },
  marketName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  marketDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  marketDistance: {
    fontSize: 12,
    color: '#ff6b35',
  },
  categoriesContainer: {
    height: 200,
    marginTop: 8,
  },
});
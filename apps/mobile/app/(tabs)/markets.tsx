import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const markets = [
  {
    id: '1',
    name: 'Fresh Market Central',
    description: 'Fresh vegetables, fruits, and local products',
    distance: '2.5 km',
    rating: 4.8,
    isOpen: true,
  },
  {
    id: '2',
    name: 'Organic Farm Market',
    description: 'Certified organic produce and dairy',
    distance: '3.2 km',
    rating: 4.9,
    isOpen: true,
  },
  {
    id: '3',
    name: 'Local Seafood Market',
    description: 'Fresh seafood and marine products',
    distance: '4.1 km',
    rating: 4.6,
    isOpen: false,
  },
];

export default function MarketsTab() {
  const renderMarket = ({ item }: { item: typeof markets[0] }) => (
    <TouchableOpacity style={styles.marketCard}>
      <View style={styles.marketHeader}>
        <Text style={styles.marketName}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.isOpen ? '#4CAF50' : '#f44336' }]}>
          <Text style={styles.statusText}>{item.isOpen ? 'Open' : 'Closed'}</Text>
        </View>
      </View>
      
      <Text style={styles.marketDescription}>{item.description}</Text>
      
      <View style={styles.marketFooter}>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>{item.rating}</Text>
        </View>
        <Text style={styles.distance}>📍 {item.distance}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Local Markets</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#ff6b35" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={markets}
        renderItem={renderMarket}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
  },
  marketCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
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
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  marketName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  marketDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  marketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  distance: {
    fontSize: 12,
    color: '#ff6b35',
  },
});
interface Store {
  id: string;
  name: string;
  type: 'flagship' | 'branch' | 'franchise' | 'warehouse';
  status: 'active' | 'inactive' | 'maintenance' | 'closed';
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
    city: string;
    state: string;
    zipCode: string;
  };
  contact: {
    phone: string;
    email: string;
    manager: string;
  };
  operatingHours: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  capacity: {
    maxOrders: number;
    currentOrders: number;
    staff: number;
    deliveryRadius: number;
  };
  inventory: {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    lastUpdated: string;
  };
  performance: {
    dailyRevenue: number;
    monthlyRevenue: number;
    orderCount: number;
    averageRating: number;
    deliveryTime: number;
  };
  features: {
    hasDelivery: boolean;
    hasPickup: boolean;
    hasDineIn: boolean;
    acceptsOnlineOrders: boolean;
    hasKitchen: boolean;
  };
}

interface StoreGroup {
  id: string;
  name: string;
  description: string;
  stores: string[];
  manager: string;
  region: string;
}

export class StoreManager {
  private stores: Store[] = [
    {
      id: 'store_001',
      name: 'TheFox Downtown Flagship',
      type: 'flagship',
      status: 'active',
      location: {
        address: '100 Main Street, Boston, MA 02101',
        coordinates: { lat: 42.3601, lng: -71.0589 },
        city: 'Boston',
        state: 'MA',
        zipCode: '02101'
      },
      contact: {
        phone: '+1-617-555-0100',
        email: 'downtown@thefox.com',
        manager: 'Sarah Johnson'
      },
      operatingHours: {
        monday: { open: '07:00', close: '22:00' },
        tuesday: { open: '07:00', close: '22:00' },
        wednesday: { open: '07:00', close: '22:00' },
        thursday: { open: '07:00', close: '22:00' },
        friday: { open: '07:00', close: '23:00' },
        saturday: { open: '08:00', close: '23:00' },
        sunday: { open: '08:00', close: '21:00' }
      },
      capacity: {
        maxOrders: 200,
        currentOrders: 145,
        staff: 25,
        deliveryRadius: 15
      },
      inventory: {
        totalItems: 450,
        lowStockItems: 12,
        outOfStockItems: 3,
        lastUpdated: new Date().toISOString()
      },
      performance: {
        dailyRevenue: 8500,
        monthlyRevenue: 185000,
        orderCount: 89,
        averageRating: 4.7,
        deliveryTime: 28
      },
      features: {
        hasDelivery: true,
        hasPickup: true,
        hasDineIn: true,
        acceptsOnlineOrders: true,
        hasKitchen: true
      }
    },
    {
      id: 'store_002',
      name: 'TheFox Cambridge Branch',
      type: 'branch',
      status: 'active',
      location: {
        address: '250 Harvard Street, Cambridge, MA 02138',
        coordinates: { lat: 42.3736, lng: -71.1097 },
        city: 'Cambridge',
        state: 'MA',
        zipCode: '02138'
      },
      contact: {
        phone: '+1-617-555-0200',
        email: 'cambridge@thefox.com',
        manager: 'Mike Chen'
      },
      operatingHours: {
        monday: { open: '08:00', close: '21:00' },
        tuesday: { open: '08:00', close: '21:00' },
        wednesday: { open: '08:00', close: '21:00' },
        thursday: { open: '08:00', close: '21:00' },
        friday: { open: '08:00', close: '22:00' },
        saturday: { open: '09:00', close: '22:00' },
        sunday: { open: '09:00', close: '20:00' }
      },
      capacity: {
        maxOrders: 120,
        currentOrders: 78,
        staff: 15,
        deliveryRadius: 10
      },
      inventory: {
        totalItems: 320,
        lowStockItems: 8,
        outOfStockItems: 1,
        lastUpdated: new Date().toISOString()
      },
      performance: {
        dailyRevenue: 5200,
        monthlyRevenue: 112000,
        orderCount: 56,
        averageRating: 4.5,
        deliveryTime: 32
      },
      features: {
        hasDelivery: true,
        hasPickup: true,
        hasDineIn: false,
        acceptsOnlineOrders: true,
        hasKitchen: true
      }
    },
    {
      id: 'store_003',
      name: 'TheFox Warehouse Hub',
      type: 'warehouse',
      status: 'active',
      location: {
        address: '500 Industrial Drive, Somerville, MA 02143',
        coordinates: { lat: 42.3875, lng: -71.0995 },
        city: 'Somerville',
        state: 'MA',
        zipCode: '02143'
      },
      contact: {
        phone: '+1-617-555-0300',
        email: 'warehouse@thefox.com',
        manager: 'David Rodriguez'
      },
      operatingHours: {
        monday: { open: '05:00', close: '20:00' },
        tuesday: { open: '05:00', close: '20:00' },
        wednesday: { open: '05:00', close: '20:00' },
        thursday: { open: '05:00', close: '20:00' },
        friday: { open: '05:00', close: '20:00' },
        saturday: { open: '06:00', close: '18:00' },
        sunday: { closed: true, open: '', close: '' }
      },
      capacity: {
        maxOrders: 500,
        currentOrders: 0,
        staff: 35,
        deliveryRadius: 50
      },
      inventory: {
        totalItems: 1200,
        lowStockItems: 25,
        outOfStockItems: 8,
        lastUpdated: new Date().toISOString()
      },
      performance: {
        dailyRevenue: 0,
        monthlyRevenue: 0,
        orderCount: 0,
        averageRating: 0,
        deliveryTime: 0
      },
      features: {
        hasDelivery: false,
        hasPickup: false,
        hasDineIn: false,
        acceptsOnlineOrders: false,
        hasKitchen: false
      }
    }
  ];

  private storeGroups: StoreGroup[] = [
    {
      id: 'group_001',
      name: 'Boston Metro Area',
      description: 'All stores in Greater Boston area',
      stores: ['store_001', 'store_002'],
      manager: 'Regional Manager - Boston',
      region: 'Northeast'
    },
    {
      id: 'group_002',
      name: 'Distribution Centers',
      description: 'Warehouse and distribution facilities',
      stores: ['store_003'],
      manager: 'Operations Manager',
      region: 'Northeast'
    }
  ];

  getAllStores(): Store[] {
    return this.stores;
  }

  getStoreById(storeId: string): Store | undefined {
    return this.stores.find(store => store.id === storeId);
  }

  getStoresByType(type: Store['type']): Store[] {
    return this.stores.filter(store => store.type === type);
  }

  getActiveStores(): Store[] {
    return this.stores.filter(store => store.status === 'active');
  }

  getStoresByLocation(city: string): Store[] {
    return this.stores.filter(store => store.location.city.toLowerCase() === city.toLowerCase());
  }

  updateStoreStatus(storeId: string, status: Store['status']): boolean {
    const store = this.getStoreById(storeId);
    if (store) {
      store.status = status;
      return true;
    }
    return false;
  }

  updateStoreCapacity(storeId: string, currentOrders: number): boolean {
    const store = this.getStoreById(storeId);
    if (store) {
      store.capacity.currentOrders = currentOrders;
      return true;
    }
    return false;
  }

  getStorePerformance(): Array<{ storeId: string; name: string; performance: Store['performance'] }> {
    return this.stores.map(store => ({
      storeId: store.id,
      name: store.name,
      performance: store.performance
    }));
  }

  getStoreGroups(): StoreGroup[] {
    return this.storeGroups;
  }

  getStoresInGroup(groupId: string): Store[] {
    const group = this.storeGroups.find(g => g.id === groupId);
    if (!group) return [];
    
    return group.stores.map(storeId => this.getStoreById(storeId)).filter(Boolean) as Store[];
  }

  findNearestStore(coordinates: { lat: number; lng: number }): Store | null {
    const activeStores = this.getActiveStores().filter(store => store.features.acceptsOnlineOrders);
    
    if (activeStores.length === 0) return null;

    let nearestStore = activeStores[0];
    let minDistance = this.calculateDistance(coordinates, nearestStore.location.coordinates);

    for (const store of activeStores.slice(1)) {
      const distance = this.calculateDistance(coordinates, store.location.coordinates);
      if (distance < minDistance) {
        minDistance = distance;
        nearestStore = store;
      }
    }

    return minDistance <= nearestStore.capacity.deliveryRadius ? nearestStore : null;
  }

  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  getStoreAnalytics() {
    const totalStores = this.stores.length;
    const activeStores = this.getActiveStores().length;
    const totalRevenue = this.stores.reduce((sum, store) => sum + store.performance.dailyRevenue, 0);
    const totalOrders = this.stores.reduce((sum, store) => sum + store.performance.orderCount, 0);
    const averageRating = this.stores.reduce((sum, store) => sum + store.performance.averageRating, 0) / totalStores;

    return {
      totalStores,
      activeStores,
      totalRevenue,
      totalOrders,
      averageRating: averageRating.toFixed(1),
      storeTypes: {
        flagship: this.getStoresByType('flagship').length,
        branch: this.getStoresByType('branch').length,
        franchise: this.getStoresByType('franchise').length,
        warehouse: this.getStoresByType('warehouse').length
      }
    };
  }
}
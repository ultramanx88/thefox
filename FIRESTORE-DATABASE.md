# Firestore Database Configuration

This document explains the Firestore database setup, security rules, indexes, and usage patterns for the theFOX application.

## 🏗️ Database Structure

### Collections Overview

```
thefox-firestore/
├── users/                    # User profiles and authentication data
├── markets/                  # Market/vendor information
├── products/                 # Product catalog
├── orders/                   # Order management
├── categories/               # Product categories
├── serviceAreas/             # Delivery service areas
├── notifications/            # User notifications
├── reviews/                  # Market and product reviews
├── deliveries/               # Delivery tracking
├── analytics/                # Analytics data (admin only)
└── settings/                 # System settings (admin only)
```

## 🔒 Security Rules

### Rule Structure

Our Firestore security rules implement:

- **Role-based access control** (customer, vendor, driver, admin)
- **Data validation** for all document types
- **Ownership verification** for user-specific data
- **Public read access** for browsable content
- **Comprehensive error handling**

### Key Security Features

1. **User Authentication Required**: Most operations require authentication
2. **Role-Based Permissions**: Different roles have different access levels
3. **Data Validation**: All writes are validated for required fields and data types
4. **Ownership Checks**: Users can only access their own data
5. **Admin Override**: Admins have elevated permissions for management

### Example Rules

```javascript
// Users can only read/write their own data
match /users/{userId} {
  allow read, write: if isAuthenticated() && isOwner(userId);
  allow read: if isAuthenticated() && hasRole('admin');
}

// Public read access for markets, restricted write access
match /markets/{marketId} {
  allow read: if true;
  allow write: if isAuthenticated() && 
    (isOwner(resource.data.ownerId) || hasRole('admin'));
}
```

## 📊 Database Indexes

### Optimized Query Patterns

Our indexes are designed for common query patterns:

1. **User Queries**
   - By role and creation date
   - By email (for authentication)

2. **Market Queries**
   - By open status and rating
   - By category and location
   - By owner and creation date

3. **Product Queries**
   - By market and stock status
   - By category and rating
   - By price range

4. **Order Queries**
   - By user and creation date
   - By market and status
   - By driver and status

5. **Notification Queries**
   - By user and read status
   - By user and type

### Index Examples

```json
{
  "collectionGroup": "products",
  "fields": [
    {"fieldPath": "marketId", "order": "ASCENDING"},
    {"fieldPath": "inStock", "order": "ASCENDING"},
    {"fieldPath": "rating", "order": "DESCENDING"}
  ]
}
```

## 🔧 Database Service

### FirestoreService Class

The `FirestoreService` class provides:

- **Generic CRUD operations** for all collections
- **Specialized query methods** for common patterns
- **Real-time listeners** for live updates
- **Offline support** with automatic sync
- **Batch operations** for efficiency

### Usage Examples

```typescript
import { firestoreService, COLLECTIONS } from '@/packages/api/src/firebase/database';

// Create a new user
const userId = await firestoreService.create<User>(COLLECTIONS.USERS, {
  email: 'user@example.com',
  name: 'John Doe',
  role: 'customer'
});

// Get user by email
const user = await firestoreService.getUserByEmail('user@example.com');

// Get open markets
const markets = await firestoreService.getOpenMarkets();

// Listen to order changes
const unsubscribe = firestoreService.onDocumentChange<Order>(
  COLLECTIONS.ORDERS,
  orderId,
  (order) => {
    console.log('Order updated:', order);
  }
);
```

## ⚛️ React Hooks

### Available Hooks

1. **Generic Hooks**
   - `useFirestoreDocument<T>` - Single document with real-time updates
   - `useFirestoreCollection<T>` - Collection queries with real-time updates

2. **Specialized Hooks**
   - `useUser(userId)` - User profile data
   - `useMarket(marketId)` - Market information
   - `useOrdersByUser(userId)` - User's orders
   - `useNotificationsByUser(userId)` - User notifications

### Hook Examples

```typescript
import { useUser, useOrdersByUser, useOpenMarkets } from '@/hooks/useFirestore';

function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error, updateDocument } = useUser(userId);
  const { data: orders } = useOrdersByUser(userId);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>{user?.name}</h1>
      <p>Orders: {orders.length}</p>
    </div>
  );
}
```

## 🧪 Testing

### Test Scripts

1. **Basic Connection Test**
   ```bash
   npm run firebase:test:firestore
   ```

2. **Security Rules Testing**
   ```bash
   firebase emulators:exec "npm run test:security"
   ```

3. **Performance Testing**
   ```bash
   npm run test:firestore:performance
   ```

### Test Coverage

Our tests cover:
- ✅ CRUD operations for all collections
- ✅ Query performance with indexes
- ✅ Real-time listener functionality
- ✅ Offline support and sync
- ✅ Data validation rules
- ⚠️ Security rules (requires additional setup)

## 🚀 Deployment

### Deploy Rules and Indexes

```bash
# Deploy security rules
npm run firebase:deploy:firestore:rules

# Deploy indexes
npm run firebase:deploy:firestore:indexes

# Deploy both
npm run firebase:deploy:firestore
```

### Environment-Specific Deployment

```bash
# Staging
firebase use staging
npm run firebase:deploy:firestore

# Production
firebase use production
npm run firebase:deploy:firestore
```

## 📈 Performance Optimization

### Best Practices

1. **Query Optimization**
   - Use indexes for all compound queries
   - Limit query results appropriately
   - Use pagination for large datasets

2. **Real-time Listeners**
   - Unsubscribe when components unmount
   - Use specific queries to reduce bandwidth
   - Implement proper error handling

3. **Offline Support**
   - Enable persistence for better UX
   - Handle offline scenarios gracefully
   - Implement conflict resolution

4. **Data Structure**
   - Denormalize data for read performance
   - Use subcollections for hierarchical data
   - Implement proper data validation

### Performance Monitoring

```typescript
// Enable performance monitoring
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Monitor connection status
const monitorConnection = () => {
  // Implementation for connection monitoring
};
```

## 🔍 Troubleshooting

### Common Issues

1. **Permission Denied**
   ```
   Error: Missing or insufficient permissions
   ```
   **Solution**: Check security rules and user authentication

2. **Index Not Found**
   ```
   Error: The query requires an index
   ```
   **Solution**: Create the required index in `firestore.indexes.json`

3. **Offline Sync Issues**
   ```
   Error: Failed to sync offline changes
   ```
   **Solution**: Check network connectivity and retry logic

### Debug Commands

```bash
# Check security rules
firebase firestore:rules:get

# List indexes
firebase firestore:indexes

# View logs
firebase functions:log

# Test with emulator
firebase emulators:start --only firestore
```

## 📚 Data Models

### Core Entities

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'vendor' | 'driver' | 'admin';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Market {
  id: string;
  name: string;
  ownerId: string;
  location: { latitude: number; longitude: number };
  isOpen: boolean;
  rating: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Order {
  id: string;
  userId: string;
  marketId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 🔄 Real-time Features

### Live Updates

- **Order Status**: Real-time order tracking
- **Market Availability**: Live market open/close status
- **Notifications**: Instant notification delivery
- **Delivery Tracking**: Live driver location updates

### Implementation

```typescript
// Real-time order tracking
const useOrderTracking = (orderId: string) => {
  const [order, setOrder] = useState<Order | null>(null);
  
  useEffect(() => {
    const unsubscribe = firestoreService.onDocumentChange<Order>(
      COLLECTIONS.ORDERS,
      orderId,
      setOrder
    );
    
    return unsubscribe;
  }, [orderId]);
  
  return order;
};
```

## 🎯 Next Steps

After completing Firestore configuration:

1. ✅ Security rules deployed
2. ✅ Indexes optimized
3. ✅ Database service implemented
4. ✅ React hooks created
5. 🔄 Setup Firebase Storage (Task 3)
6. 🔄 Deploy Cloud Functions (Task 4)
7. 🔄 Implement real-time sync (Task 5)

---

For more information, see:
- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Reference](https://firebase.google.com/docs/firestore/security/rules-structure)
- [Query Optimization Guide](https://firebase.google.com/docs/firestore/query-data/queries)
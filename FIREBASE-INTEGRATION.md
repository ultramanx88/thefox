# 🔥 Firebase Integration Guide

คู่มือการใช้งาน Firebase services ใน theFOX monorepo

## 🎯 Firebase Services ที่เชื่อมต่อแล้ว

### ✅ Firebase Authentication
- Email/Password authentication
- User profile management
- Token-based API authentication
- Real-time auth state changes

### ✅ Cloud Firestore
- Real-time database
- CRUD operations
- Query and filtering
- Real-time listeners
- Offline support

### ✅ Cloud Storage
- File upload/download
- Image compression
- Progress tracking
- Multiple file uploads

### ✅ Cloud Functions
- Serverless backend logic
- Payment processing
- Push notifications
- AI-powered features

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Add your Firebase configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=thefox-sp7zz
# ... other config
```

### 2. Install Dependencies
```bash
# Already included in packages/api
npm install
```

### 3. Initialize Firebase
```typescript
import { firebaseApi } from '@repo/api';

// Firebase is auto-initialized when imported
```

## 📱 Usage Examples

### Authentication
```typescript
import { useAuth, firebaseApi } from '@repo/api';

function LoginComponent() {
  const { user, loading, signIn, signOut } = useAuth();

  const handleLogin = async () => {
    try {
      await signIn('user@example.com', 'password');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.displayName}!</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Sign In</button>
      )}
    </div>
  );
}
```

### Firestore Data
```typescript
import { useFirestoreCollection, firebaseApi } from '@repo/api';

function MarketsComponent() {
  const { data: markets, loading, error } = useFirestoreCollection(
    'markets',
    [{ field: 'isOpen', operator: '==', value: true }],
    'name',
    'asc',
    true // real-time updates
  );

  if (loading) return <div>Loading markets...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {markets?.map(market => (
        <div key={market.id}>
          <h3>{market.name}</h3>
          <p>{market.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### File Upload
```typescript
import { firebaseApi } from '@repo/api';

function ImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await firebaseApi.storage.uploadFile(
        file,
        `products/${Date.now()}_${file.name}`,
        (progress) => setProgress(progress.progress)
      );
      console.log('Upload successful:', url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        disabled={uploading}
      />
      {uploading && <div>Progress: {progress.toFixed(1)}%</div>}
    </div>
  );
}
```

### Cloud Functions
```typescript
import { firebaseApi } from '@repo/api';

async function createOrder() {
  try {
    const result = await firebaseApi.functions.processPayment({
      orderId: 'order-123',
      amount: 500,
      paymentMethod: 'credit_card',
      paymentDetails: { /* ... */ }
    });
    console.log('Payment processed:', result);
  } catch (error) {
    console.error('Payment failed:', error);
  }
}
```

## 🏗️ Architecture

### Shared API Package
```
packages/api/
├── src/
│   ├── firebase/
│   │   ├── config.ts          # Firebase initialization
│   │   ├── auth.ts            # Authentication service
│   │   ├── firestore.ts       # Firestore service
│   │   ├── storage.ts         # Storage service
│   │   ├── functions.ts       # Functions service
│   │   └── index.ts           # Exports
│   ├── hooks/
│   │   ├── useAuth.ts         # Auth hook
│   │   ├── useFirestore.ts    # Firestore hooks
│   │   └── index.ts           # Hook exports
│   ├── firebase-endpoints.ts  # Firebase API endpoints
│   └── index.ts               # Main exports
```

### Platform Integration
- **Web App**: Direct Firebase SDK usage
- **Mobile App**: Firebase SDK with React Native
- **Shared Logic**: Common API layer

## 🔧 Configuration

### Firebase Project Setup
1. Create Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Set up Storage bucket
5. Deploy Cloud Functions

### Security Rules

#### Firestore Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Markets are readable by all, writable by owners
    match /markets/{marketId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.ownerId || 
         hasRole('admin'));
    }
    
    // Products are readable by all, writable by market owners
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.uid == getMarketOwner(resource.data.marketId) || 
         hasRole('admin'));
    }
    
    // Orders are readable/writable by order owner and market owner
    match /orders/{orderId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == getMarketOwner(resource.data.marketId) ||
         hasRole('admin'));
    }
    
    function hasRole(role) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    
    function getMarketOwner(marketId) {
      return get(/databases/$(database)/documents/markets/$(marketId)).data.ownerId;
    }
  }
}
```

#### Storage Rules
```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User avatars
    match /users/{userId}/avatar/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Market images
    match /markets/{marketId}/images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.uid == getMarketOwner(marketId);
    }
    
    // Product images
    match /markets/{marketId}/products/{productId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.uid == getMarketOwner(marketId);
    }
  }
}
```

## 📊 Data Models

### User Document
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar?: string;
  role: 'customer' | 'vendor' | 'driver' | 'admin';
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}
```

### Market Document
```typescript
interface Market {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  address: string;
  location: { lat: number; lng: number };
  categories: string[];
  isOpen: boolean;
  openingHours: { open: string; close: string };
  rating: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Order Document
```typescript
interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  marketId: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'cancelled';
  totalAmount: number;
  deliveryAddress: Address;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}
```

## 🚀 Deployment

### Environment Variables
```bash
# Production
NEXT_PUBLIC_FIREBASE_API_KEY=prod-api-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=thefox-sp7zz

# Staging
NEXT_PUBLIC_FIREBASE_API_KEY=staging-api-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=thefox-staging
```

### Build Process
```bash
# Build with Firebase integration
npm run build:all

# Deploy functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy storage rules
firebase deploy --only storage
```

## 🔍 Testing

### Unit Tests
```typescript
import { FirestoreService } from '@repo/api';

describe('FirestoreService', () => {
  test('should create document', async () => {
    const id = await FirestoreService.create('test', { name: 'Test' });
    expect(id).toBeDefined();
  });
});
```

### Integration Tests
```typescript
import { firebaseApi } from '@repo/api';

describe('Firebase Integration', () => {
  test('should authenticate user', async () => {
    const result = await firebaseApi.auth.login({
      email: 'test@example.com',
      password: 'password'
    });
    expect(result.user).toBeDefined();
  });
});
```

## 🚨 Troubleshooting

### Common Issues

#### Firebase Not Initialized
```typescript
// Make sure to import Firebase config
import '@repo/api/firebase/config';
```

#### Authentication Errors
```typescript
// Check if user is authenticated
const user = FirebaseAuthService.getCurrentUser();
if (!user) {
  // Redirect to login
}
```

#### Firestore Permission Denied
```javascript
// Check Firestore security rules
// Ensure user has proper permissions
```

#### Storage Upload Fails
```typescript
// Check file size and format
// Verify storage rules
// Check network connection
```

## 📈 Performance Tips

1. **Use Real-time Listeners Wisely**: Only for data that needs real-time updates
2. **Implement Pagination**: For large collections
3. **Cache Data**: Use React Query or SWR with Firebase
4. **Optimize Images**: Compress before upload
5. **Bundle Splitting**: Load Firebase services on demand

## 🔐 Security Best Practices

1. **Never expose API keys** in client-side code
2. **Use Firestore Security Rules** properly
3. **Validate data** on both client and server
4. **Implement rate limiting** in Cloud Functions
5. **Monitor usage** and set up alerts

Firebase integration ให้ความสามารถ real-time, scalable, และ secure สำหรับ theFOX marketplace! 🔥
# Design Document

## Overview

การออกแบบระบบเชื่อมต่อ Firebase services ให้ทำงานได้จริงสำหรับแอปพลิเคชัน theFOX โดยจะครอบคลุมการตั้งค่า Firestore Database, Cloud Storage, และ Cloud Functions พร้อมทั้งระบบ authentication และ security rules ที่เหมาะสม

จากการวิเคราะห์โค้ดที่มีอยู่ พบว่าระบบมี Firebase services structure ที่ดีแล้ว แต่ยังขาดการตั้งค่าที่สมบูรณ์และการ deploy จริง

## Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │   Mobile App    │    │   Admin Panel   │
│   (Next.js)     │    │   (React)       │    │   (React)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │              API Layer                          │
         │         (packages/api/src)                      │
         └─────────────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │            Firebase Services                    │
         ├─────────────┬─────────────┬─────────────────────┤
         │  Firestore  │   Storage   │   Cloud Functions   │
         │  Database   │   (Files)   │   (Server Logic)    │
         └─────────────┴─────────────┴─────────────────────┘
```

### Firebase Services Integration
- **Authentication**: User management และ role-based access
- **Firestore**: Real-time database สำหรับ app data
- **Storage**: File uploads (images, documents)
- **Functions**: Server-side logic และ background processing
- **Analytics**: User behavior tracking
- **Messaging**: Push notifications

## Components and Interfaces

### 1. Firebase Configuration Service
```typescript
// packages/api/src/firebase/config.ts
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

interface FirebaseServices {
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
  analytics?: Analytics;
  messaging?: Messaging;
}
```

### 2. Environment Configuration
```typescript
interface EnvironmentConfig {
  development: FirebaseConfig;
  staging: FirebaseConfig;
  production: FirebaseConfig;
}
```

### 3. Database Schema Design
```typescript
// Collections Structure
interface DatabaseSchema {
  users: User[];
  markets: Market[];
  products: Product[];
  orders: Order[];
  categories: Category[];
  reviews: Review[];
  deliveries: Delivery[];
  notifications: Notification[];
  analytics: AnalyticsEvent[];
}
```

### 4. Storage Structure
```
/storage
├── users/
│   └── {userId}/
│       ├── avatar/
│       └── documents/
├── markets/
│   └── {marketId}/
│       ├── images/
│       ├── products/
│       │   └── {productId}/
│       └── documents/
├── orders/
│   └── {orderId}/
│       └── receipts/
└── system/
    ├── categories/
    └── templates/
```

### 5. Cloud Functions Architecture
```typescript
interface FunctionCategories {
  auth: {
    onUserCreate: Function;
    onUserDelete: Function;
    customClaims: Function;
  };
  orders: {
    createOrder: Function;
    updateOrderStatus: Function;
    calculateDeliveryFee: Function;
  };
  payments: {
    processPayment: Function;
    handleWebhook: Function;
    refundPayment: Function;
  };
  notifications: {
    sendNotification: Function;
    sendBulkNotification: Function;
  };
  analytics: {
    trackEvent: Function;
    generateReports: Function;
  };
}
```

## Data Models

### Core Data Models
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'vendor' | 'driver' | 'admin';
  addresses: Address[];
  preferences: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Market {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  address: string;
  location: GeoPoint;
  categories: string[];
  isOpen: boolean;
  operatingHours: OperatingHours;
  rating: number;
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Product {
  id: string;
  marketId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrls: string[];
  inStock: boolean;
  quantity?: number;
  unit: string;
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
  deliveryFee: number;
  deliveryAddress: Address;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  estimatedDeliveryTime: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Security Rules Structure
```typescript
interface SecurityRules {
  users: {
    read: 'auth.uid == resource.id || hasRole("admin")';
    write: 'auth.uid == resource.id || hasRole("admin")';
  };
  markets: {
    read: 'true'; // Public read
    write: 'auth.uid == resource.data.ownerId || hasRole("admin")';
  };
  products: {
    read: 'true'; // Public read
    write: 'isMarketOwner(resource.data.marketId) || hasRole("admin")';
  };
  orders: {
    read: 'auth.uid == resource.data.userId || isMarketOwner(resource.data.marketId) || hasRole("admin")';
    write: 'auth.uid == resource.data.userId || hasRole("admin")';
  };
}
```

## Error Handling

### Error Categories
1. **Authentication Errors**: Invalid credentials, expired tokens
2. **Authorization Errors**: Insufficient permissions
3. **Validation Errors**: Invalid data format
4. **Network Errors**: Connection issues, timeouts
5. **Quota Errors**: Firebase limits exceeded
6. **Storage Errors**: Upload failures, file not found

### Error Handling Strategy
```typescript
interface ErrorHandler {
  handleAuthError(error: AuthError): void;
  handleFirestoreError(error: FirestoreError): void;
  handleStorageError(error: StorageError): void;
  handleFunctionError(error: FunctionError): void;
  retryOperation<T>(operation: () => Promise<T>, maxRetries: number): Promise<T>;
}
```

### Offline Support
```typescript
interface OfflineStrategy {
  enablePersistence(): Promise<void>;
  handleOfflineWrites(): void;
  syncOnReconnect(): void;
  cacheStrategy: {
    firestore: 'cache-first' | 'server-first';
    storage: 'cache-with-fallback';
    functions: 'network-only';
  };
}
```

## Testing Strategy

### Unit Testing
- Firebase services mocking
- Individual function testing
- Data validation testing

### Integration Testing
- End-to-end Firebase operations
- Real-time listener testing
- File upload/download testing

### Security Testing
- Security rules validation
- Authentication flow testing
- Authorization testing

### Performance Testing
- Query optimization
- Batch operations
- Concurrent user testing

## Deployment Strategy

### Environment Setup
1. **Development**: Local emulators
2. **Staging**: Separate Firebase project
3. **Production**: Main Firebase project

### CI/CD Pipeline
```yaml
stages:
  - test
  - build
  - deploy-functions
  - deploy-firestore-rules
  - deploy-storage-rules
  - deploy-hosting
```

### Monitoring and Analytics
- Firebase Performance Monitoring
- Custom analytics events
- Error tracking and alerting
- Usage metrics and reporting

## Security Considerations

### Authentication Security
- Multi-factor authentication support
- Session management
- Token refresh handling
- Account recovery flows

### Data Security
- Field-level encryption for sensitive data
- PII data handling compliance
- Audit logging
- Data retention policies

### API Security
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

### Storage Security
- File type validation
- Size limits
- Virus scanning
- Access control lists
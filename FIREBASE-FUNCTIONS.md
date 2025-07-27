# Firebase Cloud Functions

This document explains the Cloud Functions implementation for the theFOX application, including function categories, deployment, and usage patterns.

## 🏗️ Functions Architecture

### Function Categories

```
functions/
├── src/
│   ├── auth/                 # Authentication functions
│   ├── orders/               # Order processing functions
│   ├── payments/             # Payment processing functions
│   ├── notifications/        # Notification functions
│   ├── analytics/            # Analytics and reporting functions
│   ├── utilities/            # Utility and maintenance functions
│   ├── scheduled/            # Scheduled/cron functions
│   └── index.ts             # Main exports
├── package.json
└── tsconfig.json
```

## 🔐 Authentication Functions

### User Lifecycle Management

#### `onUserCreate`
- **Trigger**: Firestore document created in `users/{userId}`
- **Purpose**: Sets up user profile and custom claims
- **Actions**:
  - Sets custom user claims based on role
  - Creates user profile in additional collections
  - Sends welcome notification

#### `onUserDelete`
- **Trigger**: Firestore document deleted from `users/{userId}`
- **Purpose**: Cleans up user-related data
- **Actions**:
  - Deletes user from Firebase Auth
  - Removes user notifications
  - Marks user orders as deleted (for audit)

### Role Management

#### `setCustomClaims`
- **Type**: Callable function (Admin only)
- **Purpose**: Sets custom claims for users
- **Parameters**: `{ userId, claims }`
- **Usage**:
  ```typescript
  const result = await setCustomClaims({ 
    userId: 'user123', 
    claims: { role: 'vendor', verified: true } 
  });
  ```

#### `verifyUserRole`
- **Type**: Callable function
- **Purpose**: Verifies and returns user role information
- **Returns**: User role, verification status, permissions

## 📦 Order Processing Functions

### Order Management

#### `createOrder`
- **Type**: Callable function
- **Purpose**: Creates new orders with validation
- **Parameters**: `{ marketId, items, deliveryAddress, paymentMethod }`
- **Validation**:
  - Market availability
  - Product stock levels
  - Price calculations
  - Delivery address

#### `updateOrderStatus`
- **Type**: Callable function
- **Purpose**: Updates order status with proper authorization
- **Parameters**: `{ orderId, status, reason, driverId }`
- **Status Flow**: `pending → confirmed → preparing → ready → delivering → delivered`

#### `calculateDeliveryFee`
- **Type**: Callable function
- **Purpose**: Calculates delivery fee based on distance
- **Parameters**: `{ marketId, deliveryAddress }`
- **Returns**: Delivery fee in THB

#### `cancelOrder`
- **Type**: Callable function
- **Purpose**: Cancels orders with proper validation
- **Rules**:
  - Customers: 15-minute cancellation window
  - Market owners: Can cancel until "delivering"
  - Admins: Can cancel anytime

### Event Handlers

#### `onOrderCreated`
- **Trigger**: New document in `orders/{orderId}`
- **Purpose**: Updates statistics and creates analytics events

## 💳 Payment Functions

### Payment Processing

#### `processPayment`
- **Type**: Callable function
- **Purpose**: Processes payments through various methods
- **Supported Methods**:
  - Credit Card
  - Bank Transfer
  - Mobile Banking
  - Cash on Delivery

#### `handlePaymentWebhook`
- **Type**: HTTP function
- **Purpose**: Handles payment gateway webhooks
- **Events**: `payment.succeeded`, `payment.failed`, `refund.succeeded`

#### `refundPayment`
- **Type**: Callable function (Admin/Market Owner)
- **Purpose**: Processes payment refunds
- **Parameters**: `{ paymentId, reason, amount }`

#### `validatePayment`
- **Type**: Callable function
- **Purpose**: Validates payment status with gateway

## 🔔 Notification Functions

### Notification Delivery

#### `sendNotification`
- **Type**: Callable function
- **Purpose**: Sends notifications to specific users
- **Channels**: Push, Email, SMS, In-app
- **Parameters**: `{ userId, title, message, type, data, channels }`

#### `sendBulkNotification`
- **Type**: Callable function (Admin only)
- **Purpose**: Sends notifications to multiple users
- **Features**:
  - Batch processing (50 users per batch)
  - User filtering
  - Delivery tracking

#### `sendOrderNotification`
- **Type**: Callable function
- **Purpose**: Sends order-specific notifications
- **Templates**: Pre-defined templates for each order status

#### `sendDeliveryNotification`
- **Type**: Callable function
- **Purpose**: Sends delivery tracking notifications
- **Types**: `assigned`, `picked_up`, `location_update`, `arriving`, `delivered`

### Event Handlers

#### `onNotificationCreated`
- **Trigger**: New document in `notifications/{notificationId}`
- **Purpose**: Automatically delivers notifications through various channels

## 📊 Analytics Functions

### Event Tracking

#### `trackEvent`
- **Type**: Callable function
- **Purpose**: Tracks custom analytics events
- **Parameters**: `{ eventName, properties, timestamp }`
- **Features**:
  - User activity tracking
  - Session management
  - Device information

### Report Generation

#### `generateDailyReport`
- **Type**: Callable function (Admin only)
- **Purpose**: Generates comprehensive daily reports
- **Includes**: Orders, revenue, users, markets, top performers

#### `generateWeeklyReport`
- **Type**: Callable function (Admin only)
- **Purpose**: Generates weekly performance reports
- **Features**: Trend analysis, weekly comparisons

#### `generateMonthlyReport`
- **Type**: Callable function (Admin only)
- **Purpose**: Generates detailed monthly analytics
- **Includes**: Growth metrics, insights, category performance

#### `calculateMetrics`
- **Type**: Callable function (Admin only)
- **Purpose**: Calculates real-time metrics
- **Time Ranges**: 1h, 24h, 7d, 30d
- **Metrics**: Orders, revenue, users, markets, performance

## 🛠️ Utility Functions

### File Management

#### `cleanupTempFiles`
- **Type**: Callable function (Admin only)
- **Purpose**: Removes temporary files older than specified hours
- **Default**: 24 hours

#### `optimizeImages`
- **Type**: Callable function
- **Purpose**: Optimizes images for better performance
- **Features**: Resize, compress, format conversion

#### `generateThumbnails`
- **Type**: Callable function
- **Purpose**: Creates thumbnail versions of images
- **Sizes**: Configurable thumbnail sizes

#### `backupData`
- **Type**: Callable function (Admin only)
- **Purpose**: Creates backups of important collections
- **Format**: JSON export to Firebase Storage

## ⏰ Scheduled Functions

### Daily Tasks

#### `dailyCleanup`
- **Schedule**: Every day at 2:00 AM (Thailand time)
- **Purpose**: Automated daily maintenance
- **Tasks**:
  - Clean temporary files (>24h old)
  - Remove old notifications (>30 days)
  - Clean expired sessions
  - Update system health metrics

### Weekly Tasks

#### `weeklyReports`
- **Schedule**: Every Monday at 6:00 AM (Thailand time)
- **Purpose**: Automated weekly report generation
- **Actions**:
  - Generate comprehensive weekly report
  - Send report to admins
  - Update weekly metrics

### Monthly Tasks

#### `monthlyAnalytics`
- **Schedule**: 1st day of month at 8:00 AM (Thailand time)
- **Purpose**: Generate monthly analytics
- **Features**:
  - Comprehensive monthly report
  - Growth analysis
  - Performance insights

## 🚀 Deployment

### Deploy All Functions
```bash
npm run firebase:deploy:functions
```

### Deploy Specific Function
```bash
firebase deploy --only functions:functionName
```

### Environment Configuration
Functions use the same environment configuration as other Firebase services:
- Development: Uses emulators
- Staging: Separate Firebase project
- Production: Main Firebase project

## 📈 Performance Optimization

### Function Configuration
```typescript
setGlobalOptions({ 
  maxInstances: 10,
  region: "asia-southeast1", // Closer to Thailand
  memory: "256MiB",
  timeoutSeconds: 60,
});
```

### Best Practices

1. **Memory Management**
   - Use appropriate memory allocation
   - Clean up resources after use
   - Avoid memory leaks in long-running functions

2. **Cold Start Optimization**
   - Keep functions warm with scheduled calls
   - Minimize initialization code
   - Use connection pooling

3. **Error Handling**
   - Comprehensive try-catch blocks
   - Proper error logging
   - Graceful degradation

4. **Security**
   - Input validation
   - Authentication checks
   - Rate limiting

## 🔍 Monitoring and Logging

### Function Logs
```bash
# View all function logs
firebase functions:log

# View specific function logs
firebase functions:log --only functionName

# Follow logs in real-time
firebase functions:log --follow
```

### Error Tracking
- All functions include comprehensive error logging
- Errors are logged with context information
- Failed operations are tracked in maintenance logs

### Performance Monitoring
- Execution time tracking
- Memory usage monitoring
- Error rate analysis
- Success rate metrics

## 🧪 Testing

### Local Testing
```bash
# Start emulators
firebase emulators:start --only functions

# Test specific function
firebase functions:shell
```

### Unit Testing
```bash
# Run function tests
npm test --prefix functions
```

### Integration Testing
- Test with Firebase emulators
- End-to-end workflow testing
- Payment webhook testing

## 🔒 Security

### Authentication
- All callable functions verify user authentication
- Role-based access control
- Custom claims validation

### Input Validation
- Comprehensive parameter validation
- SQL injection prevention
- XSS protection

### Rate Limiting
- Built-in Firebase rate limiting
- Custom rate limiting for sensitive operations
- Abuse prevention mechanisms

## 💰 Cost Optimization

### Function Pricing
- **Invocations**: $0.40/million
- **Compute Time**: $0.0000025/GB-second
- **Networking**: $0.12/GB

### Optimization Strategies

1. **Efficient Code**
   - Minimize execution time
   - Optimize memory usage
   - Use appropriate timeout values

2. **Smart Scheduling**
   - Batch operations
   - Off-peak scheduling
   - Conditional execution

3. **Resource Management**
   - Connection pooling
   - Caching strategies
   - Lazy loading

## 🔄 Function URLs

After deployment, HTTP functions get URLs:
- **handlePaymentWebhook**: `https://handlepaymentwebhook-rpezlwjita-as.a.run.app`

## 📚 Usage Examples

### Client-Side Function Calls
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Create order
const createOrder = httpsCallable(functions, 'createOrder');
const result = await createOrder({
  marketId: 'market123',
  items: [{ productId: 'prod1', quantity: 2 }],
  deliveryAddress: { /* address object */ },
  paymentMethod: 'credit_card'
});

// Send notification
const sendNotification = httpsCallable(functions, 'sendNotification');
await sendNotification({
  userId: 'user123',
  title: 'Test Notification',
  message: 'This is a test message',
  type: 'system',
  channels: ['push', 'in_app']
});
```

### Admin Functions
```typescript
// Generate daily report
const generateDailyReport = httpsCallable(functions, 'generateDailyReport');
const report = await generateDailyReport({
  date: '2024-01-15'
});

// Cleanup temp files
const cleanupTempFiles = httpsCallable(functions, 'cleanupTempFiles');
await cleanupTempFiles({
  olderThanHours: 24
});
```

## 🎯 Next Steps

After completing Cloud Functions deployment:

1. ✅ Authentication functions deployed
2. ✅ Order processing functions deployed
3. ✅ Payment functions deployed
4. ✅ Notification system deployed
5. ✅ Analytics functions deployed
6. ✅ Utility functions deployed
7. ✅ Scheduled functions deployed
8. 🔄 Implement real-time sync (Task 5)
9. 🔄 Add error handling and monitoring (Task 6)

---

For more information, see:
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Cloud Functions for Firebase](https://firebase.google.com/docs/functions/get-started)
- [Functions Samples](https://github.com/firebase/functions-samples)
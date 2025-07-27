# Firebase Configuration Guide

This guide explains how to configure Firebase for the theFOX application across different environments.

## 🏗️ Project Structure

```
thefox/
├── .firebaserc                 # Firebase project configuration
├── firebase.json              # Firebase services configuration
├── firestore.rules           # Firestore security rules
├── firestore.indexes.json    # Firestore indexes
├── storage.rules             # Storage security rules
├── functions/                # Cloud Functions
├── packages/api/src/firebase/ # Firebase SDK configuration
│   ├── config.ts             # Main Firebase configuration
│   ├── environment.ts        # Environment-specific configs
│   └── init.ts              # Firebase initialization
└── scripts/
    ├── firebase-setup.js     # Setup validation script
    └── test-firebase.js      # Connection testing script
```

## 🌍 Environment Configuration

### Development Environment
- Uses Firebase emulators for local development
- Configuration in `.env.local`
- Emulator ports:
  - Auth: 9099
  - Firestore: 8080
  - Storage: 9199
  - Functions: 5001
  - UI: 4000

### Staging Environment
- Uses separate Firebase project: `thefox-staging`
- Configuration in environment variables with `_STAGING` suffix
- Full Firebase services in cloud

### Production Environment
- Uses main Firebase project: `thefox-sp7zz`
- Configuration in environment variables with `_PROD` suffix
- Full Firebase services in cloud

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Firebase Project

```bash
firebase init
```

Select:
- Firestore
- Functions
- Hosting
- Storage
- Emulators

### 4. Configure Environment Variables

#### For Development:
```bash
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env.local
```

Fill in your Firebase configuration values:

```env
# Development Environment
NODE_ENV=development

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=thefox-sp7zz.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=thefox-sp7zz
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=thefox-sp7zz.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id-here
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id-here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id-here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:9002
FIREBASE_FUNCTIONS_URL=http://localhost:5001/thefox-sp7zz/us-central1
```

### 5. Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings > General
4. Scroll to "Your apps" section
5. Copy the configuration object
6. Replace the placeholder values in your `.env.local` files

### 6. Run Setup Validation

```bash
npm run firebase:setup
```

This script will:
- Check Firebase CLI installation
- Validate project configuration
- Check environment files
- Verify Firebase configuration
- Create environment templates

### 7. Start Firebase Emulators (Development)

```bash
npm run firebase:emulators
```

Or directly:
```bash
firebase emulators:start
```

### 8. Test Firebase Connection

```bash
npm run firebase:test
```

This will test:
- Firebase configuration validity
- Service connectivity
- Firestore read/write operations
- Authentication service
- Storage service
- Functions service

## 📱 Platform-Specific Configuration

### Web App (Next.js)
Environment variables use `NEXT_PUBLIC_` prefix:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

### Mobile App (Expo)
Environment variables use `EXPO_PUBLIC_` prefix:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

## 🚀 Deployment

### Deploy All Services
```bash
npm run firebase:deploy
```

### Deploy Specific Services
```bash
npm run firebase:deploy:functions    # Functions only
npm run firebase:deploy:firestore    # Firestore rules only
npm run firebase:deploy:storage      # Storage rules only
npm run firebase:deploy:hosting      # Hosting only
```

## 🔒 Security Configuration

### Firestore Rules
Located in `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public collections
    match /markets/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Storage Rules
Located in `storage.rules`:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Firebase Connection Test
```bash
npm run firebase:test
```

### Emulator Testing
```bash
firebase emulators:exec "npm test"
```

## 🔍 Troubleshooting

### Common Issues

1. **Missing Configuration**
   ```
   Error: Missing Firebase configuration
   ```
   Solution: Check your `.env.local` files and ensure all required variables are set.

2. **Emulator Connection Failed**
   ```
   Error: Emulator connection failed
   ```
   Solution: Make sure emulators are running with `firebase emulators:start`.

3. **Permission Denied**
   ```
   Error: Permission denied
   ```
   Solution: Check your Firestore/Storage security rules.

4. **Project Not Found**
   ```
   Error: Project not found
   ```
   Solution: Verify your project ID in `.firebaserc` and environment variables.

### Debug Mode

Enable debug logging:
```bash
export DEBUG=firebase*
npm run firebase:test
```

### Logs

Check Firebase logs:
```bash
firebase functions:log
```

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

## 🎯 Next Steps

After completing the Firebase configuration:

1. ✅ Firebase project configured
2. ✅ Environment variables set
3. ✅ Emulators working
4. ✅ Connection tests passing
5. 🔄 Configure Firestore Database (Task 2)
6. 🔄 Setup Firebase Storage (Task 3)
7. 🔄 Deploy Cloud Functions (Task 4)

---

For more information, see:
- [FIREBASE-INTEGRATION.md](FIREBASE-INTEGRATION.md)
- [FIREBASE-SETUP-COMPLETE.md](FIREBASE-SETUP-COMPLETE.md)
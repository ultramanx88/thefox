# 📱 Expo Mobile App Guide

คู่มือการพัฒนา React Native app ด้วย Expo สำหรับ theFOX

## 🎯 Overview

Expo app ให้ native mobile experience ที่เต็มรูปแบบ พร้อมด้วย:
- **Native Performance**: เร็วกว่า PWA
- **Native APIs**: Camera, GPS, Push Notifications
- **App Store Distribution**: iOS App Store & Google Play Store
- **Offline Capabilities**: SQLite database
- **Background Tasks**: Background sync

## 🏗️ Architecture

### Monorepo Structure
```
apps/mobile/                 # Expo React Native app
├── app/                     # Expo Router (file-based routing)
│   ├── _layout.tsx         # Root layout
│   ├── index.tsx           # Welcome screen
│   └── (tabs)/             # Tab navigation
├── src/                    # Source code
│   ├── components/         # React Native components
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utilities
│   └── types/              # TypeScript types
├── assets/                 # Images, icons, sounds
└── app.json               # Expo configuration
```

### Shared Packages
- **@repo/api**: Shared API client (web + mobile)
- **packages/ui**: Shared UI components (adapted for RN)
- **packages/types**: Shared TypeScript types

## 🚀 Development

### Prerequisites
```bash
# Install Expo CLI
npm install -g @expo/cli

# Install EAS CLI (for building)
npm install -g eas-cli
```

### Development Commands
```bash
# Start development server
npm run dev:mobile

# Run on specific platforms
npm run mobile:android    # Android emulator
npm run mobile:ios        # iOS simulator

# Web version (for testing)
npx expo start --web
```

### Development Workflow
1. **Start Metro**: `npm run dev:mobile`
2. **Scan QR Code**: ใช้ Expo Go app
3. **Live Reload**: เปลี่ยน code → auto refresh
4. **Debug**: React Native Debugger หรือ Flipper

## 📱 Features

### Core Features
- **Tab Navigation**: Home, Markets, Orders, Profile
- **Expo Router**: File-based routing system
- **TypeScript**: Full type safety
- **Shared API**: ใช้ API client ร่วมกับ web app

### Native Features (Ready to implement)
- **Camera**: QR code scanning, product photos
- **Location**: GPS tracking, nearby markets
- **Push Notifications**: Order updates
- **Secure Storage**: User credentials
- **Image Picker**: Profile photos, product images

### UI Components
- **Native Look & Feel**: Platform-specific styling
- **Gesture Handling**: Swipe, pinch, pan
- **Animations**: React Native Reanimated
- **Icons**: Expo Vector Icons

## 🔧 Configuration

### App Configuration (app.json)
```json
{
  "expo": {
    "name": "theFOX",
    "slug": "thefox-mobile",
    "version": "1.0.0",
    "platforms": ["ios", "android", "web"],
    "ios": {
      "bundleIdentifier": "com.thefox.mobile"
    },
    "android": {
      "package": "com.thefox.mobile"
    }
  }
}
```

### Build Configuration (eas.json)
```json
{
  "build": {
    "development": {
      "developmentClient": true
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

## 🏗️ Building & Deployment

### Development Build
```bash
# Build development client
eas build --profile development --platform all

# Install on device
eas build:run --profile development
```

### Preview Build
```bash
# Build APK for testing
eas build --profile preview --platform android

# Build for internal testing
eas build --profile preview --platform ios
```

### Production Build
```bash
# Build for app stores
eas build --profile production --platform all

# Submit to app stores
eas submit --platform all
```

### CI/CD Integration
```yaml
# .github/workflows/mobile-build.yml
- name: Build Mobile App
  run: |
    cd apps/mobile
    eas build --platform all --non-interactive
```

## 📊 Performance

### Optimization Strategies
- **Bundle Splitting**: Lazy loading screens
- **Image Optimization**: WebP format, caching
- **Memory Management**: Proper cleanup
- **Network Optimization**: Request batching

### Monitoring
- **Expo Analytics**: Built-in analytics
- **Crashlytics**: Crash reporting
- **Performance Monitoring**: React Native Performance

## 🔍 Testing

### Testing Strategy
```bash
# Unit tests
npm run test

# E2E tests with Detox
npm run test:e2e

# Performance testing
npm run test:perf
```

### Testing Tools
- **Jest**: Unit testing
- **React Native Testing Library**: Component testing
- **Detox**: E2E testing
- **Maestro**: UI testing

## 🚀 Native Features Implementation

### Camera Integration
```typescript
import { Camera } from 'expo-camera';

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);
  
  // Camera implementation
};
```

### Location Services
```typescript
import * as Location from 'expo-location';

const useLocation = () => {
  const [location, setLocation] = useState(null);
  
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);
  
  return location;
};
```

### Push Notifications
```typescript
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
```

## 📱 Platform-Specific Code

### iOS Specific
```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // iOS specific code
}
```

### Android Specific
```typescript
if (Platform.OS === 'android') {
  // Android specific code
}
```

## 🔐 Security

### Secure Storage
```typescript
import * as SecureStore from 'expo-secure-store';

// Store sensitive data
await SecureStore.setItemAsync('userToken', token);

// Retrieve sensitive data
const token = await SecureStore.getItemAsync('userToken');
```

### API Security
- **Certificate Pinning**: SSL pinning
- **Token Management**: Secure token storage
- **Biometric Auth**: Fingerprint/Face ID

## 📈 Analytics & Monitoring

### User Analytics
```typescript
import * as Analytics from 'expo-analytics';

// Track events
Analytics.track('screen_view', {
  screen_name: 'Home',
  user_id: userId,
});
```

### Crash Reporting
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_DSN_HERE',
});
```

## 🚨 Troubleshooting

### Common Issues

#### Metro Bundle Error
```bash
# Clear Metro cache
npx expo start --clear

# Reset Metro
npx expo start --reset-cache
```

#### Build Errors
```bash
# Clear EAS build cache
eas build --clear-cache

# Check build logs
eas build:list
```

#### Simulator Issues
```bash
# Reset iOS Simulator
xcrun simctl erase all

# Restart Android Emulator
adb kill-server && adb start-server
```

## 🎯 Next Steps

### Phase 1: Core Features
- [ ] Complete UI implementation
- [ ] Integrate with shared API
- [ ] Add navigation between screens
- [ ] Implement basic functionality

### Phase 2: Native Features
- [ ] Camera integration
- [ ] Location services
- [ ] Push notifications
- [ ] Offline storage

### Phase 3: Advanced Features
- [ ] Biometric authentication
- [ ] Background sync
- [ ] Deep linking
- [ ] Share functionality

### Phase 4: Production
- [ ] Performance optimization
- [ ] Security hardening
- [ ] App store submission
- [ ] Analytics implementation

## 📞 Development Tips

1. **Use Expo Go**: สำหรับ development
2. **Test on Real Devices**: ทดสอบบน device จริง
3. **Follow Platform Guidelines**: iOS HIG, Material Design
4. **Optimize Images**: ใช้ WebP, optimize sizes
5. **Handle Permissions**: Request permissions properly
6. **Test Offline**: ทดสอบ offline functionality

Expo app จะให้ native experience ที่เต็มรูปแบบ พร้อมด้วย performance และ features ที่ PWA ทำไม่ได้!
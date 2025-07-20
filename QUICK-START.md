# 🚀 Quick Start Guide

เริ่มต้นใช้งาน theFOX monorepo ได้ทันที!

## 📋 Prerequisites

```bash
# Node.js 22+
node --version

# npm or yarn
npm --version

# Expo CLI (for mobile development)
npm install -g @expo/cli
```

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
# Install all dependencies
npm install
```

### 2. Start Development

#### Web App (PWA)
```bash
# Start web development server
npm run dev:web

# Open: http://localhost:9002
```

#### Mobile App (Expo)
```bash
# Start mobile development server
npm run dev:mobile

# Scan QR code with Expo Go app
# iOS: Camera app
# Android: Expo Go app
```

#### Both Apps
```bash
# Terminal 1: Web
npm run dev:web

# Terminal 2: Mobile
npm run dev:mobile
```

## 🏗️ Build & Deploy

### Development Build
```bash
# Build all apps
npm run build:all

# Build specific app
npm run build:web      # Web PWA
npm run build:mobile   # Mobile app
npm run build:functions # Firebase functions
```

### Production Deploy
```bash
# Deploy via Git (recommended)
git add .
git commit -m "deploy: release v1.0.0"
git tag v1.0.0
git push origin v1.0.0

# Manual deploy
./scripts/deploy.sh -e production
```

## 📱 Mobile Development

### Expo Go (Development)
1. Install Expo Go app on your phone
2. Run `npm run dev:mobile`
3. Scan QR code
4. App loads on your phone

### Build Native App
```bash
# Install EAS CLI
npm install -g eas-cli

# Build for testing
cd apps/mobile
eas build --profile preview --platform android

# Build for production
eas build --profile production --platform all
```

## 🔧 Development Commands

### Root Level
```bash
npm run dev:web          # Start web app
npm run dev:mobile       # Start mobile app
npm run build:all        # Build all apps
npm run lint:all         # Lint all code
npm run typecheck        # Type check all apps
npm run ci               # Full CI pipeline
```

### Web App (apps/web)
```bash
npm run dev              # Development server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint
npm run typecheck        # TypeScript check
```

### Mobile App (apps/mobile)
```bash
npm run start            # Expo development server
npm run android          # Run on Android
npm run ios              # Run on iOS
npm run web              # Run on web
npm run build            # Export app
```

## 🌐 URLs & Access

### Development
- **Web App**: http://localhost:9002
- **Mobile App**: Expo Go app (scan QR)
- **Firebase Console**: https://console.firebase.google.com

### Production
- **Web App**: https://thefox-sp7zz.web.app
- **Mobile App**: App Store / Play Store (after submission)

## 📊 Project Structure

```
thefox/
├── apps/
│   ├── web/             # Next.js PWA
│   └── mobile/          # Expo React Native
├── packages/
│   ├── ui/              # Shared UI components
│   ├── api/             # Shared API client
│   └── types/           # Shared TypeScript types
├── functions/           # Firebase Functions
├── scripts/             # Deployment scripts
└── docs/                # Documentation
```

## 🎯 Features

### Web App (PWA)
- ✅ Progressive Web App
- ✅ Offline support
- ✅ Install prompt
- ✅ Push notifications (ready)
- ✅ Responsive design

### Mobile App (Native)
- ✅ React Native with Expo
- ✅ Native performance
- ✅ Camera integration (ready)
- ✅ GPS location (ready)
- ✅ Push notifications (ready)
- ✅ App Store ready

### Backend
- ✅ Firebase Hosting
- ✅ Firebase Functions
- ✅ Firestore Database
- ✅ Firebase Authentication (ready)

## 🚨 Troubleshooting

### Common Issues

#### Web App Won't Start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev:web
```

#### Mobile App Won't Start
```bash
# Clear Expo cache
cd apps/mobile
npx expo start --clear
```

#### Build Errors
```bash
# Run CI pipeline to check all issues
npm run ci

# Check specific app
npm run typecheck
npm run lint:all
```

#### Git Deployment Issues
```bash
# Check GitHub Actions
# Go to: https://github.com/your-repo/actions

# Manual deploy
./scripts/deploy.sh -e staging
```

## 📚 Documentation

- **[PWA Guide](PWA-GUIDE.md)** - Progressive Web App features
- **[Expo Guide](EXPO-GUIDE.md)** - Mobile app development
- **[Deployment Guide](DEPLOYMENT.md)** - Git-based deployment
- **[Git Cheat Sheet](GIT-DEPLOY-CHEATSHEET.md)** - Quick deployment commands

## 🎉 You're Ready!

1. **Start Development**: `npm run dev:web` และ `npm run dev:mobile`
2. **Make Changes**: Edit code และดู live reload
3. **Test Features**: ทดสอบ PWA และ native features
4. **Deploy**: ใช้ Git tags สำหรับ deployment

**Happy Coding! 🚀**
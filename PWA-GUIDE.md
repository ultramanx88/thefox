# 📱 PWA Implementation Guide

คู่มือการใช้งาน Progressive Web App (PWA) สำหรับ theFOX

## 🎯 PWA Features

### ✅ Implemented Features
- **App-like Experience**: Standalone display mode
- **Offline Support**: Cached content และ offline page
- **Install Prompt**: Auto-prompt สำหรับการติดตั้ง app
- **Update Notifications**: แจ้งเตือนเมื่อมี version ใหม่
- **Network Status**: แสดงสถานะ online/offline
- **Responsive Icons**: รองรับทุก device และ platform
- **Caching Strategy**: Optimized caching สำหรับ performance
- **Background Sync**: Sync data เมื่อกลับมา online

### 🔧 Technical Implementation
- **Service Worker**: next-pwa with Workbox
- **Manifest**: Complete PWA manifest configuration
- **Caching**: Multi-layer caching strategy
- **Icons**: Maskable icons สำหรับ adaptive design
- **Meta Tags**: Complete PWA meta tags

## 🚀 Installation

### For Users

#### Android
1. เปิด theFOX ใน Chrome browser
2. กด menu (⋮) → "Add to Home screen"
3. หรือดู install prompt ที่ปรากฏอัตโนมัติ

#### iOS
1. เปิด theFOX ใน Safari
2. กด Share button (□↗)
3. เลือก "Add to Home Screen"
4. กด "Add"

#### Desktop
1. เปิด theFOX ใน Chrome/Edge
2. ดู install icon ใน address bar
3. หรือกด menu → "Install theFOX"

### For Developers

```bash
# Install dependencies
npm install

# Development with PWA disabled
npm run dev

# Build with PWA enabled
npm run build

# Analyze bundle size
npm run pwa:analyze
```

## 📋 PWA Configuration

### Manifest Settings
```json
{
  "name": "theFOX - Your Market, Delivered",
  "short_name": "theFOX",
  "theme_color": "#ff6b35",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/"
}
```

### Caching Strategy
- **Static Assets**: StaleWhileRevalidate (30 days)
- **API Calls**: NetworkFirst (24 hours)
- **Images**: StaleWhileRevalidate (30 days)
- **Fonts**: CacheFirst (365 days)
- **HTML Pages**: NetworkFirst (24 hours)

## 🔧 Components

### InstallPrompt
```tsx
import { InstallPrompt } from '@/components/pwa/install-prompt';

// Auto-shows install prompt when appropriate
<InstallPrompt />
```

### OfflineIndicator
```tsx
import { OfflineIndicator } from '@/components/pwa/offline-indicator';

// Shows offline status banner
<OfflineIndicator />
```

### UpdatePrompt
```tsx
import { UpdatePrompt } from '@/components/pwa/update-prompt';

// Shows update available notification
<UpdatePrompt />
```

### PWAProvider
```tsx
import { PWAProvider } from '@/components/pwa/pwa-provider';

// Wraps app with all PWA components
<PWAProvider>
  {children}
</PWAProvider>
```

## 🛠️ Utilities

### PWA Detection
```tsx
import { isPWAInstalled, isIOSDevice } from '@/lib/pwa-utils';

const installed = isPWAInstalled();
const iOS = isIOSDevice();
```

### Network Status
```tsx
import { getNetworkStatus } from '@/lib/pwa-utils';

const { online, effectiveType } = getNetworkStatus();
```

### Cache Management
```tsx
import { clearAppCache, getCacheSize } from '@/lib/pwa-utils';

await clearAppCache();
const size = await getCacheSize();
```

### Web Share API
```tsx
import { shareContent } from '@/lib/pwa-utils';

await shareContent({
  title: 'theFOX',
  text: 'Check out this amazing marketplace!',
  url: 'https://thefox-sp7zz.web.app'
});
```

## 📊 Performance Optimization

### Bundle Analysis
```bash
npm run pwa:analyze
```

### Lighthouse Audit
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+
- PWA: 100

### Core Web Vitals
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

## 🔍 Testing

### PWA Testing Checklist
- [ ] Install prompt appears
- [ ] App installs successfully
- [ ] Offline functionality works
- [ ] Update notifications work
- [ ] Icons display correctly
- [ ] Splash screen shows
- [ ] Navigation works in standalone mode

### Testing Tools
- Chrome DevTools → Application → Service Workers
- Chrome DevTools → Application → Manifest
- Lighthouse PWA audit
- PWA Builder validation

### Test Commands
```bash
# Test offline functionality
# 1. Build and serve app
npm run build && npm start

# 2. Open DevTools → Network → Offline
# 3. Navigate and test cached content

# Test install prompt
# 1. Open in incognito mode
# 2. Visit site multiple times
# 3. Check for install prompt
```

## 🚨 Troubleshooting

### Common Issues

#### Install Prompt Not Showing
```bash
# Check criteria:
# - HTTPS enabled
# - Valid manifest
# - Service worker registered
# - User engagement signals
# - Not already installed
```

#### Service Worker Not Updating
```bash
# Force update:
# 1. DevTools → Application → Service Workers
# 2. Check "Update on reload"
# 3. Click "Update" button
```

#### Offline Page Not Loading
```bash
# Check:
# - Offline page is cached
# - Service worker is active
# - Network requests are intercepted
```

### Debug Commands
```javascript
// Check PWA status
console.log('PWA Installed:', isPWAInstalled());
console.log('Service Worker:', 'serviceWorker' in navigator);

// Check cache
caches.keys().then(console.log);

// Check network
console.log('Online:', navigator.onLine);
```

## 📈 Analytics & Monitoring

### PWA Events to Track
- App installs
- Offline usage
- Update prompts
- Share actions
- Performance metrics

### Implementation
```tsx
import { trackPWAInstall, trackPWAUsage } from '@/lib/pwa-utils';

// Track install
trackPWAInstall();

// Track usage mode
trackPWAUsage();
```

## 🔐 Security Considerations

### HTTPS Requirement
- PWA requires HTTPS in production
- Service workers only work over HTTPS
- Firebase Hosting provides HTTPS by default

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline';">
```

### Permissions
- Location (for delivery)
- Notifications (for order updates)
- Camera (for QR codes)

## 🚀 Deployment

### Firebase Hosting
PWA files are automatically deployed with the web app:
- Service worker: `/sw.js`
- Manifest: `/manifest.json`
- Icons: `/icons/*`

### Verification
After deployment, verify:
1. Manifest loads correctly
2. Service worker registers
3. Icons display properly
4. Install prompt works
5. Offline functionality works

## 📱 Platform-Specific Features

### iOS
- Add to Home Screen
- Splash screen support
- Status bar styling
- Safe area handling

### Android
- WebAPK generation
- Adaptive icons
- Shortcuts support
- Background sync

### Desktop
- Window controls overlay
- File handling
- Protocol handling
- Shortcuts

## 🎨 Design Guidelines

### Icons
- Use maskable icons (safe area 80%)
- Provide multiple sizes (72px to 512px)
- Use brand colors consistently
- Test on various backgrounds

### Splash Screen
- Matches app theme
- Shows brand logo
- Smooth transition to app

### UI/UX
- Touch-friendly interface
- Responsive design
- Native app feel
- Smooth animations

PWA implementation ทำให้ theFOX มี user experience ที่ดีขึ้น ทำงานได้แม้ offline และติดตั้งได้เหมือน native app!
# Hybrid Architecture — Migration Checklist

## Architecture Overview

```
apps/
  web/          Next.js + PWA  (standalone browser + installable)
  mobile/       Expo shell     (WebView wrapping web app)
packages/
  shared/       Bridge types   (WebToNativeMessage, NativeToWebMessage)
  api/          Firebase/REST  (shared API client)
  ui/           Shared React components
```

## Communication Bridge

```
Web (Next.js)                    Native (Expo)
─────────────────────────────────────────────────────
window.ReactNativeBridge         WebViewBridge.tsx
  .postMessage(envelope)   →     onMessage handler
                                   → usePrinter
                                   → haptic / camera

webViewRef.injectJavaScript  ←   sendToWeb(msg)
  → CustomEvent('nativeBridgeMessage')
  → useNativeBridge hook listeners
```

## Migration Tasks

### ✅ Done
- [x] `packages/shared` — bridge message types (WebToNativeMessage, NativeToWebMessage)
- [x] `apps/mobile/src/components/WebViewBridge.tsx` — WebView shell + message router
- [x] `apps/mobile/src/hooks/usePrinter.ts` — USB/BT printer (ESC/POS)
- [x] `apps/mobile/app/index.tsx` — replaced with WebView shell
- [x] `apps/web/src/lib/native-bridge.ts` — web-side postMessage API
- [x] `apps/web/src/hooks/useNativeBridge.ts` — React hook for web components
- [x] `@repo/shared` added to web + mobile dependencies
- [x] `react-native-webview` added to mobile

### 🔲 Remaining

#### Mobile
- [ ] Install printer libraries when hardware is confirmed:
  - Bluetooth: `npx expo install react-native-bluetooth-escpos-printer`
  - USB (Android): `npx expo install react-native-usb-serialport-for-android`
- [ ] Uncomment printer calls in `usePrinter.ts` after install
- [ ] Add `expo-haptics` for haptic feedback: `npx expo install expo-haptics`
- [ ] Configure `app.json` — add `react-native-webview` plugin if needed
- [ ] Set `EXPO_PUBLIC_WEB_URL` in `.env` for staging/prod URLs
- [ ] Handle deep links from web → native (expo-linking)

#### Web
- [ ] Add `EXPO_PUBLIC_WEB_URL` detection to skip bridge UI in browser
- [ ] Add print button component that uses `useNativeBridge().sendPrintReceipt()`
- [ ] Add queue ticket print trigger on queue creation
- [ ] Test PWA install flow on Android Chrome + iOS Safari

#### Queue System
- [ ] Wire `QUEUE_CREATED` postMessage on queue creation page
- [ ] Native side: trigger local push notification on `onQueueCreated`
- [ ] Offline fallback: cache queue state in IndexedDB via service worker

#### Shared
- [ ] Add `tsconfig.json` to `packages/shared`
- [ ] Add build script if consumers need compiled output

## Usage Examples

### Web → Print receipt
```ts
import { useNativeBridge } from '@/hooks/useNativeBridge';

const { sendPrintReceipt, inWebView } = useNativeBridge();

sendPrintReceipt({
  jobId: crypto.randomUUID(),
  printerType: 'bluetooth',
  content: {
    storeName: 'theFOX Market',
    orderId: order.id,
    items: order.items,
    total: order.total,
    timestamp: new Date().toISOString(),
  },
});
```

### Web → Print queue ticket
```ts
const { sendPrintQueueTicket } = useNativeBridge();

sendPrintQueueTicket({
  jobId: crypto.randomUUID(),
  printerType: 'bluetooth',
  queueNumber: 42,
  branchName: 'สาขาลาดพร้าว',
  estimatedWait: 15,
  timestamp: new Date().toLocaleString('th-TH'),
});
```

### Native → Web (inject message)
```ts
// In any native component that has bridgeRef
bridgeRef.current?.sendToWeb({
  type: 'NETWORK_STATUS',
  payload: { online: false },
});
```

## Performance Notes

- WebView loads web app URL — first load hits network, subsequent loads use SW cache
- Set `cacheEnabled` + `cacheMode="LOAD_DEFAULT"` on WebView (already done)
- PWA service worker handles offline fallback automatically
- Bridge messages are fire-and-forget with envelope IDs for correlation
- ESC/POS formatting is done in JS before sending to printer — no round-trip

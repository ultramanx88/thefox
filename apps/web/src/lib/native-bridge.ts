import type {
  BridgeEnvelope,
  NativeToWebMessage,
  WebToNativeMessage,
} from '@repo/shared';

// Detect if running inside React Native WebView
export const isInWebView = (): boolean =>
  typeof window !== 'undefined' && !!(window as any).ReactNativeWebView;

// Send message to native
export function postToNative(msg: WebToNativeMessage): void {
  if (!isInWebView()) return;
  const envelope: BridgeEnvelope<WebToNativeMessage> = {
    id: Math.random().toString(36).slice(2),
    timestamp: Date.now(),
    data: msg,
  };
  (window as any).ReactNativeWebView.postMessage(JSON.stringify(envelope));
}

// Listen for messages from native
type Listener = (msg: NativeToWebMessage) => void;
const listeners = new Set<Listener>();

if (typeof window !== 'undefined') {
  window.addEventListener('nativeBridgeMessage', (e: Event) => {
    const envelope = (e as CustomEvent<BridgeEnvelope<NativeToWebMessage>>).detail;
    listeners.forEach((fn) => fn(envelope.data));
  });
}

export function onNativeMessage(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ─── Convenience helpers ─────────────────────────────────────────────────────

export function printReceipt(payload: import('@repo/shared').PrintPayload): void {
  postToNative({ type: 'PRINT_RECEIPT', payload });
}

export function printQueueTicket(payload: import('@repo/shared').QueueTicketPayload): void {
  postToNative({ type: 'PRINT_QUEUE_TICKET', payload });
}

export function requestHaptic(style: 'light' | 'medium' | 'heavy' = 'medium'): void {
  postToNative({ type: 'HAPTIC_FEEDBACK', payload: { style } });
}

export function getDeviceInfo(): void {
  postToNative({ type: 'GET_DEVICE_INFO' });
}

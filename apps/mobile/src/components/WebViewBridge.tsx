import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type {
  BridgeEnvelope,
  NativeToWebMessage,
  WebToNativeMessage,
  QueuePayload,
} from '@repo/shared';
import { usePrinter } from '../hooks/usePrinter';

const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://thefox-sp7zz.web.app';

const BRIDGE_INIT_SCRIPT = `
(function() {
  if (window.__bridgeReady) return;
  window.__bridgeReady = true;
  window.ReactNativeBridge = {
    postMessage: function(data) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }
  };
  window.dispatchEvent(new Event('bridgeReady'));
})();
true;
`;

export interface WebViewBridgeRef {
  sendToWeb: (msg: NativeToWebMessage) => void;
  reload: () => void;
}

interface Props {
  onLoad?: () => void;
  onQueueCreated?: (payload: QueuePayload) => void;
  onOrderChanged?: (payload: { orderId: string; status: string }) => void;
}

const WebViewBridge = forwardRef<WebViewBridgeRef, Props>(
  ({ onLoad, onQueueCreated, onOrderChanged }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const { print } = usePrinter();

    const sendToWeb = useCallback((msg: NativeToWebMessage) => {
      const envelope: BridgeEnvelope<NativeToWebMessage> = {
        id: Math.random().toString(36).slice(2),
        timestamp: Date.now(),
        data: msg,
      };
      const js = `
        window.dispatchEvent(new CustomEvent('nativeBridgeMessage', {
          detail: ${JSON.stringify(envelope)}
        }));
        true;
      `;
      webViewRef.current?.injectJavaScript(js);
    }, []);

    useImperativeHandle(ref, () => ({
      sendToWeb,
      reload: () => webViewRef.current?.reload(),
    }));

    const handleMessage = useCallback(
      async (event: WebViewMessageEvent) => {
        let envelope: BridgeEnvelope<WebToNativeMessage>;
        try {
          envelope = JSON.parse(event.nativeEvent.data);
        } catch {
          return;
        }

        const msg = envelope.data;

        switch (msg.type) {
          case 'PRINT_RECEIPT':
          case 'PRINT_QUEUE_TICKET': {
            const result = await print(msg.payload);
            sendToWeb(
              result.success
                ? { type: 'PRINT_SUCCESS', payload: { jobId: msg.payload.jobId } }
                : { type: 'PRINT_ERROR', payload: { jobId: msg.payload.jobId, error: result.error ?? 'Unknown' } }
            );
            break;
          }
          case 'GET_DEVICE_INFO':
            sendToWeb({
              type: 'DEVICE_INFO',
              payload: {
                platform: Platform.OS as 'ios' | 'android',
                version: Platform.Version.toString(),
                model: 'unknown',
                hasBluetoothPrinter: false,
                hasUsbPrinter: false,
              },
            });
            break;
          case 'QUEUE_CREATED':
            onQueueCreated?.(msg.payload);
            break;
          case 'ORDER_STATUS_CHANGED':
            onOrderChanged?.(msg.payload);
            break;
          case 'REQUEST_NOTIFICATION_PERMISSION':
            sendToWeb({ type: 'NOTIFICATION_PERMISSION', payload: { granted: true } });
            break;
          case 'HAPTIC_FEEDBACK':
            // expo-haptics: Haptics.impactAsync(msg.payload.style)
            break;
        }
      },
      [sendToWeb, print, onQueueCreated, onOrderChanged]
    );

    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ uri: WEB_APP_URL }}
          style={styles.webview}
          injectedJavaScriptBeforeContentLoaded={BRIDGE_INIT_SCRIPT}
          onMessage={handleMessage}
          onLoad={onLoad}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          cacheEnabled
          cacheMode="LOAD_DEFAULT"
          allowsBackForwardNavigationGestures
          sharedCookiesEnabled
        />
      </View>
    );
  }
);

WebViewBridge.displayName = 'WebViewBridge';
export default WebViewBridge;

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
});

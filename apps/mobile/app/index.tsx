import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import WebViewBridge, { type WebViewBridgeRef } from '../src/components/WebViewBridge';
import type { QueuePayload } from '@repo/shared';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function AppShell() {
  const bridgeRef = useRef<WebViewBridgeRef>(null);
  const [webReady, setWebReady] = useState(false);

  // Register push notification token and send to web via bridge
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) return;

      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
      // Wait until WebView is ready before sending token
      const interval = setInterval(() => {
        if (bridgeRef.current) {
          bridgeRef.current.sendToWeb({ type: 'AUTH_TOKEN', payload: { token } });
          clearInterval(interval);
        }
      }, 500);
    })();
  }, []);

  const handleWebReady = useCallback(() => {
    setWebReady(true);
    SplashScreen.hideAsync();
  }, []);

  const handleQueueCreated = useCallback(async (payload: QueuePayload) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'คิวของคุณถูกสร้างแล้ว',
        body: `คิวหมายเลข #${payload.number} — ${payload.branchId}`,
        data: payload,
      },
      trigger: null, // immediate
    });
  }, []);

  const handleOrderChanged = useCallback(
    async (payload: { orderId: string; status: string }) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'อัปเดตสถานะออเดอร์',
          body: `ออเดอร์ ${payload.orderId} — ${payload.status}`,
          data: payload,
        },
        trigger: null,
      });
    },
    []
  );

  return (
    <View style={styles.container}>
      <WebViewBridge
        ref={bridgeRef}
        onLoad={handleWebReady}
        onQueueCreated={handleQueueCreated}
        onOrderChanged={handleOrderChanged}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});

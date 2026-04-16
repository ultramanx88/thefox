'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  getDeviceInfo,
  isInWebView,
  onNativeMessage,
  printQueueTicket,
  printReceipt,
  requestHaptic,
} from '@/lib/native-bridge';
import type {
  DeviceInfoPayload,
  PrintPayload,
  QueueTicketPayload,
} from '@repo/shared';

export function useNativeBridge() {
  const inWebView = isInWebView();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoPayload | null>(null);
  const [lastPrintResult, setLastPrintResult] = useState<
    { jobId: string; success: boolean; error?: string } | null
  >(null);

  useEffect(() => {
    if (!inWebView) return;

    const unsub = onNativeMessage((msg) => {
      switch (msg.type) {
        case 'DEVICE_INFO':
          setDeviceInfo(msg.payload);
          break;
        case 'PRINT_SUCCESS':
          setLastPrintResult({ jobId: msg.payload.jobId, success: true });
          break;
        case 'PRINT_ERROR':
          setLastPrintResult({ jobId: msg.payload.jobId, success: false, error: msg.payload.error });
          break;
      }
    });

    // Request device info on mount
    getDeviceInfo();

    return unsub;
  }, [inWebView]);

  const sendPrintReceipt = useCallback(
    (payload: PrintPayload) => {
      if (inWebView) printReceipt(payload);
      else console.warn('[Bridge] Not in WebView — print skipped');
    },
    [inWebView]
  );

  const sendPrintQueueTicket = useCallback(
    (payload: QueueTicketPayload) => {
      if (inWebView) printQueueTicket(payload);
      else console.warn('[Bridge] Not in WebView — print skipped');
    },
    [inWebView]
  );

  const haptic = useCallback(
    (style: 'light' | 'medium' | 'heavy' = 'medium') => {
      if (inWebView) requestHaptic(style);
    },
    [inWebView]
  );

  return {
    inWebView,
    deviceInfo,
    lastPrintResult,
    sendPrintReceipt,
    sendPrintQueueTicket,
    haptic,
  };
}

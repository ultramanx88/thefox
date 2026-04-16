import { useCallback } from 'react';
import type { PrintPayload, QueueTicketPayload } from '@repo/shared';

interface PrintResult {
  success: boolean;
  error?: string;
}

// Format receipt as ESC/POS text commands
function formatReceipt(payload: PrintPayload): string {
  const { content } = payload;
  const line = '--------------------------------';
  const items = content.items
    .map((i) => `${i.name.padEnd(20)}${String(i.qty).padStart(3)} x${String(i.price).padStart(7)}`)
    .join('\n');

  return [
    '\x1B\x40',           // ESC @ — init printer
    '\x1B\x61\x01',       // center align
    `${content.storeName}\n`,
    line,
    '\x1B\x61\x00',       // left align
    `Order: ${content.orderId}\n`,
    `Date:  ${content.timestamp}\n`,
    line,
    items,
    line,
    `${'TOTAL'.padEnd(24)}${String(content.total).padStart(8)}\n`,
    '\x1B\x61\x01',       // center
    content.qrCode ? `\nQR: ${content.qrCode}\n` : '',
    '\n\n\n',
    '\x1D\x56\x41\x03',   // cut paper
  ].join('');
}

function formatQueueTicket(payload: QueueTicketPayload): string {
  return [
    '\x1B\x40',
    '\x1B\x61\x01',
    '\x1B\x21\x30',       // double width+height
    `#${String(payload.queueNumber).padStart(3, '0')}\n`,
    '\x1B\x21\x00',       // normal size
    `${payload.branchName}\n`,
    `Wait: ~${payload.estimatedWait} min\n`,
    `${payload.timestamp}\n`,
    '\n\n\n',
    '\x1D\x56\x41\x03',
  ].join('');
}

export function usePrinter() {
  const print = useCallback(
    async (payload: PrintPayload | QueueTicketPayload): Promise<PrintResult> => {
      try {
        const data =
          'content' in payload
            ? formatReceipt(payload as PrintPayload)
            : formatQueueTicket(payload as QueueTicketPayload);

        if (payload.printerType === 'bluetooth') {
          return await printBluetooth(data);
        }
        return await printUsb(data);
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
    []
  );

  return { print };
}

// ─── Bluetooth ───────────────────────────────────────────────────────────────
// Requires: react-native-ble-plx or react-native-bluetooth-escpos-printer
// Install: npx expo install react-native-bluetooth-escpos-printer
async function printBluetooth(data: string): Promise<PrintResult> {
  try {
    // Uncomment after installing react-native-bluetooth-escpos-printer:
    // const BluetoothEscposPrinter = require('react-native-bluetooth-escpos-printer').default;
    // await BluetoothEscposPrinter.printText(data, {});
    console.log('[Printer] BT print:', data.slice(0, 40));
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── USB ─────────────────────────────────────────────────────────────────────
// Requires: react-native-usb-serialport-for-android (Android only)
// Install: npx expo install react-native-usb-serialport-for-android
async function printUsb(data: string): Promise<PrintResult> {
  try {
    // Uncomment after installing:
    // const { RNSerialport } = require('react-native-usb-serialport-for-android');
    // await RNSerialport.writeString(data);
    console.log('[Printer] USB print:', data.slice(0, 40));
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

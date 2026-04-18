// ─── Web → Native ───────────────────────────────────────────────────────────

export type WebToNativeMessage =
  | { type: 'PRINT_RECEIPT'; payload: PrintPayload }
  | { type: 'PRINT_QUEUE_TICKET'; payload: QueueTicketPayload }
  | { type: 'GET_DEVICE_INFO' }
  | { type: 'REQUEST_NOTIFICATION_PERMISSION' }
  | { type: 'HAPTIC_FEEDBACK'; payload: { style: 'light' | 'medium' | 'heavy' } }
  | { type: 'OPEN_CAMERA' }
  | { type: 'QUEUE_CREATED'; payload: QueuePayload }
  | { type: 'ORDER_STATUS_CHANGED'; payload: { orderId: string; status: string } };

// ─── Native → Web ───────────────────────────────────────────────────────────

export type NativeToWebMessage =
  | { type: 'DEVICE_INFO'; payload: DeviceInfoPayload }
  | { type: 'PRINT_SUCCESS'; payload: { jobId: string } }
  | { type: 'PRINT_ERROR'; payload: { jobId: string; error: string } }
  | { type: 'NOTIFICATION_PERMISSION'; payload: { granted: boolean } }
  | { type: 'CAMERA_RESULT'; payload: { uri: string } | null }
  | { type: 'AUTH_TOKEN'; payload: { token: string } }
  | { type: 'NETWORK_STATUS'; payload: { online: boolean } };

// ─── Payloads ────────────────────────────────────────────────────────────────

export interface PrintPayload {
  jobId: string;
  printerType: 'usb' | 'bluetooth';
  content: PrintContent;
}

export interface PrintContent {
  storeName: string;
  orderId: string;
  items: Array<{ name: string; qty: number; price: number }>;
  total: number;
  timestamp: string;
  qrCode?: string;
}

export interface QueueTicketPayload {
  jobId: string;
  printerType: 'usb' | 'bluetooth';
  queueNumber: number;
  branchName: string;
  estimatedWait: number; // minutes
  timestamp: string;
}

export interface QueuePayload {
  queueId: string;
  branchId: string;
  number: number;
  status: 'waiting' | 'called' | 'serving' | 'done';
}

export interface QueueCalledPayload {
  queueId: string;
  number: number;
  branchName: string;
  counter: string;
}

export interface DeviceInfoPayload {
  platform: 'ios' | 'android';
  version: string;
  model: string;
  hasBluetoothPrinter: boolean;
  hasUsbPrinter: boolean;
}

// ─── Bridge envelope ─────────────────────────────────────────────────────────

export interface BridgeEnvelope<T> {
  id: string;
  timestamp: number;
  data: T;
}

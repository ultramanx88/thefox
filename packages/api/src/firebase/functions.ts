import { httpsCallable } from 'firebase/functions';
import { functions } from './config';

const call = (name: string) => (data: unknown) =>
  httpsCallable(functions, name)(data).then((r) => r.data);

export const FirebaseFunctionsService = {
  createMarket: call('createMarket'),
  searchMarkets: (query: string, location?: { lat: number; lng: number }) =>
    call('searchMarkets')({ query, location }),
  createProduct: call('createProduct'),
  searchProducts: (query: string, marketId?: string) =>
    call('searchProducts')({ query, marketId }),
  createOrder: call('createOrder'),
  updateOrderStatus: (id: string, status: string) =>
    call('updateOrderStatus')({ id, status }),
  cancelOrder: (id: string, reason?: string) =>
    call('cancelOrder')({ id, reason }),
  calculateDeliveryFee: call('calculateDeliveryFee'),
  processPayment: call('processPayment'),
  sendNotification: call('sendNotification'),
  trackEvent: call('trackEvent'),
  getAnalytics: call('getAnalytics'),
  suggestProducts: call('suggestProducts'),
  categorizeProduct: call('categorizeProduct'),
  generateQRCode: call('generateQRCode'),
  validateAddress: (address: string) => call('validateAddress')({ address }),
};

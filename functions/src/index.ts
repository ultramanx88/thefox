/**
 * Firebase Cloud Functions for theFOX Application
 * 
 * This file exports all Cloud Functions organized by category:
 * - Authentication functions
 * - Order processing functions
 * - Payment functions
 * - Notification functions
 * - Analytics functions
 */

import { setGlobalOptions } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";

// Initialize Firebase Admin
initializeApp();

// Set global options for cost control and performance
setGlobalOptions({ 
  maxInstances: 10,
  region: "asia-southeast1", // Closer to Thailand
  memory: "256MiB",
  timeoutSeconds: 60,
});

// ===========================================
// AUTHENTICATION FUNCTIONS
// ===========================================
export { 
  onUserCreate,
  onUserDelete,
  setCustomClaims,
  verifyUserRole
} from "./auth";

// ===========================================
// ORDER PROCESSING FUNCTIONS
// ===========================================
export {
  createOrder,
  updateOrderStatus,
  calculateDeliveryFee,
  cancelOrder,
  onOrderCreated
} from "./orders";

// ===========================================
// PAYMENT FUNCTIONS
// ===========================================
export {
  processPayment,
  handlePaymentWebhook,
  refundPayment,
  validatePayment
} from "./payments";

// ===========================================
// NOTIFICATION FUNCTIONS
// ===========================================
export {
  sendNotification,
  sendBulkNotification,
  sendOrderNotification,
  sendDeliveryNotification,
  onNotificationCreated
} from "./notifications";

// ===========================================
// ANALYTICS FUNCTIONS
// ===========================================
export {
  trackEvent,
  generateDailyReport,
  generateWeeklyReport,
  generateMonthlyReport,
  calculateMetrics
} from "./analytics";

// ===========================================
// UTILITY FUNCTIONS
// ===========================================
export {
  cleanupTempFiles,
  optimizeImages,
  generateThumbnails,
  backupData
} from "./utilities";

// ===========================================
// SCHEDULED FUNCTIONS
// ===========================================
export {
  dailyCleanup,
  weeklyReports,
  monthlyAnalytics
} from "./scheduled";

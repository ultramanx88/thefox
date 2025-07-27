/**
 * Payment Processing Cloud Functions
 * Handles payment processing, webhooks, and refunds
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import * as crypto from "crypto";

const db = getFirestore();

// Mock payment gateway configuration
// In production, replace with actual payment provider (Stripe, Omise, etc.)
const PAYMENT_CONFIG = {
  apiKey: process.env.PAYMENT_API_KEY || 'mock_api_key',
  webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'mock_webhook_secret',
  currency: 'THB',
  supportedMethods: ['credit_card', 'bank_transfer', 'mobile_banking', 'cash_on_delivery'],
};

// ===========================================
// PAYMENT PROCESSING FUNCTIONS
// ===========================================

/**
 * Callable function to process payment
 * Handles different payment methods
 */
export const processPayment = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { orderId, paymentMethod, paymentData } = request.data;
    const userId = request.auth.uid;

    if (!orderId || !paymentMethod) {
      throw new HttpsError('invalid-argument', 'orderId and paymentMethod are required');
    }

    if (!PAYMENT_CONFIG.supportedMethods.includes(paymentMethod)) {
      throw new HttpsError('invalid-argument', 'Unsupported payment method');
    }

    try {
      // Get order details
      const orderDoc = await db.collection('orders').doc(orderId).get();
      const orderData = orderDoc.data();

      if (!orderDoc.exists || !orderData) {
        throw new HttpsError('not-found', 'Order not found');
      }

      // Verify user owns the order
      if (orderData.userId !== userId) {
        throw new HttpsError('permission-denied', 'Not authorized to pay for this order');
      }

      // Check order status
      if (orderData.paymentStatus === 'paid') {
        throw new HttpsError('failed-precondition', 'Order is already paid');
      }

      if (orderData.status === 'cancelled') {
        throw new HttpsError('failed-precondition', 'Cannot pay for cancelled order');
      }

      // Process payment based on method
      let paymentResult;
      switch (paymentMethod) {
        case 'credit_card':
          paymentResult = await processCreditCardPayment(orderData, paymentData);
          break;
        case 'bank_transfer':
          paymentResult = await processBankTransferPayment(orderData, paymentData);
          break;
        case 'mobile_banking':
          paymentResult = await processMobileBankingPayment(orderData, paymentData);
          break;
        case 'cash_on_delivery':
          paymentResult = await processCashOnDeliveryPayment(orderData);
          break;
        default:
          throw new HttpsError('invalid-argument', 'Invalid payment method');
      }

      // Create payment record
      const paymentRecord = {
        orderId,
        userId,
        amount: orderData.totalAmount,
        currency: PAYMENT_CONFIG.currency,
        method: paymentMethod,
        status: paymentResult.status,
        transactionId: paymentResult.transactionId,
        gatewayResponse: paymentResult.gatewayResponse,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const paymentRef = await db.collection('payments').add(paymentRecord);

      // Update order payment status
      await db.collection('orders').doc(orderId).update({
        paymentStatus: paymentResult.status,
        paymentId: paymentRef.id,
        paymentMethod,
        paidAt: paymentResult.status === 'paid' ? new Date() : null,
        updatedAt: new Date(),
      });

      // Send notifications
      if (paymentResult.status === 'paid') {
        await sendPaymentSuccessNotification(orderId, orderData);
      } else if (paymentResult.status === 'pending') {
        await sendPaymentPendingNotification(orderId, orderData, paymentMethod);
      }

      // Create analytics event
      await db.collection('analytics').add({
        type: 'payment_processed',
        orderId,
        userId,
        amount: orderData.totalAmount,
        method: paymentMethod,
        status: paymentResult.status,
        timestamp: new Date(),
      });

      logger.info("Payment processed", { 
        orderId,
        paymentId: paymentRef.id,
        method: paymentMethod,
        status: paymentResult.status,
        amount: orderData.totalAmount 
      });

      return {
        success: true,
        paymentId: paymentRef.id,
        status: paymentResult.status,
        transactionId: paymentResult.transactionId,
        message: getPaymentStatusMessage(paymentResult.status, paymentMethod),
      };

    } catch (error) {
      logger.error("Error processing payment", { 
        orderId,
        paymentMethod,
        userId,
        error: error instanceof Error ? error.message : error 
      });
      
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Payment processing failed');
    }
  }
);

/**
 * HTTP function to handle payment webhooks
 * Processes payment status updates from payment gateway
 */
export const handlePaymentWebhook = onRequest(
  { cors: true },
  async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).send('Method not allowed');
      return;
    }

    try {
      // Verify webhook signature
      const signature = request.headers['x-webhook-signature'] as string;
      const payload = JSON.stringify(request.body);
      
      if (!verifyWebhookSignature(payload, signature)) {
        logger.warn("Invalid webhook signature");
        response.status(401).send('Invalid signature');
        return;
      }

      const webhookData = request.body;
      const { event, data } = webhookData;

      logger.info("Webhook received", { event, transactionId: data.transactionId });

      switch (event) {
        case 'payment.succeeded':
          await handlePaymentSuccess(data);
          break;
        case 'payment.failed':
          await handlePaymentFailure(data);
          break;
        case 'payment.pending':
          await handlePaymentPending(data);
          break;
        case 'refund.succeeded':
          await handleRefundSuccess(data);
          break;
        case 'refund.failed':
          await handleRefundFailure(data);
          break;
        default:
          logger.warn("Unknown webhook event", { event });
      }

      response.status(200).send('OK');

    } catch (error) {
      logger.error("Error handling webhook", { 
        error: error instanceof Error ? error.message : error 
      });
      response.status(500).send('Internal server error');
    }
  }
);

/**
 * Callable function to refund payment
 * Only admins and market owners can initiate refunds
 */
export const refundPayment = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { paymentId, reason, amount } = request.data;
    const userId = request.auth.uid;
    const userRole = request.auth.token.role;

    if (!paymentId || !reason) {
      throw new HttpsError('invalid-argument', 'paymentId and reason are required');
    }

    try {
      // Get payment record
      const paymentDoc = await db.collection('payments').doc(paymentId).get();
      const paymentData = paymentDoc.data();

      if (!paymentDoc.exists || !paymentData) {
        throw new HttpsError('not-found', 'Payment not found');
      }

      // Check permissions
      const orderDoc = await db.collection('orders').doc(paymentData.orderId).get();
      const orderData = orderDoc.data();

      if (!orderData) {
        throw new HttpsError('not-found', 'Order not found');
      }

      const canRefund = 
        userRole === 'admin' ||
        (await isMarketOwner(userId, orderData.marketId));

      if (!canRefund) {
        throw new HttpsError('permission-denied', 'Not authorized to refund this payment');
      }

      // Check if payment can be refunded
      if (paymentData.status !== 'paid') {
        throw new HttpsError('failed-precondition', 'Only paid payments can be refunded');
      }

      // Check if already refunded
      const existingRefund = await db.collection('refunds')
        .where('paymentId', '==', paymentId)
        .where('status', '==', 'completed')
        .get();

      if (!existingRefund.empty) {
        throw new HttpsError('failed-precondition', 'Payment already refunded');
      }

      // Calculate refund amount
      const refundAmount = amount || paymentData.amount;
      if (refundAmount > paymentData.amount) {
        throw new HttpsError('invalid-argument', 'Refund amount cannot exceed payment amount');
      }

      // Process refund with payment gateway
      const refundResult = await processRefundWithGateway(
        paymentData.transactionId,
        refundAmount,
        reason
      );

      // Create refund record
      const refundRecord = {
        paymentId,
        orderId: paymentData.orderId,
        userId: paymentData.userId,
        amount: refundAmount,
        currency: paymentData.currency,
        reason,
        status: refundResult.status,
        refundId: refundResult.refundId,
        gatewayResponse: refundResult.gatewayResponse,
        initiatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const refundRef = await db.collection('refunds').add(refundRecord);

      // Update payment status if fully refunded
      if (refundAmount === paymentData.amount) {
        await db.collection('payments').doc(paymentId).update({
          status: 'refunded',
          refundedAt: new Date(),
          updatedAt: new Date(),
        });

        // Update order status
        await db.collection('orders').doc(paymentData.orderId).update({
          paymentStatus: 'refunded',
          status: 'cancelled',
          cancelReason: `Refunded: ${reason}`,
          updatedAt: new Date(),
        });
      }

      // Send notifications
      await sendRefundNotification(paymentData.orderId, orderData, refundAmount, reason);

      // Create analytics event
      await db.collection('analytics').add({
        type: 'refund_processed',
        orderId: paymentData.orderId,
        paymentId,
        refundId: refundRef.id,
        amount: refundAmount,
        reason,
        initiatedBy: userId,
        timestamp: new Date(),
      });

      logger.info("Refund processed", { 
        paymentId,
        refundId: refundRef.id,
        amount: refundAmount,
        reason,
        initiatedBy: userId 
      });

      return {
        success: true,
        refundId: refundRef.id,
        status: refundResult.status,
        amount: refundAmount,
        message: 'Refund processed successfully',
      };

    } catch (error) {
      logger.error("Error processing refund", { 
        paymentId,
        userId,
        error: error instanceof Error ? error.message : error 
      });
      
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Refund processing failed');
    }
  }
);

/**
 * Callable function to validate payment
 * Checks payment status and validity
 */
export const validatePayment = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { paymentId } = request.data;
    const userId = request.auth.uid;

    if (!paymentId) {
      throw new HttpsError('invalid-argument', 'paymentId is required');
    }

    try {
      const paymentDoc = await db.collection('payments').doc(paymentId).get();
      const paymentData = paymentDoc.data();

      if (!paymentDoc.exists || !paymentData) {
        throw new HttpsError('not-found', 'Payment not found');
      }

      // Check if user can access this payment
      const orderDoc = await db.collection('orders').doc(paymentData.orderId).get();
      const orderData = orderDoc.data();

      if (!orderData) {
        throw new HttpsError('not-found', 'Order not found');
      }

      const canAccess = 
        userId === paymentData.userId ||
        request.auth.token.role === 'admin' ||
        (await isMarketOwner(userId, orderData.marketId));

      if (!canAccess) {
        throw new HttpsError('permission-denied', 'Not authorized to access this payment');
      }

      // Get payment status from gateway
      const gatewayStatus = await getPaymentStatusFromGateway(paymentData.transactionId);

      // Update local status if different
      if (gatewayStatus.status !== paymentData.status) {
        await db.collection('payments').doc(paymentId).update({
          status: gatewayStatus.status,
          gatewayResponse: gatewayStatus.response,
          updatedAt: new Date(),
        });

        // Update order if needed
        if (gatewayStatus.status === 'paid' && paymentData.status !== 'paid') {
          await db.collection('orders').doc(paymentData.orderId).update({
            paymentStatus: 'paid',
            paidAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      return {
        paymentId,
        status: gatewayStatus.status,
        amount: paymentData.amount,
        currency: paymentData.currency,
        method: paymentData.method,
        transactionId: paymentData.transactionId,
        createdAt: paymentData.createdAt,
        isValid: gatewayStatus.status === 'paid',
      };

    } catch (error) {
      logger.error("Error validating payment", { 
        paymentId,
        userId,
        error: error instanceof Error ? error.message : error 
      });
      
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Payment validation failed');
    }
  }
);

// ===========================================
// PAYMENT METHOD IMPLEMENTATIONS
// ===========================================

async function processCreditCardPayment(orderData: any, paymentData: any) {
  // Mock credit card processing
  // In production, integrate with actual payment gateway
  logger.info("Processing credit card payment", { 
    orderId: orderData.id,
    amount: orderData.totalAmount 
  });

  // Simulate API call to payment gateway
  const mockResponse = {
    success: true,
    transactionId: `cc_${Date.now()}`,
    status: 'paid',
    gatewayResponse: {
      cardLast4: paymentData.cardLast4 || '1234',
      cardBrand: paymentData.cardBrand || 'visa',
      authCode: `AUTH${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    },
  };

  return {
    status: mockResponse.status,
    transactionId: mockResponse.transactionId,
    gatewayResponse: mockResponse.gatewayResponse,
  };
}

async function processBankTransferPayment(orderData: any, paymentData: any) {
  // Mock bank transfer processing
  logger.info("Processing bank transfer payment", { 
    orderId: orderData.id,
    amount: orderData.totalAmount 
  });

  return {
    status: 'pending', // Bank transfers usually require manual verification
    transactionId: `bt_${Date.now()}`,
    gatewayResponse: {
      bankCode: paymentData.bankCode || 'SCB',
      accountNumber: paymentData.accountNumber || '***1234',
      transferReference: `REF${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    },
  };
}

async function processMobileBankingPayment(orderData: any, paymentData: any) {
  // Mock mobile banking processing
  logger.info("Processing mobile banking payment", { 
    orderId: orderData.id,
    amount: orderData.totalAmount 
  });

  return {
    status: 'paid',
    transactionId: `mb_${Date.now()}`,
    gatewayResponse: {
      provider: paymentData.provider || 'promptpay',
      reference: `MB${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    },
  };
}

async function processCashOnDeliveryPayment(orderData: any) {
  // Cash on delivery doesn't require immediate payment processing
  logger.info("Processing cash on delivery", { 
    orderId: orderData.id,
    amount: orderData.totalAmount 
  });

  return {
    status: 'pending',
    transactionId: `cod_${Date.now()}`,
    gatewayResponse: {
      method: 'cash_on_delivery',
      note: 'Payment will be collected upon delivery',
    },
  };
}

// ===========================================
// WEBHOOK HANDLERS
// ===========================================

async function handlePaymentSuccess(data: any) {
  const { transactionId, amount, currency } = data;

  // Find payment by transaction ID
  const paymentsQuery = await db.collection('payments')
    .where('transactionId', '==', transactionId)
    .get();

  if (paymentsQuery.empty) {
    logger.warn("Payment not found for successful transaction", { transactionId });
    return;
  }

  const paymentDoc = paymentsQuery.docs[0];
  const paymentData = paymentDoc.data();

  // Update payment status
  await paymentDoc.ref.update({
    status: 'paid',
    paidAt: new Date(),
    updatedAt: new Date(),
  });

  // Update order
  await db.collection('orders').doc(paymentData.orderId).update({
    paymentStatus: 'paid',
    paidAt: new Date(),
    updatedAt: new Date(),
  });

  // Send success notification
  const orderDoc = await db.collection('orders').doc(paymentData.orderId).get();
  const orderData = orderDoc.data();
  
  if (orderData) {
    await sendPaymentSuccessNotification(paymentData.orderId, orderData);
  }

  logger.info("Payment success processed", { transactionId, paymentId: paymentDoc.id });
}

async function handlePaymentFailure(data: any) {
  const { transactionId, reason } = data;

  // Find payment by transaction ID
  const paymentsQuery = await db.collection('payments')
    .where('transactionId', '==', transactionId)
    .get();

  if (paymentsQuery.empty) {
    logger.warn("Payment not found for failed transaction", { transactionId });
    return;
  }

  const paymentDoc = paymentsQuery.docs[0];
  const paymentData = paymentDoc.data();

  // Update payment status
  await paymentDoc.ref.update({
    status: 'failed',
    failureReason: reason,
    updatedAt: new Date(),
  });

  // Update order
  await db.collection('orders').doc(paymentData.orderId).update({
    paymentStatus: 'failed',
    updatedAt: new Date(),
  });

  // Send failure notification
  const orderDoc = await db.collection('orders').doc(paymentData.orderId).get();
  const orderData = orderDoc.data();
  
  if (orderData) {
    await sendPaymentFailureNotification(paymentData.orderId, orderData, reason);
  }

  logger.info("Payment failure processed", { transactionId, paymentId: paymentDoc.id, reason });
}

async function handlePaymentPending(data: any) {
  const { transactionId } = data;

  // Find payment by transaction ID
  const paymentsQuery = await db.collection('payments')
    .where('transactionId', '==', transactionId)
    .get();

  if (paymentsQuery.empty) {
    logger.warn("Payment not found for pending transaction", { transactionId });
    return;
  }

  const paymentDoc = paymentsQuery.docs[0];
  
  // Update payment status
  await paymentDoc.ref.update({
    status: 'pending',
    updatedAt: new Date(),
  });

  logger.info("Payment pending processed", { transactionId, paymentId: paymentDoc.id });
}

async function handleRefundSuccess(data: any) {
  const { refundId, transactionId, amount } = data;

  // Find refund by refundId
  const refundsQuery = await db.collection('refunds')
    .where('refundId', '==', refundId)
    .get();

  if (refundsQuery.empty) {
    logger.warn("Refund not found for successful refund", { refundId });
    return;
  }

  const refundDoc = refundsQuery.docs[0];
  const refundData = refundDoc.data();

  // Update refund status
  await refundDoc.ref.update({
    status: 'completed',
    completedAt: new Date(),
    updatedAt: new Date(),
  });

  logger.info("Refund success processed", { refundId, transactionId, amount });
}

async function handleRefundFailure(data: any) {
  const { refundId, reason } = data;

  // Find refund by refundId
  const refundsQuery = await db.collection('refunds')
    .where('refundId', '==', refundId)
    .get();

  if (refundsQuery.empty) {
    logger.warn("Refund not found for failed refund", { refundId });
    return;
  }

  const refundDoc = refundsQuery.docs[0];

  // Update refund status
  await refundDoc.ref.update({
    status: 'failed',
    failureReason: reason,
    updatedAt: new Date(),
  });

  logger.info("Refund failure processed", { refundId, reason });
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function verifyWebhookSignature(payload: string, signature: string): boolean {
  // Mock signature verification
  // In production, use actual webhook secret and proper HMAC verification
  const expectedSignature = crypto
    .createHmac('sha256', PAYMENT_CONFIG.webhookSecret)
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}

async function processRefundWithGateway(transactionId: string, amount: number, reason: string) {
  // Mock refund processing with payment gateway
  logger.info("Processing refund with gateway", { transactionId, amount, reason });

  return {
    status: 'completed',
    refundId: `ref_${Date.now()}`,
    gatewayResponse: {
      originalTransactionId: transactionId,
      refundAmount: amount,
      reason,
      processedAt: new Date().toISOString(),
    },
  };
}

async function getPaymentStatusFromGateway(transactionId: string) {
  // Mock payment status check with gateway
  logger.info("Checking payment status with gateway", { transactionId });

  return {
    status: 'paid', // Mock status
    response: {
      transactionId,
      checkedAt: new Date().toISOString(),
    },
  };
}

async function isMarketOwner(userId: string, marketId: string): Promise<boolean> {
  const marketDoc = await db.collection('markets').doc(marketId).get();
  const marketData = marketDoc.data();
  return marketData?.ownerId === userId;
}

function getPaymentStatusMessage(status: string, method: string): string {
  const messages: { [key: string]: { [key: string]: string } } = {
    'paid': {
      'credit_card': 'ชำระเงินด้วยบัตรเครดิตสำเร็จ',
      'bank_transfer': 'ชำระเงินด้วยการโอนเงินสำเร็จ',
      'mobile_banking': 'ชำระเงินด้วยมือถือแบงก์กิ้งสำเร็จ',
      'cash_on_delivery': 'เลือกชำระเงินปลายทางสำเร็จ',
    },
    'pending': {
      'credit_card': 'กำลังดำเนินการชำระเงินด้วยบัตรเครดิต',
      'bank_transfer': 'รอการยืนยันการโอนเงิน',
      'mobile_banking': 'กำลังดำเนินการชำระเงินด้วยมือถือแบงก์กิ้ง',
      'cash_on_delivery': 'จะชำระเงินเมื่อได้รับสินค้า',
    },
    'failed': {
      'credit_card': 'การชำระเงินด้วยบัตรเครดิตล้มเหลว',
      'bank_transfer': 'การโอนเงินล้มเหลว',
      'mobile_banking': 'การชำระเงินด้วยมือถือแบงก์กิ้งล้มเหลว',
      'cash_on_delivery': 'เกิดข้อผิดพลาดในการเลือกชำระเงินปลายทาง',
    },
  };

  return messages[status]?.[method] || `Payment ${status}`;
}

// ===========================================
// NOTIFICATION FUNCTIONS
// ===========================================

async function sendPaymentSuccessNotification(orderId: string, orderData: any) {
  await db.collection('notifications').add({
    userId: orderData.userId,
    title: 'ชำระเงินสำเร็จ',
    message: `การชำระเงินสำหรับคำสั่งซื้อ #${orderId} สำเร็จแล้ว`,
    type: 'order',
    data: { orderId, status: 'paid' },
    isRead: false,
    createdAt: new Date(),
  });
}

async function sendPaymentPendingNotification(orderId: string, orderData: any, method: string) {
  await db.collection('notifications').add({
    userId: orderData.userId,
    title: 'รอการยืนยันการชำระเงิน',
    message: `การชำระเงินสำหรับคำสั่งซื้อ #${orderId} อยู่ระหว่างการดำเนินการ`,
    type: 'order',
    data: { orderId, status: 'pending', method },
    isRead: false,
    createdAt: new Date(),
  });
}

async function sendPaymentFailureNotification(orderId: string, orderData: any, reason: string) {
  await db.collection('notifications').add({
    userId: orderData.userId,
    title: 'การชำระเงินล้มเหลว',
    message: `การชำระเงินสำหรับคำสั่งซื้อ #${orderId} ล้มเหลว${reason ? ` เหตุผล: ${reason}` : ''}`,
    type: 'order',
    data: { orderId, status: 'failed', reason },
    isRead: false,
    createdAt: new Date(),
  });
}

async function sendRefundNotification(orderId: string, orderData: any, amount: number, reason: string) {
  await db.collection('notifications').add({
    userId: orderData.userId,
    title: 'เงินคืนสำเร็จ',
    message: `เงินคืนจำนวน ${amount} บาท สำหรับคำสั่งซื้อ #${orderId} สำเร็จแล้ว`,
    type: 'order',
    data: { orderId, status: 'refunded', amount, reason },
    isRead: false,
    createdAt: new Date(),
  });
}
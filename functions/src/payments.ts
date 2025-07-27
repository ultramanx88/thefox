import { onCall } from "firebase-functions/v2/https";
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const db = getFirestore();

// ===========================================
// PAYMENT PROCESSING FUNCTIONS
// ===========================================

/**
 * Process payment for an order
 * Integrates with payment gateway (PromptPay, Credit Card, etc.)
 */
export const processPayment = onCall<{
  orderId: string;
  paymentMethod: string;
  paymentData: any;
}>({ 
  cors: true 
}, async (request) => {
  const { orderId, paymentMethod, paymentData } = request.data;
  const userId = request.auth?.uid;
  
  try {
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    logger.info("Processing payment", { orderId, paymentMethod, userId });
    
    // Get order document
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new Error("Order not found");
    }
    
    const orderData = orderDoc.data();
    
    // Verify order belongs to user
    if (orderData?.userId !== userId) {
      throw new Error("Unauthorized access to order");
    }
    
    // Check if order is in valid state for payment
    const validStatuses = ['pending', 'confirmed'];
    if (!validStatuses.includes(orderData?.status)) {
      throw new Error(`Cannot process payment for order in ${orderData?.status} status`);
    }
    
    // Check if payment already processed
    if (orderData?.paymentStatus === 'paid') {
      throw new Error("Payment already processed for this order");
    }
    
    const amount = orderData?.finalAmount;
    if (!amount || amount <= 0) {
      throw new Error("Invalid order amount");
    }
    
    // Process payment based on method
    let paymentResult;
    switch (paymentMethod) {
      case 'promptpay':
        paymentResult = await processPromptPayPayment(orderId, amount, paymentData);
        break;
      case 'credit_card':
        paymentResult = await processCreditCardPayment(orderId, amount, paymentData);
        break;
      case 'bank_transfer':
        paymentResult = await processBankTransferPayment(orderId, amount, paymentData);
        break;
      case 'cash_on_delivery':
        paymentResult = await processCashOnDeliveryPayment(orderId, amount);
        break;
      default:
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }
    
    // Update order with payment information
    await db.collection('orders').doc(orderId).update({
      paymentStatus: paymentResult.status,
      paymentMethod,
      paymentId: paymentResult.paymentId,
      paymentData: paymentResult.data,
      paidAt: paymentResult.status === 'paid' ? new Date() : null,
      updatedAt: new Date(),
    });
    
    // Create payment record
    await db.collection('payments').add({
      orderId,
      userId,
      amount,
      currency: 'THB',
      method: paymentMethod,
      status: paymentResult.status,
      paymentId: paymentResult.paymentId,
      gatewayResponse: paymentResult.data,
      createdAt: new Date(),
    });
    
    logger.info("Payment processed successfully", { 
      orderId, 
      paymentMethod, 
      status: paymentResult.status,
      paymentId: paymentResult.paymentId
    });
    
    return {
      success: true,
      paymentId: paymentResult.paymentId,
      status: paymentResult.status,
      message: paymentResult.message,
    };
    
  } catch (error) {
    logger.error("Error processing payment", { 
      orderId, 
      paymentMethod, 
      userId,
      error: error instanceof Error ? error.message : error 
    });
    
    // Update order with payment failure
    if (orderId) {
      await db.collection('orders').doc(orderId).update({
        paymentStatus: 'failed',
        paymentError: error instanceof Error ? error.message : 'Payment failed',
        updatedAt: new Date(),
      });
    }
    
    throw error;
  }
});

/**
 * Handle payment webhook from payment gateway
 */
export const handlePaymentWebhook = onRequest({ 
  cors: true 
}, async (request, response) => {
  try {
    const webhookData = request.body;
    const signature = request.headers['x-webhook-signature'] as string;
    
    logger.info("Received payment webhook", { 
      type: webhookData.type,
      paymentId: webhookData.payment_id 
    });
    
    // Verify webhook signature (implement based on payment gateway)
    if (!verifyWebhookSignature(webhookData, signature)) {
      logger.warn("Invalid webhook signature");
      response.status(401).send("Unauthorized");
      return;
    }
    
    const { type, payment_id, order_id } = webhookData;
    
    // Process webhook based on type
    switch (type) {
      case 'payment.completed':
        await handlePaymentCompleted(payment_id, order_id);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payment_id, order_id, webhookData.error);
        break;
      case 'payment.refunded':
        await handlePaymentRefunded(payment_id, order_id, webhookData.refund_amount);
        break;
      default:
        logger.warn("Unknown webhook type", { type });
    }
    
    response.status(200).send("OK");
    
  } catch (error) {
    logger.error("Error handling payment webhook", { 
      error: error instanceof Error ? error.message : error 
    });
    response.status(500).send("Internal Server Error");
  }
});

/**
 * Refund payment for cancelled order
 */
export const refundPayment = onCall<{
  orderId: string;
  amount?: number;
  reason: string;
}>({ 
  cors: true 
}, async (request) => {
  const { orderId, amount, reason } = request.data;
  const userId = request.auth?.uid;
  
  try {
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    logger.info("Processing refund", { orderId, amount, reason, userId });
    
    // Get order document
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new Error("Order not found");
    }
    
    const orderData = orderDoc.data();
    
    // Verify permissions (admin or market owner)
    const isAdmin = await verifyAdminRole(userId);
    const isMarketOwner = await verifyMarketOwner(userId, orderData?.marketId);
    
    if (!isAdmin && !isMarketOwner) {
      throw new Error("Insufficient permissions for refund");
    }
    
    // Check if order is paid
    if (orderData?.paymentStatus !== 'paid') {
      throw new Error("Cannot refund unpaid order");
    }
    
    // Get payment record
    const paymentSnapshot = await db.collection('payments')
      .where('orderId', '==', orderId)
      .where('status', '==', 'paid')
      .limit(1)
      .get();
    
    if (paymentSnapshot.empty) {
      throw new Error("Payment record not found");
    }
    
    const paymentData = paymentSnapshot.docs[0].data();
    const refundAmount = amount || paymentData.amount;
    
    if (refundAmount > paymentData.amount) {
      throw new Error("Refund amount cannot exceed payment amount");
    }
    
    // Process refund based on payment method
    let refundResult;
    switch (paymentData.method) {
      case 'promptpay':
        refundResult = await processPromptPayRefund(paymentData.paymentId, refundAmount);
        break;
      case 'credit_card':
        refundResult = await processCreditCardRefund(paymentData.paymentId, refundAmount);
        break;
      case 'bank_transfer':
        refundResult = await processBankTransferRefund(paymentData.paymentId, refundAmount);
        break;
      default:
        throw new Error(`Refund not supported for payment method: ${paymentData.method}`);
    }
    
    // Create refund record
    await db.collection('refunds').add({
      orderId,
      paymentId: paymentData.paymentId,
      originalAmount: paymentData.amount,
      refundAmount,
      reason,
      status: refundResult.status,
      refundId: refundResult.refundId,
      processedBy: userId,
      createdAt: new Date(),
    });
    
    // Update order status
    await db.collection('orders').doc(orderId).update({
      paymentStatus: refundAmount === paymentData.amount ? 'refunded' : 'partially_refunded',
      refundAmount,
      refundedAt: new Date(),
      updatedAt: new Date(),
    });
    
    logger.info("Refund processed successfully", { 
      orderId, 
      refundAmount, 
      refundId: refundResult.refundId 
    });
    
    return {
      success: true,
      refundId: refundResult.refundId,
      amount: refundAmount,
      message: "Refund processed successfully",
    };
    
  } catch (error) {
    logger.error("Error processing refund", { 
      orderId, 
      amount, 
      userId,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Validate payment status
 */
export const validatePayment = onCall<{
  paymentId: string;
}>({ 
  cors: true 
}, async (request) => {
  const { paymentId } = request.data;
  
  try {
    // Get payment record
    const paymentSnapshot = await db.collection('payments')
      .where('paymentId', '==', paymentId)
      .limit(1)
      .get();
    
    if (paymentSnapshot.empty) {
      return {
        valid: false,
        message: "Payment not found",
      };
    }
    
    const paymentData = paymentSnapshot.docs[0].data();
    
    // Validate with payment gateway
    const gatewayStatus = await validatePaymentWithGateway(paymentId, paymentData.method);
    
    return {
      valid: gatewayStatus.valid,
      status: gatewayStatus.status,
      amount: paymentData.amount,
      orderId: paymentData.orderId,
      message: gatewayStatus.message,
    };
    
  } catch (error) {
    logger.error("Error validating payment", { 
      paymentId,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

// ===========================================
// PAYMENT METHOD IMPLEMENTATIONS
// ===========================================

async function processPromptPayPayment(orderId: string, amount: number, paymentData: any) {
  // Implement PromptPay payment processing
  // This would integrate with Thai payment gateway like 2C2P, Omise, etc.
  
  logger.info("Processing PromptPay payment", { orderId, amount });
  
  // Simulate payment processing
  const paymentId = `pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // In real implementation, this would:
  // 1. Generate QR code for PromptPay
  // 2. Wait for payment confirmation
  // 3. Return payment status
  
  return {
    status: 'pending', // Would be 'paid' when confirmed
    paymentId,
    message: "PromptPay QR code generated. Please scan to pay.",
    data: {
      qrCode: `promptpay://qr/${paymentId}`,
      amount,
      reference: orderId,
    },
  };
}

async function processCreditCardPayment(orderId: string, amount: number, paymentData: any) {
  logger.info("Processing credit card payment", { orderId, amount });
  
  // Simulate credit card processing
  const paymentId = `cc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // In real implementation, this would:
  // 1. Validate card details
  // 2. Process payment with gateway
  // 3. Return payment result
  
  return {
    status: 'paid',
    paymentId,
    message: "Credit card payment processed successfully",
    data: {
      cardLast4: paymentData.cardNumber?.slice(-4),
      authCode: `AUTH${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    },
  };
}

async function processBankTransferPayment(orderId: string, amount: number, paymentData: any) {
  logger.info("Processing bank transfer payment", { orderId, amount });
  
  const paymentId = `bt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    status: 'pending',
    paymentId,
    message: "Bank transfer details provided. Payment pending confirmation.",
    data: {
      bankAccount: "123-456-7890",
      bankName: "Kasikorn Bank",
      reference: orderId,
    },
  };
}

async function processCashOnDeliveryPayment(orderId: string, amount: number) {
  logger.info("Processing cash on delivery", { orderId, amount });
  
  const paymentId = `cod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    status: 'pending',
    paymentId,
    message: "Cash on delivery selected. Payment will be collected upon delivery.",
    data: {
      amount,
      currency: 'THB',
    },
  };
}

// ===========================================
// REFUND IMPLEMENTATIONS
// ===========================================

async function processPromptPayRefund(paymentId: string, amount: number) {
  logger.info("Processing PromptPay refund", { paymentId, amount });
  
  const refundId = `pp_refund_${Date.now()}`;
  
  return {
    status: 'processed',
    refundId,
    message: "PromptPay refund processed",
  };
}

async function processCreditCardRefund(paymentId: string, amount: number) {
  logger.info("Processing credit card refund", { paymentId, amount });
  
  const refundId = `cc_refund_${Date.now()}`;
  
  return {
    status: 'processed',
    refundId,
    message: "Credit card refund processed",
  };
}

async function processBankTransferRefund(paymentId: string, amount: number) {
  logger.info("Processing bank transfer refund", { paymentId, amount });
  
  const refundId = `bt_refund_${Date.now()}`;
  
  return {
    status: 'processed',
    refundId,
    message: "Bank transfer refund processed",
  };
}

// ===========================================
// WEBHOOK HANDLERS
// ===========================================

async function handlePaymentCompleted(paymentId: string, orderId: string) {
  try {
    logger.info("Handling payment completion", { paymentId, orderId });
    
    // Update payment record
    const paymentSnapshot = await db.collection('payments')
      .where('paymentId', '==', paymentId)
      .limit(1)
      .get();
    
    if (!paymentSnapshot.empty) {
      await paymentSnapshot.docs[0].ref.update({
        status: 'paid',
        paidAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    // Update order
    await db.collection('orders').doc(orderId).update({
      paymentStatus: 'paid',
      paidAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Send notification
    const orderDoc = await db.collection('orders').doc(orderId).get();
    const orderData = orderDoc.data();
    
    if (orderData?.userId) {
      await db.collection('notifications').add({
        userId: orderData.userId,
        title: 'Payment Confirmed',
        message: 'Your payment has been confirmed. Your order is being processed.',
        type: 'payment',
        data: { orderId, paymentId },
        isRead: false,
        createdAt: new Date(),
      });
    }
    
  } catch (error) {
    logger.error("Error handling payment completion", { paymentId, orderId, error });
  }
}

async function handlePaymentFailed(paymentId: string, orderId: string, errorData: any) {
  try {
    logger.info("Handling payment failure", { paymentId, orderId });
    
    // Update payment record
    const paymentSnapshot = await db.collection('payments')
      .where('paymentId', '==', paymentId)
      .limit(1)
      .get();
    
    if (!paymentSnapshot.empty) {
      await paymentSnapshot.docs[0].ref.update({
        status: 'failed',
        error: errorData,
        updatedAt: new Date(),
      });
    }
    
    // Update order
    await db.collection('orders').doc(orderId).update({
      paymentStatus: 'failed',
      paymentError: errorData.message || 'Payment failed',
      updatedAt: new Date(),
    });
    
  } catch (error) {
    logger.error("Error handling payment failure", { paymentId, orderId, error });
  }
}

async function handlePaymentRefunded(paymentId: string, orderId: string, refundAmount: number) {
  try {
    logger.info("Handling payment refund", { paymentId, orderId, refundAmount });
    
    // Update order
    await db.collection('orders').doc(orderId).update({
      paymentStatus: 'refunded',
      refundAmount,
      refundedAt: new Date(),
      updatedAt: new Date(),
    });
    
  } catch (error) {
    logger.error("Error handling payment refund", { paymentId, orderId, error });
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function verifyWebhookSignature(data: any, signature: string): boolean {
  // Implement webhook signature verification
  // This would use the payment gateway's signature verification method
  logger.info("Verifying webhook signature", { signature });
  return true; // Simplified for demo
}

async function validatePaymentWithGateway(paymentId: string, method: string) {
  // Validate payment status with payment gateway
  logger.info("Validating payment with gateway", { paymentId, method });
  
  return {
    valid: true,
    status: 'paid',
    message: 'Payment validated successfully',
  };
}

async function verifyAdminRole(userId: string): Promise<boolean> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    return userData?.role === 'admin';
  } catch (error) {
    return false;
  }
}

async function verifyMarketOwner(userId: string, marketId: string): Promise<boolean> {
  try {
    const marketDoc = await db.collection('markets').doc(marketId).get();
    const marketData = marketDoc.data();
    return marketData?.ownerId === userId;
  } catch (error) {
    return false;
  }
}
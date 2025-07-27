/**
 * Order Processing Cloud Functions
 * Handles order lifecycle, status updates, and business logic
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

const db = getFirestore();

// ===========================================
// ORDER CREATION AND MANAGEMENT
// ===========================================

/**
 * Callable function to create a new order
 * Validates order data and calculates totals
 */
export const createOrder = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    const { marketId, items, deliveryAddress, paymentMethod, notes } = request.data;

    // Validate required fields
    if (!marketId || !items || !Array.isArray(items) || items.length === 0) {
      throw new HttpsError('invalid-argument', 'marketId and items are required');
    }

    if (!deliveryAddress || !paymentMethod) {
      throw new HttpsError('invalid-argument', 'deliveryAddress and paymentMethod are required');
    }

    try {
      // Validate market exists and is open
      const marketDoc = await db.collection('markets').doc(marketId).get();
      const marketData = marketDoc.data();

      if (!marketDoc.exists || !marketData) {
        throw new HttpsError('not-found', 'Market not found');
      }

      if (!marketData.isOpen) {
        throw new HttpsError('failed-precondition', 'Market is currently closed');
      }

      // Validate and calculate order items
      let subtotal = 0;
      const validatedItems = [];

      for (const item of items) {
        const productDoc = await db.collection('products').doc(item.productId).get();
        const productData = productDoc.data();

        if (!productDoc.exists || !productData) {
          throw new HttpsError('not-found', `Product ${item.productId} not found`);
        }

        if (!productData.inStock) {
          throw new HttpsError('failed-precondition', `Product ${productData.name} is out of stock`);
        }

        if (productData.marketId !== marketId) {
          throw new HttpsError('invalid-argument', `Product ${productData.name} does not belong to this market`);
        }

        const itemSubtotal = productData.price * item.quantity;
        subtotal += itemSubtotal;

        validatedItems.push({
          productId: item.productId,
          name: productData.name,
          price: productData.price,
          quantity: item.quantity,
          subtotal: itemSubtotal,
          unit: productData.unit,
        });
      }

      // Calculate delivery fee
      const deliveryFee = await calculateDeliveryFeeInternal(marketData.location, deliveryAddress);

      // Calculate total
      const totalAmount = subtotal + deliveryFee;

      // Create order document
      const orderData = {
        userId,
        marketId,
        marketName: marketData.name,
        items: validatedItems,
        subtotal,
        deliveryFee,
        totalAmount,
        deliveryAddress,
        paymentMethod,
        paymentStatus: 'pending',
        status: 'pending',
        notes: notes || '',
        estimatedDeliveryTime: calculateEstimatedDeliveryTime(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const orderRef = await db.collection('orders').add(orderData);

      // Update product quantities
      const batch = db.batch();
      for (const item of validatedItems) {
        const productRef = db.collection('products').doc(item.productId);
        batch.update(productRef, {
          quantity: FieldValue.increment(-item.quantity),
          updatedAt: new Date(),
        });
      }
      await batch.commit();

      // Create notifications
      await Promise.all([
        // Notify customer
        db.collection('notifications').add({
          userId,
          title: 'คำสั่งซื้อได้รับการยืนยันแล้ว',
          message: `คำสั่งซื้อ #${orderRef.id} จาก ${marketData.name} ได้รับการยืนยันแล้ว`,
          type: 'order',
          data: { orderId: orderRef.id },
          isRead: false,
          createdAt: new Date(),
        }),
        // Notify market owner
        db.collection('notifications').add({
          userId: marketData.ownerId,
          title: 'คำสั่งซื้อใหม่',
          message: `มีคำสั่งซื้อใหม่ #${orderRef.id} รอการยืนยัน`,
          type: 'order',
          data: { orderId: orderRef.id },
          isRead: false,
          createdAt: new Date(),
        }),
      ]);

      logger.info("Order created successfully", { 
        orderId: orderRef.id,
        userId,
        marketId,
        totalAmount 
      });

      return {
        success: true,
        orderId: orderRef.id,
        totalAmount,
        estimatedDeliveryTime: orderData.estimatedDeliveryTime,
      };

    } catch (error) {
      logger.error("Error creating order", { 
        userId,
        marketId,
        error: error instanceof Error ? error.message : error 
      });
      
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to create order');
    }
  }
);

/**
 * Callable function to update order status
 * Only market owners, drivers, and admins can update
 */
export const updateOrderStatus = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { orderId, status, reason, driverId } = request.data;
    const userId = request.auth.uid;
    const userRole = request.auth.token.role;

    if (!orderId || !status) {
      throw new HttpsError('invalid-argument', 'orderId and status are required');
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new HttpsError('invalid-argument', 'Invalid status');
    }

    try {
      // Get order document
      const orderDoc = await db.collection('orders').doc(orderId).get();
      const orderData = orderDoc.data();

      if (!orderDoc.exists || !orderData) {
        throw new HttpsError('not-found', 'Order not found');
      }

      // Check permissions
      const marketDoc = await db.collection('markets').doc(orderData.marketId).get();
      const marketData = marketDoc.data();

      const canUpdate = 
        userRole === 'admin' ||
        userId === marketData?.ownerId ||
        (userRole === 'driver' && userId === orderData.driverId);

      if (!canUpdate) {
        throw new HttpsError('permission-denied', 'Not authorized to update this order');
      }

      // Validate status transition
      const currentStatus = orderData.status;
      if (!isValidStatusTransition(currentStatus, status)) {
        throw new HttpsError('failed-precondition', `Cannot change status from ${currentStatus} to ${status}`);
      }

      // Update order
      const updateData: any = {
        status,
        updatedAt: new Date(),
        updatedBy: userId,
      };

      if (reason) {
        updateData.statusReason = reason;
      }

      if (status === 'delivering' && driverId) {
        updateData.driverId = driverId;
        updateData.deliveryStartedAt = new Date();
      }

      if (status === 'delivered') {
        updateData.deliveredAt = new Date();
      }

      if (status === 'cancelled') {
        updateData.cancelledAt = new Date();
        updateData.cancelReason = reason;
      }

      await db.collection('orders').doc(orderId).update(updateData);

      // Create status history entry
      await db.collection('orders').doc(orderId).collection('statusHistory').add({
        status,
        previousStatus: currentStatus,
        reason,
        updatedBy: userId,
        updatedAt: new Date(),
      });

      // Send notifications based on status
      await sendOrderStatusNotification(orderId, status, orderData, marketData);

      logger.info("Order status updated", { 
        orderId,
        previousStatus: currentStatus,
        newStatus: status,
        updatedBy: userId 
      });

      return {
        success: true,
        message: 'Order status updated successfully',
        newStatus: status,
      };

    } catch (error) {
      logger.error("Error updating order status", { 
        orderId,
        status,
        userId,
        error: error instanceof Error ? error.message : error 
      });
      
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to update order status');
    }
  }
);

/**
 * Callable function to calculate delivery fee
 * Based on distance and market settings
 */
export const calculateDeliveryFee = onCall(
  { cors: true },
  async (request) => {
    const { marketId, deliveryAddress } = request.data;

    if (!marketId || !deliveryAddress) {
      throw new HttpsError('invalid-argument', 'marketId and deliveryAddress are required');
    }

    try {
      const marketDoc = await db.collection('markets').doc(marketId).get();
      const marketData = marketDoc.data();

      if (!marketDoc.exists || !marketData) {
        throw new HttpsError('not-found', 'Market not found');
      }

      const deliveryFee = await calculateDeliveryFeeInternal(marketData.location, deliveryAddress);

      return {
        deliveryFee,
        currency: 'THB',
      };

    } catch (error) {
      logger.error("Error calculating delivery fee", { 
        marketId,
        error: error instanceof Error ? error.message : error 
      });
      
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to calculate delivery fee');
    }
  }
);

/**
 * Callable function to cancel order
 * Users can cancel their own orders within time limit
 */
export const cancelOrder = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { orderId, reason } = request.data;
    const userId = request.auth.uid;
    const userRole = request.auth.token.role;

    if (!orderId) {
      throw new HttpsError('invalid-argument', 'orderId is required');
    }

    try {
      const orderDoc = await db.collection('orders').doc(orderId).get();
      const orderData = orderDoc.data();

      if (!orderDoc.exists || !orderData) {
        throw new HttpsError('not-found', 'Order not found');
      }

      // Check permissions
      const canCancel = 
        userRole === 'admin' ||
        userId === orderData.userId ||
        (await isMarketOwner(userId, orderData.marketId));

      if (!canCancel) {
        throw new HttpsError('permission-denied', 'Not authorized to cancel this order');
      }

      // Check if order can be cancelled
      const cancellableStatuses = ['pending', 'confirmed', 'preparing'];
      if (!cancellableStatuses.includes(orderData.status)) {
        throw new HttpsError('failed-precondition', 'Order cannot be cancelled at this stage');
      }

      // Check time limit for customer cancellation (15 minutes)
      if (userId === orderData.userId && userRole === 'customer') {
        const orderTime = orderData.createdAt.toDate();
        const now = new Date();
        const timeDiff = (now.getTime() - orderTime.getTime()) / (1000 * 60); // minutes

        if (timeDiff > 15) {
          throw new HttpsError('failed-precondition', 'Order can only be cancelled within 15 minutes of placement');
        }
      }

      // Update order status
      await db.collection('orders').doc(orderId).update({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancelReason: reason || 'No reason provided',
        updatedAt: new Date(),
      });

      // Restore product quantities
      const batch = db.batch();
      for (const item of orderData.items) {
        const productRef = db.collection('products').doc(item.productId);
        batch.update(productRef, {
          quantity: FieldValue.increment(item.quantity),
          updatedAt: new Date(),
        });
      }
      await batch.commit();

      // Send notifications
      await sendOrderCancellationNotification(orderId, orderData, reason);

      logger.info("Order cancelled", { 
        orderId,
        cancelledBy: userId,
        reason 
      });

      return {
        success: true,
        message: 'Order cancelled successfully',
      };

    } catch (error) {
      logger.error("Error cancelling order", { 
        orderId,
        userId,
        error: error instanceof Error ? error.message : error 
      });
      
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to cancel order');
    }
  }
);

// ===========================================
// ORDER EVENT HANDLERS
// ===========================================

/**
 * Triggered when a new order is created
 * Handles post-creation logic
 */
export const onOrderCreated = onDocumentCreated(
  "orders/{orderId}",
  async (event) => {
    const orderId = event.params.orderId;
    const orderData = event.data?.data();

    if (!orderData) {
      logger.error("No order data found", { orderId });
      return;
    }

    try {
      // Update market statistics
      await db.collection('markets').doc(orderData.marketId).update({
        totalOrders: FieldValue.increment(1),
        totalRevenue: FieldValue.increment(orderData.totalAmount),
        lastOrderAt: new Date(),
        updatedAt: new Date(),
      });

      // Update user statistics
      await db.collection('users').doc(orderData.userId).update({
        totalOrders: FieldValue.increment(1),
        totalSpent: FieldValue.increment(orderData.totalAmount),
        lastOrderAt: new Date(),
        updatedAt: new Date(),
      });

      // Create analytics event
      await db.collection('analytics').add({
        type: 'order_created',
        orderId,
        userId: orderData.userId,
        marketId: orderData.marketId,
        amount: orderData.totalAmount,
        itemCount: orderData.items.length,
        timestamp: new Date(),
      });

      logger.info("Order creation processed", { orderId });

    } catch (error) {
      logger.error("Error processing order creation", { 
        orderId,
        error: error instanceof Error ? error.message : error 
      });
    }
  }
);

/**
 * Triggered when an order is updated
 * Handles status change logic
 */
export const onOrderUpdated = onDocumentUpdated(
  "orders/{orderId}",
  async (event) => {
    const orderId = event.params.orderId;
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
      logger.error("Missing order data", { orderId });
      return;
    }

    // Check if status changed
    if (beforeData.status !== afterData.status) {
      try {
        // Create analytics event for status change
        await db.collection('analytics').add({
          type: 'order_status_changed',
          orderId,
          userId: afterData.userId,
          marketId: afterData.marketId,
          previousStatus: beforeData.status,
          newStatus: afterData.status,
          timestamp: new Date(),
        });

        // Handle specific status changes
        if (afterData.status === 'delivered') {
          // Update delivery statistics
          await updateDeliveryStats(orderId, afterData);
        }

        if (afterData.status === 'cancelled') {
          // Update cancellation statistics
          await updateCancellationStats(orderId, afterData);
        }

        logger.info("Order status change processed", { 
          orderId,
          previousStatus: beforeData.status,
          newStatus: afterData.status 
        });

      } catch (error) {
        logger.error("Error processing order status change", { 
          orderId,
          error: error instanceof Error ? error.message : error 
        });
      }
    }
  }
);

// ===========================================
// HELPER FUNCTIONS
// ===========================================

async function calculateDeliveryFeeInternal(marketLocation: any, deliveryAddress: any): Promise<number> {
  // Simple distance-based calculation
  // In production, you might use Google Maps API or similar
  const baseDeliveryFee = 25; // THB
  const perKmRate = 5; // THB per km
  
  // Mock distance calculation (replace with actual implementation)
  const distance = 3; // km
  
  return baseDeliveryFee + (distance * perKmRate);
}

function calculateEstimatedDeliveryTime(): Date {
  const now = new Date();
  // Add 45 minutes for preparation and delivery
  now.setMinutes(now.getMinutes() + 45);
  return now;
}

function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const validTransitions: { [key: string]: string[] } = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['preparing', 'cancelled'],
    'preparing': ['ready', 'cancelled'],
    'ready': ['delivering'],
    'delivering': ['delivered'],
    'delivered': [],
    'cancelled': [],
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

async function isMarketOwner(userId: string, marketId: string): Promise<boolean> {
  const marketDoc = await db.collection('markets').doc(marketId).get();
  const marketData = marketDoc.data();
  return marketData?.ownerId === userId;
}

async function sendOrderStatusNotification(
  orderId: string, 
  status: string, 
  orderData: any, 
  marketData: any
): Promise<void> {
  const statusMessages: { [key: string]: { title: string; message: string } } = {
    'confirmed': {
      title: 'คำสั่งซื้อได้รับการยืนยัน',
      message: `คำสั่งซื้อ #${orderId} ได้รับการยืนยันจาก ${marketData.name}`,
    },
    'preparing': {
      title: 'กำลังเตรียมคำสั่งซื้อ',
      message: `${marketData.name} กำลังเตรียมคำสั่งซื้อ #${orderId}`,
    },
    'ready': {
      title: 'คำสั่งซื้อพร้อมส่ง',
      message: `คำสั่งซื้อ #${orderId} พร้อมส่งแล้ว`,
    },
    'delivering': {
      title: 'กำลังจัดส่ง',
      message: `คำสั่งซื้อ #${orderId} กำลังอยู่ระหว่างการจัดส่ง`,
    },
    'delivered': {
      title: 'จัดส่งสำเร็จ',
      message: `คำสั่งซื้อ #${orderId} จัดส่งสำเร็จแล้ว`,
    },
  };

  const notification = statusMessages[status];
  if (notification) {
    await db.collection('notifications').add({
      userId: orderData.userId,
      title: notification.title,
      message: notification.message,
      type: 'order',
      data: { orderId, status },
      isRead: false,
      createdAt: new Date(),
    });
  }
}

async function sendOrderCancellationNotification(
  orderId: string, 
  orderData: any, 
  reason?: string
): Promise<void> {
  // Notify customer
  await db.collection('notifications').add({
    userId: orderData.userId,
    title: 'คำสั่งซื้อถูกยกเลิก',
    message: `คำสั่งซื้อ #${orderId} ถูกยกเลิกแล้ว${reason ? ` เหตุผล: ${reason}` : ''}`,
    type: 'order',
    data: { orderId, status: 'cancelled' },
    isRead: false,
    createdAt: new Date(),
  });

  // Notify market owner
  const marketDoc = await db.collection('markets').doc(orderData.marketId).get();
  const marketData = marketDoc.data();
  
  if (marketData) {
    await db.collection('notifications').add({
      userId: marketData.ownerId,
      title: 'คำสั่งซื้อถูกยกเลิก',
      message: `คำสั่งซื้อ #${orderId} ถูกยกเลิกแล้ว${reason ? ` เหตุผล: ${reason}` : ''}`,
      type: 'order',
      data: { orderId, status: 'cancelled' },
      isRead: false,
      createdAt: new Date(),
    });
  }
}

async function updateDeliveryStats(orderId: string, orderData: any): Promise<void> {
  const deliveryTime = orderData.deliveredAt.toDate().getTime() - orderData.createdAt.toDate().getTime();
  const deliveryTimeMinutes = Math.round(deliveryTime / (1000 * 60));

  await db.collection('deliveryStats').add({
    orderId,
    marketId: orderData.marketId,
    driverId: orderData.driverId,
    deliveryTimeMinutes,
    distance: 3, // Mock distance
    deliveryFee: orderData.deliveryFee,
    timestamp: new Date(),
  });
}

async function updateCancellationStats(orderId: string, orderData: any): Promise<void> {
  await db.collection('cancellationStats').add({
    orderId,
    marketId: orderData.marketId,
    userId: orderData.userId,
    reason: orderData.cancelReason,
    cancelledBy: orderData.cancelledBy,
    orderValue: orderData.totalAmount,
    timestamp: new Date(),
  });
}
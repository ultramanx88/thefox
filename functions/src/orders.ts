import { onCall } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const db = getFirestore();

// ===========================================
// ORDER CREATION AND MANAGEMENT
// ===========================================

/**
 * Create a new order with validation and inventory checks
 */
export const createOrder = onCall<{
  marketId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  deliveryAddress: any;
  paymentMethod: string;
  notes?: string;
}>({ 
  cors: true 
}, async (request) => {
  const { marketId, items, deliveryAddress, paymentMethod, notes } = request.data;
  const userId = request.auth?.uid;
  
  try {
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    logger.info("Creating order", { userId, marketId, itemCount: items.length });
    
    // Validate market exists and is open
    const marketDoc = await db.collection('markets').doc(marketId).get();
    if (!marketDoc.exists) {
      throw new Error("Market not found");
    }
    
    const marketData = marketDoc.data();
    if (!marketData?.isOpen) {
      throw new Error("Market is currently closed");
    }
    
    // Validate and calculate order items
    let totalAmount = 0;
    const validatedItems = [];
    
    for (const item of items) {
      const productDoc = await db.collection('products').doc(item.productId).get();
      
      if (!productDoc.exists) {
        throw new Error(`Product ${item.productId} not found`);
      }
      
      const productData = productDoc.data();
      
      if (!productData?.inStock) {
        throw new Error(`Product ${productData?.name} is out of stock`);
      }
      
      if (productData.marketId !== marketId) {
        throw new Error(`Product ${productData?.name} does not belong to this market`);
      }
      
      // Check quantity availability
      if (productData.quantity && productData.quantity < item.quantity) {
        throw new Error(`Insufficient quantity for ${productData?.name}. Available: ${productData.quantity}`);
      }
      
      const subtotal = item.quantity * productData.price;
      totalAmount += subtotal;
      
      validatedItems.push({
        productId: item.productId,
        name: productData.name,
        price: productData.price,
        quantity: item.quantity,
        subtotal,
        unit: productData.unit || 'piece',
      });
    }
    
    // Calculate delivery fee
    const deliveryFee = await calculateDeliveryFeeInternal(marketId, deliveryAddress);
    const finalAmount = totalAmount + deliveryFee;
    
    // Create order document
    const orderData = {
      userId,
      marketId,
      items: validatedItems,
      status: 'pending',
      totalAmount,
      deliveryFee,
      finalAmount,
      deliveryAddress,
      paymentMethod,
      paymentStatus: 'pending',
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedDeliveryTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    };
    
    const orderRef = await db.collection('orders').add(orderData);
    
    // Update product quantities
    const batch = db.batch();
    for (const item of items) {
      const productRef = db.collection('products').doc(item.productId);
      batch.update(productRef, {
        quantity: FieldValue.increment(-item.quantity),
        updatedAt: new Date(),
      });
    }
    await batch.commit();
    
    logger.info("Order created successfully", { 
      orderId: orderRef.id, 
      userId, 
      marketId, 
      totalAmount: finalAmount 
    });
    
    return {
      success: true,
      orderId: orderRef.id,
      totalAmount: finalAmount,
      estimatedDeliveryTime: orderData.estimatedDeliveryTime,
    };
    
  } catch (error) {
    logger.error("Error creating order", { 
      userId, 
      marketId,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Update order status with validation
 */
export const updateOrderStatus = onCall<{
  orderId: string;
  status: string;
  notes?: string;
}>({ 
  cors: true 
}, async (request) => {
  const { orderId, status, notes } = request.data;
  const userId = request.auth?.uid;
  
  try {
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid order status");
    }
    
    // Get order document
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new Error("Order not found");
    }
    
    const orderData = orderDoc.data();
    
    // Verify permissions
    const isCustomer = orderData?.userId === userId;
    const isMarketOwner = await verifyMarketOwner(userId, orderData?.marketId);
    const isDriver = orderData?.driverId === userId;
    const isAdmin = await verifyAdminRole(userId);
    
    if (!isCustomer && !isMarketOwner && !isDriver && !isAdmin) {
      throw new Error("Insufficient permissions to update this order");
    }
    
    // Validate status transition
    const currentStatus = orderData?.status;
    if (!isValidStatusTransition(currentStatus, status)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
    }
    
    // Update order
    const updateData: any = {
      status,
      updatedAt: new Date(),
      updatedBy: userId,
    };
    
    if (notes) {
      updateData.notes = notes;
    }
    
    // Add status-specific fields
    switch (status) {
      case 'confirmed':
        updateData.confirmedAt = new Date();
        break;
      case 'ready':
        updateData.readyAt = new Date();
        break;
      case 'delivering':
        updateData.deliveryStartedAt = new Date();
        break;
      case 'delivered':
        updateData.deliveredAt = new Date();
        updateData.paymentStatus = 'paid';
        break;
      case 'cancelled':
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = notes || 'No reason provided';
        // Restore product quantities
        await restoreProductQuantities(orderData);
        break;
    }
    
    await db.collection('orders').doc(orderId).update(updateData);
    
    logger.info("Order status updated", { 
      orderId, 
      oldStatus: currentStatus, 
      newStatus: status, 
      updatedBy: userId 
    });
    
    return { 
      success: true, 
      message: `Order status updated to ${status}` 
    };
    
  } catch (error) {
    logger.error("Error updating order status", { 
      orderId, 
      status, 
      userId,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Calculate delivery fee based on distance and market settings
 */
export const calculateDeliveryFee = onCall<{
  marketId: string;
  deliveryAddress: {
    latitude: number;
    longitude: number;
  };
}>({ 
  cors: true 
}, async (request) => {
  const { marketId, deliveryAddress } = request.data;
  
  try {
    const fee = await calculateDeliveryFeeInternal(marketId, deliveryAddress);
    
    return {
      success: true,
      deliveryFee: fee,
      currency: 'THB',
    };
    
  } catch (error) {
    logger.error("Error calculating delivery fee", { 
      marketId, 
      deliveryAddress,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Cancel order with refund processing
 */
export const cancelOrder = onCall<{
  orderId: string;
  reason: string;
}>({ 
  cors: true 
}, async (request) => {
  const { orderId, reason } = request.data;
  const userId = request.auth?.uid;
  
  try {
    if (!userId) {
      throw new Error("Authentication required");
    }
    
    // Get order document
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new Error("Order not found");
    }
    
    const orderData = orderDoc.data();
    
    // Verify permissions
    const isCustomer = orderData?.userId === userId;
    const isMarketOwner = await verifyMarketOwner(userId, orderData?.marketId);
    const isAdmin = await verifyAdminRole(userId);
    
    if (!isCustomer && !isMarketOwner && !isAdmin) {
      throw new Error("Insufficient permissions to cancel this order");
    }
    
    // Check if order can be cancelled
    const currentStatus = orderData?.status;
    const cancellableStatuses = ['pending', 'confirmed', 'preparing'];
    
    if (!cancellableStatuses.includes(currentStatus)) {
      throw new Error(`Order cannot be cancelled in ${currentStatus} status`);
    }
    
    // Update order status
    await db.collection('orders').doc(orderId).update({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason,
      cancelledBy: userId,
      updatedAt: new Date(),
    });
    
    // Restore product quantities
    await restoreProductQuantities(orderData);
    
    // Process refund if payment was made
    if (orderData?.paymentStatus === 'paid') {
      // This would integrate with payment processor
      logger.info("Refund processing required", { orderId, amount: orderData.finalAmount });
    }
    
    logger.info("Order cancelled successfully", { 
      orderId, 
      reason, 
      cancelledBy: userId 
    });
    
    return { 
      success: true, 
      message: "Order cancelled successfully" 
    };
    
  } catch (error) {
    logger.error("Error cancelling order", { 
      orderId, 
      reason, 
      userId,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

// ===========================================
// ORDER EVENT HANDLERS
// ===========================================

/**
 * Triggered when a new order is created
 * Sends notifications to relevant parties
 */
export const onOrderCreated = onDocumentCreated("orders/{orderId}", async (event) => {
  const orderId = event.params.orderId;
  const orderData = event.data?.data();
  
  try {
    if (!orderData) return;
    
    logger.info("Processing new order", { orderId });
    
    // Send notification to market owner
    const marketDoc = await db.collection('markets').doc(orderData.marketId).get();
    const marketData = marketDoc.data();
    
    if (marketData?.ownerId) {
      await db.collection('notifications').add({
        userId: marketData.ownerId,
        title: 'New Order Received',
        message: `You have received a new order worth ฿${orderData.finalAmount}`,
        type: 'order',
        data: {
          orderId,
          amount: orderData.finalAmount,
        },
        isRead: false,
        createdAt: new Date(),
      });
    }
    
    // Send confirmation notification to customer
    await db.collection('notifications').add({
      userId: orderData.userId,
      title: 'Order Placed Successfully',
      message: `Your order has been placed and is being processed. Order ID: ${orderId}`,
      type: 'order',
      data: {
        orderId,
        status: orderData.status,
      },
      isRead: false,
      createdAt: new Date(),
    });
    
    logger.info("Order notifications sent", { orderId });
    
  } catch (error) {
    logger.error("Error processing new order", { 
      orderId,
      error: error instanceof Error ? error.message : error 
    });
  }
});

/**
 * Triggered when order status is updated
 * Sends status update notifications
 */
export const onOrderStatusUpdated = onDocumentUpdated("orders/{orderId}", async (event) => {
  const orderId = event.params.orderId;
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();
  
  try {
    if (!beforeData || !afterData) return;
    
    const oldStatus = beforeData.status;
    const newStatus = afterData.status;
    
    // Only process if status actually changed
    if (oldStatus === newStatus) return;
    
    logger.info("Order status changed", { orderId, oldStatus, newStatus });
    
    // Send notification to customer
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      preparing: 'Your order is being prepared.',
      ready: 'Your order is ready for pickup/delivery.',
      delivering: 'Your order is on the way!',
      delivered: 'Your order has been delivered. Thank you!',
      cancelled: 'Your order has been cancelled.',
    };
    
    const message = statusMessages[newStatus as keyof typeof statusMessages] || 
                   `Your order status has been updated to ${newStatus}.`;
    
    await db.collection('notifications').add({
      userId: afterData.userId,
      title: 'Order Status Update',
      message,
      type: 'order',
      data: {
        orderId,
        status: newStatus,
        oldStatus,
      },
      isRead: false,
      createdAt: new Date(),
    });
    
    // If order is ready, notify available drivers
    if (newStatus === 'ready' && !afterData.driverId) {
      await notifyAvailableDrivers(orderId, afterData);
    }
    
    logger.info("Order status notification sent", { orderId, newStatus });
    
  } catch (error) {
    logger.error("Error processing order status update", { 
      orderId,
      error: error instanceof Error ? error.message : error 
    });
  }
});

// ===========================================
// HELPER FUNCTIONS
// ===========================================

async function calculateDeliveryFeeInternal(
  marketId: string, 
  deliveryAddress: any
): Promise<number> {
  try {
    // Get market location
    const marketDoc = await db.collection('markets').doc(marketId).get();
    const marketData = marketDoc.data();
    
    if (!marketData?.location) {
      return 30; // Default fee
    }
    
    // Calculate distance (simplified - in production use proper distance calculation)
    const distance = calculateDistance(
      marketData.location.latitude,
      marketData.location.longitude,
      deliveryAddress.latitude,
      deliveryAddress.longitude
    );
    
    // Base fee + distance-based fee
    const baseFee = 20; // ฿20 base fee
    const distanceFee = Math.ceil(distance) * 5; // ฿5 per km
    
    return Math.min(baseFee + distanceFee, 100); // Max ฿100
    
  } catch (error) {
    logger.error("Error calculating delivery fee", { marketId, error });
    return 30; // Default fee on error
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const transitions: { [key: string]: string[] } = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['preparing', 'cancelled'],
    'preparing': ['ready', 'cancelled'],
    'ready': ['delivering', 'cancelled'],
    'delivering': ['delivered'],
    'delivered': [], // Final state
    'cancelled': [], // Final state
  };
  
  return transitions[currentStatus]?.includes(newStatus) || false;
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

async function verifyAdminRole(userId: string): Promise<boolean> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    return userData?.role === 'admin';
  } catch (error) {
    return false;
  }
}

async function restoreProductQuantities(orderData: any): Promise<void> {
  try {
    const batch = db.batch();
    
    for (const item of orderData.items) {
      const productRef = db.collection('products').doc(item.productId);
      batch.update(productRef, {
        quantity: FieldValue.increment(item.quantity),
        updatedAt: new Date(),
      });
    }
    
    await batch.commit();
    logger.info("Product quantities restored", { orderId: orderData.id });
    
  } catch (error) {
    logger.error("Error restoring product quantities", { 
      orderId: orderData.id, 
      error 
    });
  }
}

async function notifyAvailableDrivers(orderId: string, orderData: any): Promise<void> {
  try {
    // Get available drivers near the market
    const driversSnapshot = await db.collection('users')
      .where('role', '==', 'driver')
      .where('isActive', '==', true)
      .where('isAvailable', '==', true)
      .get();
    
    const notifications = driversSnapshot.docs.map(doc => ({
      userId: doc.id,
      title: 'New Delivery Available',
      message: `A new delivery is available. Estimated fee: ฿${orderData.deliveryFee}`,
      type: 'delivery',
      data: {
        orderId,
        deliveryFee: orderData.deliveryFee,
        marketId: orderData.marketId,
      },
      isRead: false,
      createdAt: new Date(),
    }));
    
    // Send notifications in batch
    const batch = db.batch();
    notifications.forEach(notification => {
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, notification);
    });
    
    await batch.commit();
    
    logger.info("Driver notifications sent", { 
      orderId, 
      driverCount: notifications.length 
    });
    
  } catch (error) {
    logger.error("Error notifying drivers", { orderId, error });
  }
}
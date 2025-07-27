import { onCall } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import * as logger from "firebase-functions/logger";

const db = getFirestore();
const messaging = getMessaging();

// ===========================================
// NOTIFICATION SENDING FUNCTIONS
// ===========================================

/**
 * Send notification to a single user
 */
export const sendNotification = onCall<{
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: any;
  sendPush?: boolean;
  sendEmail?: boolean;
}>({ 
  cors: true 
}, async (request) => {
  const { userId, title, message, type, data, sendPush = true, sendEmail = false } = request.data;
  const senderUid = request.auth?.uid;
  
  try {
    if (!senderUid) {
      throw new Error("Authentication required");
    }
    
    logger.info("Sending notification", { userId, title, type, senderUid });
    
    // Verify sender permissions
    const canSend = await verifySendPermissions(senderUid, userId, type);
    if (!canSend) {
      throw new Error("Insufficient permissions to send notification");
    }
    
    // Get user preferences
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error("User not found");
    }
    
    const userData = userDoc.data();
    const preferences = userData?.preferences?.notifications || {};
    
    // Create notification document
    const notificationData = {
      userId,
      title,
      message,
      type,
      data: data || {},
      isRead: false,
      sentBy: senderUid,
      createdAt: new Date(),
    };
    
    const notificationRef = await db.collection('notifications').add(notificationData);
    
    // Send push notification if enabled
    if (sendPush && preferences.push !== false) {
      await sendPushNotification(userId, title, message, data);
    }
    
    // Send email notification if enabled
    if (sendEmail && preferences.email !== false) {
      await sendEmailNotification(userId, title, message, data);
    }
    
    logger.info("Notification sent successfully", { 
      notificationId: notificationRef.id,
      userId, 
      type 
    });
    
    return {
      success: true,
      notificationId: notificationRef.id,
      message: "Notification sent successfully",
    };
    
  } catch (error) {
    logger.error("Error sending notification", { 
      userId, 
      title, 
      type, 
      senderUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Send bulk notifications to multiple users
 */
export const sendBulkNotification = onCall<{
  userIds: string[];
  title: string;
  message: string;
  type: string;
  data?: any;
  sendPush?: boolean;
  sendEmail?: boolean;
}>({ 
  cors: true 
}, async (request) => {
  const { userIds, title, message, type, data, sendPush = true, sendEmail = false } = request.data;
  const senderUid = request.auth?.uid;
  
  try {
    if (!senderUid) {
      throw new Error("Authentication required");
    }
    
    // Verify sender is admin for bulk notifications
    const isAdmin = await verifyAdminRole(senderUid);
    if (!isAdmin) {
      throw new Error("Admin access required for bulk notifications");
    }
    
    logger.info("Sending bulk notification", { 
      userCount: userIds.length, 
      title, 
      type, 
      senderUid 
    });
    
    // Limit bulk size
    if (userIds.length > 1000) {
      throw new Error("Bulk notification limited to 1000 users");
    }
    
    // Create notification documents in batch
    const batch = db.batch();
    const notificationIds: string[] = [];
    
    for (const userId of userIds) {
      const notificationRef = db.collection('notifications').doc();
      const notificationData = {
        userId,
        title,
        message,
        type,
        data: data || {},
        isRead: false,
        sentBy: senderUid,
        createdAt: new Date(),
      };
      
      batch.set(notificationRef, notificationData);
      notificationIds.push(notificationRef.id);
    }
    
    await batch.commit();
    
    // Send push notifications
    if (sendPush) {
      await sendBulkPushNotifications(userIds, title, message, data);
    }
    
    // Send email notifications
    if (sendEmail) {
      await sendBulkEmailNotifications(userIds, title, message, data);
    }
    
    logger.info("Bulk notification sent successfully", { 
      userCount: userIds.length,
      notificationCount: notificationIds.length,
      type 
    });
    
    return {
      success: true,
      notificationIds,
      userCount: userIds.length,
      message: "Bulk notification sent successfully",
    };
    
  } catch (error) {
    logger.error("Error sending bulk notification", { 
      userCount: userIds.length, 
      title, 
      type, 
      senderUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Send order-specific notification
 */
export const sendOrderNotification = onCall<{
  orderId: string;
  type: 'created' | 'updated' | 'cancelled' | 'delivered';
  customMessage?: string;
}>({ 
  cors: true 
}, async (request) => {
  const { orderId, type, customMessage } = request.data;
  const senderUid = request.auth?.uid;
  
  try {
    if (!senderUid) {
      throw new Error("Authentication required");
    }
    
    logger.info("Sending order notification", { orderId, type, senderUid });
    
    // Get order data
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new Error("Order not found");
    }
    
    const orderData = orderDoc.data();
    
    // Verify permissions
    const canSend = await verifyOrderNotificationPermissions(senderUid, orderData);
    if (!canSend) {
      throw new Error("Insufficient permissions to send order notification");
    }
    
    // Generate notification content
    const notificationContent = generateOrderNotificationContent(type, orderData, customMessage);
    
    // Send to customer
    await sendNotificationToUser(
      orderData?.userId,
      notificationContent.title,
      notificationContent.message,
      'order',
      { orderId, orderStatus: orderData?.status }
    );
    
    // Send to market owner if different from sender
    if (orderData?.marketId) {
      const marketDoc = await db.collection('markets').doc(orderData.marketId).get();
      const marketData = marketDoc.data();
      
      if (marketData?.ownerId && marketData.ownerId !== senderUid) {
        await sendNotificationToUser(
          marketData.ownerId,
          notificationContent.marketTitle,
          notificationContent.marketMessage,
          'order',
          { orderId, orderStatus: orderData?.status }
        );
      }
    }
    
    logger.info("Order notification sent successfully", { orderId, type });
    
    return {
      success: true,
      message: "Order notification sent successfully",
    };
    
  } catch (error) {
    logger.error("Error sending order notification", { 
      orderId, 
      type, 
      senderUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Send delivery notification
 */
export const sendDeliveryNotification = onCall<{
  orderId: string;
  type: 'assigned' | 'picked_up' | 'in_transit' | 'delivered';
  location?: { latitude: number; longitude: number };
  estimatedTime?: string;
}>({ 
  cors: true 
}, async (request) => {
  const { orderId, type, location, estimatedTime } = request.data;
  const driverUid = request.auth?.uid;
  
  try {
    if (!driverUid) {
      throw new Error("Authentication required");
    }
    
    logger.info("Sending delivery notification", { orderId, type, driverUid });
    
    // Get order data
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new Error("Order not found");
    }
    
    const orderData = orderDoc.data();
    
    // Verify driver is assigned to this order
    if (orderData?.driverId !== driverUid) {
      throw new Error("Driver not assigned to this order");
    }
    
    // Generate notification content
    const notificationContent = generateDeliveryNotificationContent(type, orderData, location, estimatedTime);
    
    // Send to customer
    await sendNotificationToUser(
      orderData?.userId,
      notificationContent.title,
      notificationContent.message,
      'delivery',
      { 
        orderId, 
        deliveryStatus: type,
        location,
        estimatedTime 
      }
    );
    
    logger.info("Delivery notification sent successfully", { orderId, type });
    
    return {
      success: true,
      message: "Delivery notification sent successfully",
    };
    
  } catch (error) {
    logger.error("Error sending delivery notification", { 
      orderId, 
      type, 
      driverUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

// ===========================================
// NOTIFICATION EVENT HANDLERS
// ===========================================

/**
 * Triggered when a new notification is created
 * Handles push notification sending
 */
export const onNotificationCreated = onDocumentCreated("notifications/{notificationId}", async (event) => {
  const notificationId = event.params.notificationId;
  const notificationData = event.data?.data();
  
  try {
    if (!notificationData) return;
    
    logger.info("Processing new notification", { 
      notificationId, 
      userId: notificationData.userId,
      type: notificationData.type 
    });
    
    // Get user preferences
    const userDoc = await db.collection('users').doc(notificationData.userId).get();
    const userData = userDoc.data();
    const preferences = userData?.preferences?.notifications || {};
    
    // Send push notification if enabled
    if (preferences.push !== false) {
      await sendPushNotification(
        notificationData.userId,
        notificationData.title,
        notificationData.message,
        notificationData.data
      );
    }
    
    // Update notification statistics
    await updateNotificationStats(notificationData.type);
    
    logger.info("Notification processed successfully", { notificationId });
    
  } catch (error) {
    logger.error("Error processing notification", { 
      notificationId,
      error: error instanceof Error ? error.message : error 
    });
  }
});

// ===========================================
// PUSH NOTIFICATION FUNCTIONS
// ===========================================

async function sendPushNotification(
  userId: string, 
  title: string, 
  message: string, 
  data?: any
): Promise<void> {
  try {
    // Get user's FCM tokens
    const tokensSnapshot = await db.collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .where('isActive', '==', true)
      .get();
    
    if (tokensSnapshot.empty) {
      logger.info("No FCM tokens found for user", { userId });
      return;
    }
    
    const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
    
    // Prepare push notification payload
    const payload = {
      notification: {
        title,
        body: message,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      tokens,
    };
    
    // Send push notification
    const response = await messaging.sendEachForMulticast(payload);
    
    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          logger.warn("Failed to send push notification", { 
            token: tokens[idx], 
            error: resp.error?.message 
          });
        }
      });
      
      // Remove invalid tokens
      await removeInvalidTokens(userId, failedTokens);
    }
    
    logger.info("Push notification sent", { 
      userId, 
      tokenCount: tokens.length,
      successCount: response.successCount,
      failureCount: response.failureCount 
    });
    
  } catch (error) {
    logger.error("Error sending push notification", { userId, title, error });
  }
}

async function sendBulkPushNotifications(
  userIds: string[], 
  title: string, 
  message: string, 
  data?: any
): Promise<void> {
  try {
    // Process in batches to avoid rate limits
    const batchSize = 100;
    const batches = [];
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      batches.push(userIds.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      const promises = batch.map(userId => 
        sendPushNotification(userId, title, message, data)
      );
      
      await Promise.all(promises);
      
      // Add delay between batches
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    logger.info("Bulk push notifications sent", { 
      userCount: userIds.length,
      batchCount: batches.length 
    });
    
  } catch (error) {
    logger.error("Error sending bulk push notifications", { 
      userCount: userIds.length, 
      error 
    });
  }
}

// ===========================================
// EMAIL NOTIFICATION FUNCTIONS
// ===========================================

async function sendEmailNotification(
  userId: string, 
  title: string, 
  message: string, 
  data?: any
): Promise<void> {
  try {
    // Get user email
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData?.email) {
      logger.warn("No email found for user", { userId });
      return;
    }
    
    // Prepare email content
    const emailData = {
      to: userData.email,
      subject: title,
      html: generateEmailTemplate(title, message, data),
      from: 'noreply@thefox.com',
    };
    
    // Add to email queue (would integrate with email service)
    await db.collection('emailQueue').add({
      ...emailData,
      userId,
      status: 'pending',
      createdAt: new Date(),
    });
    
    logger.info("Email notification queued", { userId, email: userData.email });
    
  } catch (error) {
    logger.error("Error sending email notification", { userId, title, error });
  }
}

async function sendBulkEmailNotifications(
  userIds: string[], 
  title: string, 
  message: string, 
  data?: any
): Promise<void> {
  try {
    // Get user emails
    const usersSnapshot = await db.collection('users')
      .where('__name__', 'in', userIds.slice(0, 10)) // Firestore 'in' limit
      .get();
    
    const emailPromises = usersSnapshot.docs.map(doc => {
      const userData = doc.data();
      if (userData.email) {
        return sendEmailNotification(doc.id, title, message, data);
      }
      return Promise.resolve();
    });
    
    await Promise.all(emailPromises);
    
    logger.info("Bulk email notifications queued", { userCount: userIds.length });
    
  } catch (error) {
    logger.error("Error sending bulk email notifications", { 
      userCount: userIds.length, 
      error 
    });
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

async function sendNotificationToUser(
  userId: string,
  title: string,
  message: string,
  type: string,
  data?: any
): Promise<void> {
  await db.collection('notifications').add({
    userId,
    title,
    message,
    type,
    data: data || {},
    isRead: false,
    createdAt: new Date(),
  });
}

async function verifySendPermissions(
  senderUid: string, 
  recipientUid: string, 
  type: string
): Promise<boolean> {
  try {
    // Admin can send any notification
    const isAdmin = await verifyAdminRole(senderUid);
    if (isAdmin) return true;
    
    // Users can send to themselves
    if (senderUid === recipientUid) return true;
    
    // Market owners can send order notifications to customers
    if (type === 'order') {
      // Additional verification would be needed here
      return true;
    }
    
    // Drivers can send delivery notifications
    if (type === 'delivery') {
      const userDoc = await db.collection('users').doc(senderUid).get();
      const userData = userDoc.data();
      return userData?.role === 'driver';
    }
    
    return false;
    
  } catch (error) {
    logger.error("Error verifying send permissions", { senderUid, recipientUid, type, error });
    return false;
  }
}

async function verifyOrderNotificationPermissions(senderUid: string, orderData: any): Promise<boolean> {
  try {
    // Admin can send any notification
    const isAdmin = await verifyAdminRole(senderUid);
    if (isAdmin) return true;
    
    // Customer can send notifications about their own orders
    if (orderData?.userId === senderUid) return true;
    
    // Market owner can send notifications about orders from their market
    if (orderData?.marketId) {
      const marketDoc = await db.collection('markets').doc(orderData.marketId).get();
      const marketData = marketDoc.data();
      if (marketData?.ownerId === senderUid) return true;
    }
    
    // Driver can send notifications about assigned orders
    if (orderData?.driverId === senderUid) return true;
    
    return false;
    
  } catch (error) {
    logger.error("Error verifying order notification permissions", { senderUid, error });
    return false;
  }
}

function generateOrderNotificationContent(type: string, orderData: any, customMessage?: string) {
  const orderId = orderData?.id || 'Unknown';
  const amount = orderData?.finalAmount || 0;
  
  const content = {
    title: '',
    message: '',
    marketTitle: '',
    marketMessage: '',
  };
  
  switch (type) {
    case 'created':
      content.title = 'Order Placed Successfully';
      content.message = customMessage || `Your order #${orderId} has been placed successfully. Total: ฿${amount}`;
      content.marketTitle = 'New Order Received';
      content.marketMessage = `You have received a new order #${orderId} worth ฿${amount}`;
      break;
    case 'updated':
      content.title = 'Order Status Updated';
      content.message = customMessage || `Your order #${orderId} status has been updated to ${orderData?.status}`;
      content.marketTitle = 'Order Updated';
      content.marketMessage = `Order #${orderId} has been updated`;
      break;
    case 'cancelled':
      content.title = 'Order Cancelled';
      content.message = customMessage || `Your order #${orderId} has been cancelled`;
      content.marketTitle = 'Order Cancelled';
      content.marketMessage = `Order #${orderId} has been cancelled`;
      break;
    case 'delivered':
      content.title = 'Order Delivered';
      content.message = customMessage || `Your order #${orderId} has been delivered successfully!`;
      content.marketTitle = 'Order Delivered';
      content.marketMessage = `Order #${orderId} has been delivered`;
      break;
  }
  
  return content;
}

function generateDeliveryNotificationContent(
  type: string, 
  orderData: any, 
  location?: any, 
  estimatedTime?: string
) {
  const orderId = orderData?.id || 'Unknown';
  
  const content = {
    title: '',
    message: '',
  };
  
  switch (type) {
    case 'assigned':
      content.title = 'Driver Assigned';
      content.message = `A driver has been assigned to your order #${orderId}`;
      break;
    case 'picked_up':
      content.title = 'Order Picked Up';
      content.message = `Your order #${orderId} has been picked up and is on the way`;
      break;
    case 'in_transit':
      content.title = 'Order In Transit';
      content.message = `Your order #${orderId} is on the way${estimatedTime ? `. ETA: ${estimatedTime}` : ''}`;
      break;
    case 'delivered':
      content.title = 'Order Delivered';
      content.message = `Your order #${orderId} has been delivered successfully!`;
      break;
  }
  
  return content;
}

function generateEmailTemplate(title: string, message: string, data?: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h1 style="color: #333; margin: 0;">theFOX</h1>
      </div>
      <div style="padding: 20px;">
        <h2 style="color: #333;">${title}</h2>
        <p style="color: #666; line-height: 1.6;">${message}</p>
        ${data ? `<div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <pre style="margin: 0; font-family: Arial, sans-serif;">${JSON.stringify(data, null, 2)}</pre>
        </div>` : ''}
      </div>
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
        <p>This is an automated message from theFOX. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
}

async function removeInvalidTokens(userId: string, tokens: string[]): Promise<void> {
  try {
    const batch = db.batch();
    
    for (const token of tokens) {
      const tokenQuery = await db.collection('users')
        .doc(userId)
        .collection('fcmTokens')
        .where('token', '==', token)
        .get();
      
      tokenQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }
    
    await batch.commit();
    
    logger.info("Invalid FCM tokens removed", { userId, tokenCount: tokens.length });
    
  } catch (error) {
    logger.error("Error removing invalid tokens", { userId, tokens, error });
  }
}

async function updateNotificationStats(type: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statsRef = db.collection('analytics').doc(`notifications_${today}`);
    
    await statsRef.set({
      date: today,
      [`${type}_count`]: FieldValue.increment(1),
      total_count: FieldValue.increment(1),
      updatedAt: new Date(),
    }, { merge: true });
    
  } catch (error) {
    logger.error("Error updating notification stats", { type, error });
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
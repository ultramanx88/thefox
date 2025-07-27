/**
 * Notification Cloud Functions
 * Handles push notifications, email notifications, and SMS
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { logger } from "firebase-functions";

const db = getFirestore();
const messaging = getMessaging();

// Notification types and templates
const NOTIFICATION_TEMPLATES = {
  order: {
    created: {
      title: 'คำสั่งซื้อใหม่',
      body: 'คุณมีคำสั่งซื้อใหม่ #{orderId}',
      icon: '🛒',
    },
    confirmed: {
      title: 'คำสั่งซื้อได้รับการยืนยัน',
      body: 'คำสั่งซื้อ #{orderId} ได้รับการยืนยันแล้ว',
      icon: '✅',
    },
    preparing: {
      title: 'กำลังเตรียมคำสั่งซื้อ',
      body: 'ร้านค้ากำลังเตรียมคำสั่งซื้อ #{orderId}',
      icon: '👨‍🍳',
    },
    ready: {
      title: 'คำสั่งซื้อพร้อมส่ง',
      body: 'คำสั่งซื้อ #{orderId} พร้อมส่งแล้ว',
      icon: '📦',
    },
    delivering: {
      title: 'กำลังจัดส่ง',
      body: 'คำสั่งซื้อ #{orderId} กำลังอยู่ระหว่างการจัดส่ง',
      icon: '🚚',
    },
    delivered: {
      title: 'จัดส่งสำเร็จ',
      body: 'คำสั่งซื้อ #{orderId} จัดส่งสำเร็จแล้ว',
      icon: '🎉',
    },
    cancelled: {
      title: 'คำสั่งซื้อถูกยกเลิก',
      body: 'คำสั่งซื้อ #{orderId} ถูกยกเลิกแล้ว',
      icon: '❌',
    },
  },
  delivery: {
    assigned: {
      title: 'งานส่งใหม่',
      body: 'คุณได้รับมอบหมายงานส่ง #{orderId}',
      icon: '🚚',
    },
    location_update: {
      title: 'อัปเดตตำแหน่ง',
      body: 'คนขับได้อัปเดตตำแหน่งสำหรับคำสั่งซื้อ #{orderId}',
      icon: '📍',
    },
  },
  system: {
    welcome: {
      title: 'ยินดีต้อนรับสู่ theFOX!',
      body: 'บัญชีของคุณได้ถูกสร้างเรียบร้อยแล้ว',
      icon: '🦊',
    },
    verification: {
      title: 'บัญชีได้รับการยืนยัน',
      body: 'บัญชีของคุณได้รับการยืนยันเรียบร้อยแล้ว',
      icon: '✅',
    },
    maintenance: {
      title: 'ปรับปรุงระบบ',
      body: 'ระบบจะปรับปรุงในวันที่ {date} เวลา {time}',
      icon: '🔧',
    },
  },
  promotion: {
    discount: {
      title: 'โปรโมชั่นพิเศษ!',
      body: 'รับส่วนลด {discount}% สำหรับคำสั่งซื้อถัดไป',
      icon: '🎁',
    },
    new_market: {
      title: 'ร้านค้าใหม่',
      body: 'ร้านค้าใหม่ {marketName} เปิดให้บริการแล้ว',
      icon: '🏪',
    },
  },
};

// ===========================================
// NOTIFICATION SENDING FUNCTIONS
// ===========================================

/**
 * Callable function to send notification to specific user
 */
export const sendNotification = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId, title, message, type, data, channels } = request.data;
    const senderId = request.auth.uid;
    const senderRole = request.auth.token.role;

    // Validate required fields
    if (!userId || !title || !message || !type) {
      throw new HttpsError('invalid-argument', 'userId, title, message, and type are required');
    }

    // Check permissions (only admins and market owners can send notifications)
    if (senderRole !== 'admin' && senderRole !== 'vendor') {
      throw new HttpsError('permission-denied', 'Not authorized to send notifications');
    }

    try {
      // Get user preferences
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData) {
        throw new HttpsError('not-found', 'User not found');
      }

      const userPreferences = userData.preferences?.notifications || {
        push: true,
        email: true,
        sms: false,
      };

      // Create notification record
      const notificationData = {
        userId,
        title,
        message,
        type,
        data: data || {},
        isRead: false,
        senderId,
        channels: channels || ['push', 'in_app'],
        createdAt: new Date(),
      };

      const notificationRef = await db.collection('notifications').add(notificationData);

      // Send through different channels
      const results = {
        push: false,
        email: false,
        sms: false,
        inApp: true, // Always created in database
      };

      // Send push notification
      if (channels?.includes('push') && userPreferences.push) {
        try {
          results.push = await sendPushNotification(userId, title, message, data);
        } catch (error) {
          logger.warn("Failed to send push notification", { 
            userId, 
            error: error instanceof Error ? error.message : error 
          });
        }
      }

      // Send email notification
      if (channels?.includes('email') && userPreferences.email) {
        try {
          results.email = await sendEmailNotification(userData.email, title, message, data);
        } catch (error) {
          logger.warn("Failed to send email notification", { 
            userId, 
            error: error instanceof Error ? error.message : error 
          });
        }
      }

      // Send SMS notification
      if (channels?.includes('sms') && userPreferences.sms && userData.phone) {
        try {
          results.sms = await sendSMSNotification(userData.phone, message);
        } catch (error) {
          logger.warn("Failed to send SMS notification", { 
            userId, 
            error: error instanceof Error ? error.message : error 
          });
        }
      }

      // Update notification with delivery status
      await notificationRef.update({
        deliveryStatus: results,
        updatedAt: new Date(),
      });

      logger.info("Notification sent", { 
        notificationId: notificationRef.id,
        userId,
        type,
        channels: results 
      });

      return {
        success: true,
        notificationId: notificationRef.id,
        deliveryStatus: results,
      };

    } catch (error) {
      logger.error("Error sending notification", { 
        userId,
        type,
        senderId,
        error: error instanceof Error ? error.message : error 
      });
      
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to send notification');
    }
  }
);

/**
 * Callable function to send bulk notifications
 * Admin only function
 */
export const sendBulkNotification = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const senderRole = request.auth.token.role;
    if (senderRole !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can send bulk notifications');
    }

    const { userIds, title, message, type, data, channels, filters } = request.data;

    if (!title || !message || !type) {
      throw new HttpsError('invalid-argument', 'title, message, and type are required');
    }

    try {
      let targetUserIds = userIds;

      // If no specific userIds provided, use filters to get users
      if (!targetUserIds && filters) {
        targetUserIds = await getUserIdsByFilters(filters);
      }

      if (!targetUserIds || targetUserIds.length === 0) {
        throw new HttpsError('invalid-argument', 'No target users specified');
      }

      // Limit bulk notifications to prevent abuse
      if (targetUserIds.length > 1000) {
        throw new HttpsError('invalid-argument', 'Cannot send to more than 1000 users at once');
      }

      const senderId = request.auth.uid;
      const results = {
        total: targetUserIds.length,
        successful: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Process in batches to avoid overwhelming the system
      const batchSize = 50;
      for (let i = 0; i < targetUserIds.length; i += batchSize) {
        const batch = targetUserIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (userId: string) => {
          try {
            // Create notification record
            const notificationData = {
              userId,
              title,
              message,
              type,
              data: data || {},
              isRead: false,
              senderId,
              channels: channels || ['push', 'in_app'],
              isBulk: true,
              createdAt: new Date(),
            };

            await db.collection('notifications').add(notificationData);

            // Send push notification
            if (channels?.includes('push')) {
              await sendPushNotification(userId, title, message, data);
            }

            results.successful++;
          } catch (error) {
            results.failed++;
            results.errors.push(`User ${userId}: ${error instanceof Error ? error.message : error}`);
          }
        });

        await Promise.all(batchPromises);
      }

      // Create bulk notification log
      await db.collection('bulkNotificationLogs').add({
        senderId,
        title,
        message,
        type,
        targetCount: targetUserIds.length,
        results,
        createdAt: new Date(),
      });

      logger.info("Bulk notification sent", { 
        senderId,
        type,
        targetCount: targetUserIds.length,
        successful: results.successful,
        failed: results.failed 
      });

      return {
        success: true,
        results,
      };

    } catch (error) {
      logger.error("Error sending bulk notification", { 
        senderId: request.auth.uid,
        type,
        error: error instanceof Error ? error.message : error 
      });
      
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to send bulk notification');
    }
  }
);

/**
 * Callable function to send order-specific notification
 */
export const sendOrderNotification = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { orderId, status, customMessage } = request.data;
    const senderId = request.auth.uid;

    if (!orderId || !status) {
      throw new HttpsError('invalid-argument', 'orderId and status are required');
    }

    try {
      // Get order details
      const orderDoc = await db.collection('orders').doc(orderId).get();
      const orderData = orderDoc.data();

      if (!orderDoc.exists || !orderData) {
        throw new HttpsError('not-found', 'Order not found');
      }

      // Check permissions
      const canSend = 
        request.auth.token.role === 'admin' ||
        senderId === orderData.userId ||
        (await isMarketOwner(senderId, orderData.marketId)) ||
        (request.auth.token.role === 'driver' && senderId === orderData.driverId);

      if (!canSend) {
        throw new HttpsError('permission-denied', 'Not authorized to send notification for this order');
      }

      // Get notification template
      const template = NOTIFICATION_TEMPLATES.order[status as keyof typeof NOTIFICATION_TEMPLATES.order];
      if (!template) {
        throw new HttpsError('invalid-argument', 'Invalid order status for notification');
      }

      const title = template.title;
      const message = customMessage || template.body.replace('{orderId}', orderId);

      // Send to customer
      await db.collection('notifications').add({
        userId: orderData.userId,
        title,
        message,
        type: 'order',
        data: { orderId, status },
        isRead: false,
        createdAt: new Date(),
      });

      // Send to market owner if different from sender
      const marketDoc = await db.collection('markets').doc(orderData.marketId).get();
      const marketData = marketDoc.data();
      
      if (marketData && marketData.ownerId !== senderId && marketData.ownerId !== orderData.userId) {
        await db.collection('notifications').add({
          userId: marketData.ownerId,
          title: `คำสั่งซื้อ #${orderId}`,
          message: `สถานะคำสั่งซื้อเปลี่ยนเป็น: ${status}`,
          type: 'order',
          data: { orderId, status },
          isRead: false,
          createdAt: new Date(),
        });
      }

      logger.info("Order notification sent", { orderId, status, senderId });

      return {
        success: true,
        message: 'Order notification sent successfully',
      };

    } catch (error) {
      logger.error("Error sending order notification", { 
        orderId,
        status,
        senderId,
        error: error instanceof Error ? error.message : error 
      });
      
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to send order notification');
    }
  }
);

/**
 * Callable function to send delivery notification
 */
export const sendDeliveryNotification = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { orderId, type, location, estimatedArrival } = request.data;
    const driverId = request.auth.uid;

    if (!orderId || !type) {
      throw new HttpsError('invalid-argument', 'orderId and type are required');
    }

    try {
      // Get order details
      const orderDoc = await db.collection('orders').doc(orderId).get();
      const orderData = orderDoc.data();

      if (!orderDoc.exists || !orderData) {
        throw new HttpsError('not-found', 'Order not found');
      }

      // Verify driver is assigned to this order
      if (orderData.driverId !== driverId && request.auth.token.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Not authorized for this delivery');
      }

      let title = '';
      let message = '';

      switch (type) {
        case 'assigned':
          title = 'คนขับได้รับงานแล้ว';
          message = `คนขับได้รับงานส่งคำสั่งซื้อ #${orderId} แล้ว`;
          break;
        case 'picked_up':
          title = 'รับสินค้าแล้ว';
          message = `คนขับได้รับสินค้าสำหรับคำสั่งซื้อ #${orderId} แล้ว`;
          break;
        case 'location_update':
          title = 'อัปเดตตำแหน่ง';
          message = `คนขับได้อัปเดตตำแหน่งสำหรับคำสั่งซื้อ #${orderId}`;
          break;
        case 'arriving':
          title = 'กำลังมาถึง';
          message = `คนขับกำลังมาถึงในอีก ${estimatedArrival || '5'} นาที`;
          break;
        case 'delivered':
          title = 'จัดส่งสำเร็จ';
          message = `คำสั่งซื้อ #${orderId} จัดส่งสำเร็จแล้ว`;
          break;
        default:
          throw new HttpsError('invalid-argument', 'Invalid delivery notification type');
      }

      // Send to customer
      await db.collection('notifications').add({
        userId: orderData.userId,
        title,
        message,
        type: 'delivery',
        data: { 
          orderId, 
          deliveryType: type, 
          location,
          estimatedArrival,
          driverId 
        },
        isRead: false,
        createdAt: new Date(),
      });

      // Update delivery tracking
      if (location) {
        await db.collection('deliveryTracking').add({
          orderId,
          driverId,
          location,
          type,
          timestamp: new Date(),
        });
      }

      logger.info("Delivery notification sent", { orderId, type, driverId });

      return {
        success: true,
        message: 'Delivery notification sent successfully',
      };

    } catch (error) {
      logger.error("Error sending delivery notification", { 
        orderId,
        type,
        driverId,
        error: error instanceof Error ? error.message : error 
      });
      
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to send delivery notification');
    }
  }
);

// ===========================================
// AUTOMATIC NOTIFICATION TRIGGERS
// ===========================================

/**
 * Triggered when a new notification is created
 * Handles automatic delivery through various channels
 */
export const onNotificationCreated = onDocumentCreated(
  "notifications/{notificationId}",
  async (event) => {
    const notificationId = event.params.notificationId;
    const notificationData = event.data?.data();

    if (!notificationData) {
      logger.error("No notification data found", { notificationId });
      return;
    }

    try {
      // Skip if this is a manually sent notification (already processed)
      if (notificationData.senderId) {
        return;
      }

      // Get user preferences
      const userDoc = await db.collection('users').doc(notificationData.userId).get();
      const userData = userDoc.data();

      if (!userData) {
        logger.warn("User not found for notification", { 
          notificationId, 
          userId: notificationData.userId 
        });
        return;
      }

      const userPreferences = userData.preferences?.notifications || {
        push: true,
        email: false,
        sms: false,
      };

      // Send push notification if enabled
      if (userPreferences.push) {
        try {
          await sendPushNotification(
            notificationData.userId,
            notificationData.title,
            notificationData.message,
            notificationData.data
          );
        } catch (error) {
          logger.warn("Failed to send automatic push notification", { 
            notificationId,
            error: error instanceof Error ? error.message : error 
          });
        }
      }

      logger.info("Automatic notification processed", { 
        notificationId,
        userId: notificationData.userId,
        type: notificationData.type 
      });

    } catch (error) {
      logger.error("Error processing automatic notification", { 
        notificationId,
        error: error instanceof Error ? error.message : error 
      });
    }
  }
);

// ===========================================
// NOTIFICATION DELIVERY FUNCTIONS
// ===========================================

async function sendPushNotification(
  userId: string, 
  title: string, 
  body: string, 
  data?: any
): Promise<boolean> {
  try {
    // Get user's FCM tokens
    const tokensQuery = await db.collection('fcmTokens')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    if (tokensQuery.empty) {
      logger.info("No FCM tokens found for user", { userId });
      return false;
    }

    const tokens = tokensQuery.docs.map(doc => doc.data().token);

    // Send multicast message
    const message = {
      notification: {
        title,
        body,
      },
      data: data ? Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, String(value)])
      ) : {},
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message);

    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          logger.warn("FCM token failed", { 
            token: tokens[idx], 
            error: resp.error?.message 
          });
        }
      });

      // Remove invalid tokens
      const batch = db.batch();
      for (const token of failedTokens) {
        const tokenQuery = await db.collection('fcmTokens')
          .where('token', '==', token)
          .get();
        
        tokenQuery.docs.forEach(doc => {
          batch.update(doc.ref, { isActive: false, updatedAt: new Date() });
        });
      }
      await batch.commit();
    }

    logger.info("Push notification sent", { 
      userId,
      successCount: response.successCount,
      failureCount: response.failureCount 
    });

    return response.successCount > 0;

  } catch (error) {
    logger.error("Error sending push notification", { 
      userId,
      error: error instanceof Error ? error.message : error 
    });
    return false;
  }
}

async function sendEmailNotification(
  email: string, 
  title: string, 
  message: string, 
  data?: any
): Promise<boolean> {
  try {
    // Mock email sending
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    logger.info("Email notification sent (mock)", { 
      email,
      title,
      message: message.substring(0, 50) + '...' 
    });

    // Create email log
    await db.collection('emailLogs').add({
      email,
      title,
      message,
      data,
      status: 'sent',
      sentAt: new Date(),
    });

    return true;

  } catch (error) {
    logger.error("Error sending email notification", { 
      email,
      error: error instanceof Error ? error.message : error 
    });
    return false;
  }
}

async function sendSMSNotification(phone: string, message: string): Promise<boolean> {
  try {
    // Mock SMS sending
    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    logger.info("SMS notification sent (mock)", { 
      phone: phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
      message: message.substring(0, 50) + '...' 
    });

    // Create SMS log
    await db.collection('smsLogs').add({
      phone,
      message,
      status: 'sent',
      sentAt: new Date(),
    });

    return true;

  } catch (error) {
    logger.error("Error sending SMS notification", { 
      phone,
      error: error instanceof Error ? error.message : error 
    });
    return false;
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

async function getUserIdsByFilters(filters: any): Promise<string[]> {
  let query = db.collection('users');

  // Apply filters
  if (filters.role) {
    query = query.where('role', '==', filters.role) as any;
  }

  if (filters.verified !== undefined) {
    query = query.where('verified', '==', filters.verified) as any;
  }

  if (filters.location) {
    // Mock location-based filtering
    // In production, use geospatial queries
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => doc.id);
}

async function isMarketOwner(userId: string, marketId: string): Promise<boolean> {
  const marketDoc = await db.collection('markets').doc(marketId).get();
  const marketData = marketDoc.data();
  return marketData?.ownerId === userId;
}
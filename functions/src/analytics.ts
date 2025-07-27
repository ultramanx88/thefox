import { onCall } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const db = getFirestore();

// ===========================================
// EVENT TRACKING FUNCTIONS
// ===========================================

/**
 * Track custom analytics event
 */
export const trackEvent = onCall<{
  eventName: string;
  eventData: any;
  userId?: string;
}>({ 
  cors: true 
}, async (request) => {
  const { eventName, eventData, userId } = request.data;
  const callerUid = request.auth?.uid;
  
  try {
    const trackingUserId = userId || callerUid;
    
    logger.info("Tracking analytics event", { 
      eventName, 
      userId: trackingUserId,
      callerUid 
    });
    
    // Validate event name
    if (!isValidEventName(eventName)) {
      throw new Error("Invalid event name");
    }
    
    // Create analytics event document
    const eventDoc = {
      eventName,
      eventData,
      userId: trackingUserId,
      timestamp: new Date(),
      sessionId: eventData.sessionId || null,
      platform: eventData.platform || 'web',
      version: eventData.version || '1.0.0',
      userAgent: eventData.userAgent || null,
      ipAddress: request.rawRequest.ip || null,
      createdAt: new Date(),
    };
    
    await db.collection('analytics').add(eventDoc);
    
    // Update real-time counters
    await updateEventCounters(eventName, eventData);
    
    // Update user analytics
    if (trackingUserId) {
      await updateUserAnalytics(trackingUserId, eventName, eventData);
    }
    
    logger.info("Analytics event tracked successfully", { 
      eventName, 
      userId: trackingUserId 
    });
    
    return {
      success: true,
      message: "Event tracked successfully",
    };
    
  } catch (error) {
    logger.error("Error tracking analytics event", { 
      eventName, 
      userId, 
      callerUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Generate daily analytics report
 */
export const generateDailyReport = onCall<{
  date?: string;
}>({ 
  cors: true 
}, async (request) => {
  const { date } = request.data;
  const callerUid = request.auth?.uid;
  
  try {
    // Verify admin access
    const isAdmin = await verifyAdminRole(callerUid);
    if (!isAdmin) {
      throw new Error("Admin access required");
    }
    
    const reportDate = date || new Date().toISOString().split('T')[0];
    
    logger.info("Generating daily report", { date: reportDate, callerUid });
    
    const report = await generateDailyReportData(reportDate);
    
    // Save report to database
    await db.collection('reports').doc(`daily_${reportDate}`).set({
      type: 'daily',
      date: reportDate,
      data: report,
      generatedBy: callerUid,
      generatedAt: new Date(),
    });
    
    logger.info("Daily report generated successfully", { date: reportDate });
    
    return {
      success: true,
      report,
      date: reportDate,
    };
    
  } catch (error) {
    logger.error("Error generating daily report", { 
      date, 
      callerUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Generate weekly analytics report
 */
export const generateWeeklyReport = onCall<{
  weekStart?: string;
}>({ 
  cors: true 
}, async (request) => {
  const { weekStart } = request.data;
  const callerUid = request.auth?.uid;
  
  try {
    // Verify admin access
    const isAdmin = await verifyAdminRole(callerUid);
    if (!isAdmin) {
      throw new Error("Admin access required");
    }
    
    const startDate = weekStart || getWeekStart(new Date());
    
    logger.info("Generating weekly report", { weekStart: startDate, callerUid });
    
    const report = await generateWeeklyReportData(startDate);
    
    // Save report to database
    await db.collection('reports').doc(`weekly_${startDate}`).set({
      type: 'weekly',
      weekStart: startDate,
      data: report,
      generatedBy: callerUid,
      generatedAt: new Date(),
    });
    
    logger.info("Weekly report generated successfully", { weekStart: startDate });
    
    return {
      success: true,
      report,
      weekStart: startDate,
    };
    
  } catch (error) {
    logger.error("Error generating weekly report", { 
      weekStart, 
      callerUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Generate monthly analytics report
 */
export const generateMonthlyReport = onCall<{
  month?: string;
}>({ 
  cors: true 
}, async (request) => {
  const { month } = request.data;
  const callerUid = request.auth?.uid;
  
  try {
    // Verify admin access
    const isAdmin = await verifyAdminRole(callerUid);
    if (!isAdmin) {
      throw new Error("Admin access required");
    }
    
    const reportMonth = month || new Date().toISOString().substring(0, 7); // YYYY-MM
    
    logger.info("Generating monthly report", { month: reportMonth, callerUid });
    
    const report = await generateMonthlyReportData(reportMonth);
    
    // Save report to database
    await db.collection('reports').doc(`monthly_${reportMonth}`).set({
      type: 'monthly',
      month: reportMonth,
      data: report,
      generatedBy: callerUid,
      generatedAt: new Date(),
    });
    
    logger.info("Monthly report generated successfully", { month: reportMonth });
    
    return {
      success: true,
      report,
      month: reportMonth,
    };
    
  } catch (error) {
    logger.error("Error generating monthly report", { 
      month, 
      callerUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Calculate real-time metrics
 */
export const calculateMetrics = onCall<{
  metrics: string[];
  timeRange?: string;
}>({ 
  cors: true 
}, async (request) => {
  const { metrics, timeRange = '24h' } = request.data;
  const callerUid = request.auth?.uid;
  
  try {
    // Verify admin access
    const isAdmin = await verifyAdminRole(callerUid);
    if (!isAdmin) {
      throw new Error("Admin access required");
    }
    
    logger.info("Calculating metrics", { metrics, timeRange, callerUid });
    
    const results: { [key: string]: any } = {};
    
    for (const metric of metrics) {
      results[metric] = await calculateMetric(metric, timeRange);
    }
    
    return {
      success: true,
      metrics: results,
      timeRange,
      calculatedAt: new Date(),
    };
    
  } catch (error) {
    logger.error("Error calculating metrics", { 
      metrics, 
      timeRange, 
      callerUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

// ===========================================
// ANALYTICS EVENT HANDLERS
// ===========================================

/**
 * Triggered when a new order is created
 * Updates order analytics
 */
export const onOrderAnalytics = onDocumentCreated("orders/{orderId}", async (event) => {
  const orderId = event.params.orderId;
  const orderData = event.data?.data();
  
  try {
    if (!orderData) return;
    
    logger.info("Processing order analytics", { orderId });
    
    const today = new Date().toISOString().split('T')[0];
    
    // Update daily order metrics
    await db.collection('analytics').doc(`orders_${today}`).set({
      date: today,
      totalOrders: FieldValue.increment(1),
      totalRevenue: FieldValue.increment(orderData.finalAmount || 0),
      averageOrderValue: 0, // Will be calculated in batch job
      ordersByMarket: {
        [orderData.marketId]: FieldValue.increment(1)
      },
      ordersByPaymentMethod: {
        [orderData.paymentMethod]: FieldValue.increment(1)
      },
      updatedAt: new Date(),
    }, { merge: true });
    
    // Update market analytics
    await db.collection('markets').doc(orderData.marketId).update({
      'analytics.totalOrders': FieldValue.increment(1),
      'analytics.totalRevenue': FieldValue.increment(orderData.finalAmount || 0),
      'analytics.lastOrderAt': new Date(),
      updatedAt: new Date(),
    });
    
    // Update user analytics
    await db.collection('users').doc(orderData.userId).update({
      'analytics.totalOrders': FieldValue.increment(1),
      'analytics.totalSpent': FieldValue.increment(orderData.finalAmount || 0),
      'analytics.lastOrderAt': new Date(),
      updatedAt: new Date(),
    });
    
    logger.info("Order analytics updated", { orderId });
    
  } catch (error) {
    logger.error("Error processing order analytics", { orderId, error });
  }
});

/**
 * Triggered when user document is created
 * Initializes user analytics
 */
export const onUserAnalytics = onDocumentCreated("users/{userId}", async (event) => {
  const userId = event.params.userId;
  const userData = event.data?.data();
  
  try {
    if (!userData) return;
    
    logger.info("Initializing user analytics", { userId });
    
    const today = new Date().toISOString().split('T')[0];
    
    // Update daily user metrics
    await db.collection('analytics').doc(`users_${today}`).set({
      date: today,
      newUsers: FieldValue.increment(1),
      usersByRole: {
        [userData.role]: FieldValue.increment(1)
      },
      updatedAt: new Date(),
    }, { merge: true });
    
    // Initialize user analytics
    await db.collection('users').doc(userId).update({
      analytics: {
        totalOrders: 0,
        totalSpent: 0,
        totalEarned: 0,
        totalDeliveries: 0,
        averageRating: 0,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
      },
      updatedAt: new Date(),
    });
    
    logger.info("User analytics initialized", { userId });
    
  } catch (error) {
    logger.error("Error initializing user analytics", { userId, error });
  }
});

// ===========================================
// REPORT GENERATION FUNCTIONS
// ===========================================

async function generateDailyReportData(date: string) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  
  // Get orders for the day
  const ordersSnapshot = await db.collection('orders')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<', endDate)
    .get();
  
  // Get new users for the day
  const usersSnapshot = await db.collection('users')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<', endDate)
    .get();
  
  // Calculate metrics
  const orders = ordersSnapshot.docs.map(doc => doc.data());
  const users = usersSnapshot.docs.map(doc => doc.data());
  
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.finalAmount || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const newUsers = users.length;
  
  // Orders by status
  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  
  // Orders by payment method
  const ordersByPaymentMethod = orders.reduce((acc, order) => {
    acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  
  // Users by role
  const usersByRole = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  
  return {
    date,
    orders: {
      total: totalOrders,
      revenue: totalRevenue,
      averageValue: averageOrderValue,
      byStatus: ordersByStatus,
      byPaymentMethod: ordersByPaymentMethod,
    },
    users: {
      new: newUsers,
      byRole: usersByRole,
    },
    generatedAt: new Date(),
  };
}

async function generateWeeklyReportData(weekStart: string) {
  const startDate = new Date(weekStart);
  const endDate = new Date(weekStart);
  endDate.setDate(endDate.getDate() + 7);
  
  // Generate daily reports for the week
  const dailyReports = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    
    const dailyData = await generateDailyReportData(dateString);
    dailyReports.push(dailyData);
  }
  
  // Aggregate weekly data
  const totalOrders = dailyReports.reduce((sum, day) => sum + day.orders.total, 0);
  const totalRevenue = dailyReports.reduce((sum, day) => sum + day.orders.revenue, 0);
  const totalNewUsers = dailyReports.reduce((sum, day) => sum + day.users.new, 0);
  
  return {
    weekStart,
    weekEnd: endDate.toISOString().split('T')[0],
    summary: {
      totalOrders,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalNewUsers,
    },
    dailyData: dailyReports,
    generatedAt: new Date(),
  };
}

async function generateMonthlyReportData(month: string) {
  const startDate = new Date(`${month}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  
  // Get all orders for the month
  const ordersSnapshot = await db.collection('orders')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<', endDate)
    .get();
  
  // Get all users for the month
  const usersSnapshot = await db.collection('users')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<', endDate)
    .get();
  
  const orders = ordersSnapshot.docs.map(doc => doc.data());
  const users = usersSnapshot.docs.map(doc => doc.data());
  
  // Calculate monthly metrics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.finalAmount || 0), 0);
  const totalNewUsers = users.length;
  
  // Top markets by revenue
  const marketRevenue = orders.reduce((acc, order) => {
    acc[order.marketId] = (acc[order.marketId] || 0) + (order.finalAmount || 0);
    return acc;
  }, {} as { [key: string]: number });
  
  const topMarkets = Object.entries(marketRevenue)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  
  return {
    month,
    summary: {
      totalOrders,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalNewUsers,
    },
    topMarkets,
    trends: {
      // Calculate growth compared to previous month
      orderGrowth: 0, // Would calculate from previous month data
      revenueGrowth: 0,
      userGrowth: 0,
    },
    generatedAt: new Date(),
  };
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

async function updateEventCounters(eventName: string, eventData: any) {
  const today = new Date().toISOString().split('T')[0];
  const hour = new Date().getHours();
  
  // Update daily counters
  await db.collection('analytics').doc(`events_${today}`).set({
    date: today,
    [`${eventName}_count`]: FieldValue.increment(1),
    total_events: FieldValue.increment(1),
    updatedAt: new Date(),
  }, { merge: true });
  
  // Update hourly counters
  await db.collection('analytics').doc(`events_${today}_${hour}`).set({
    date: today,
    hour,
    [`${eventName}_count`]: FieldValue.increment(1),
    total_events: FieldValue.increment(1),
    updatedAt: new Date(),
  }, { merge: true });
}

async function updateUserAnalytics(userId: string, eventName: string, eventData: any) {
  const updates: any = {
    'analytics.lastActiveAt': new Date(),
    updatedAt: new Date(),
  };
  
  // Update specific metrics based on event
  switch (eventName) {
    case 'page_view':
      updates['analytics.pageViews'] = FieldValue.increment(1);
      break;
    case 'product_view':
      updates['analytics.productViews'] = FieldValue.increment(1);
      break;
    case 'search':
      updates['analytics.searches'] = FieldValue.increment(1);
      break;
  }
  
  await db.collection('users').doc(userId).update(updates);
}

async function calculateMetric(metric: string, timeRange: string) {
  const now = new Date();
  let startDate: Date;
  
  switch (timeRange) {
    case '1h':
      startDate = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  
  switch (metric) {
    case 'active_users':
      return await calculateActiveUsers(startDate, now);
    case 'total_orders':
      return await calculateTotalOrders(startDate, now);
    case 'total_revenue':
      return await calculateTotalRevenue(startDate, now);
    case 'conversion_rate':
      return await calculateConversionRate(startDate, now);
    default:
      throw new Error(`Unknown metric: ${metric}`);
  }
}

async function calculateActiveUsers(startDate: Date, endDate: Date) {
  const snapshot = await db.collection('users')
    .where('analytics.lastActiveAt', '>=', startDate)
    .where('analytics.lastActiveAt', '<=', endDate)
    .get();
  
  return snapshot.size;
}

async function calculateTotalOrders(startDate: Date, endDate: Date) {
  const snapshot = await db.collection('orders')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();
  
  return snapshot.size;
}

async function calculateTotalRevenue(startDate: Date, endDate: Date) {
  const snapshot = await db.collection('orders')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .where('paymentStatus', '==', 'paid')
    .get();
  
  return snapshot.docs.reduce((sum, doc) => {
    const data = doc.data();
    return sum + (data.finalAmount || 0);
  }, 0);
}

async function calculateConversionRate(startDate: Date, endDate: Date) {
  // Calculate conversion rate (orders / unique visitors)
  const ordersSnapshot = await db.collection('orders')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();
  
  const eventsSnapshot = await db.collection('analytics')
    .where('eventName', '==', 'page_view')
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .get();
  
  const uniqueVisitors = new Set(eventsSnapshot.docs.map(doc => doc.data().userId)).size;
  const orders = ordersSnapshot.size;
  
  return uniqueVisitors > 0 ? (orders / uniqueVisitors) * 100 : 0;
}

function isValidEventName(eventName: string): boolean {
  const validEvents = [
    'page_view',
    'product_view',
    'search',
    'add_to_cart',
    'checkout_start',
    'purchase',
    'user_signup',
    'user_login',
    'app_open',
    'app_close',
  ];
  
  return validEvents.includes(eventName) || eventName.startsWith('custom_');
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

async function verifyAdminRole(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    return userData?.role === 'admin';
  } catch (error) {
    return false;
  }
}
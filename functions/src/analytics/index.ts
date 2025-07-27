/**
 * Analytics Cloud Functions
 * Handles event tracking, report generation, and metrics calculation
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

const db = getFirestore();

// ===========================================
// EVENT TRACKING FUNCTIONS
// ===========================================

/**
 * Callable function to track custom events
 */
export const trackEvent = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { eventName, properties, timestamp } = request.data;
    const userId = request.auth.uid;

    if (!eventName) {
      throw new HttpsError('invalid-argument', 'eventName is required');
    }

    try {
      // Create analytics event
      const eventData = {
        eventName,
        userId,
        userRole: request.auth.token.role || 'unknown',
        properties: properties || {},
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        sessionId: properties?.sessionId || null,
        deviceInfo: {
          userAgent: properties?.userAgent || null,
          platform: properties?.platform || null,
          version: properties?.version || null,
        },
        createdAt: new Date(),
      };

      const eventRef = await db.collection('analytics').add(eventData);

      // Update user activity
      await db.collection('users').doc(userId).update({
        lastActivityAt: new Date(),
        totalEvents: FieldValue.increment(1),
        updatedAt: new Date(),
      });

      // Update daily metrics
      await updateDailyMetrics(eventName, userId, request.auth.token.role);

      logger.info("Event tracked", { 
        eventId: eventRef.id,
        eventName,
        userId 
      });

      return {
        success: true,
        eventId: eventRef.id,
        timestamp: eventData.timestamp,
      };

    } catch (error) {
      logger.error("Error tracking event", { 
        eventName,
        userId,
        error: error instanceof Error ? error.message : error 
      });
      
      throw new HttpsError('internal', 'Failed to track event');
    }
  }
);

/**
 * Callable function to generate daily report
 * Admin only function
 */
export const generateDailyReport = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userRole = request.auth.token.role;
    if (userRole !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can generate reports');
    }

    const { date } = request.data;
    const reportDate = date ? new Date(date) : new Date();
    
    // Set to start of day
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Set to end of day
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const report = await generateDailyReportData(startOfDay, endOfDay);

      // Save report to database
      const reportRef = await db.collection('reports').add({
        type: 'daily',
        date: startOfDay,
        data: report,
        generatedBy: request.auth.uid,
        generatedAt: new Date(),
      });

      logger.info("Daily report generated", { 
        reportId: reportRef.id,
        date: startOfDay.toISOString(),
        generatedBy: request.auth.uid 
      });

      return {
        success: true,
        reportId: reportRef.id,
        data: report,
      };

    } catch (error) {
      logger.error("Error generating daily report", { 
        date: reportDate.toISOString(),
        error: error instanceof Error ? error.message : error 
      });
      
      throw new HttpsError('internal', 'Failed to generate daily report');
    }
  }
);

/**
 * Callable function to generate weekly report
 * Admin only function
 */
export const generateWeeklyReport = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userRole = request.auth.token.role;
    if (userRole !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can generate reports');
    }

    const { startDate } = request.data;
    const weekStart = startDate ? new Date(startDate) : getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    try {
      const report = await generateWeeklyReportData(weekStart, weekEnd);

      // Save report to database
      const reportRef = await db.collection('reports').add({
        type: 'weekly',
        startDate: weekStart,
        endDate: weekEnd,
        data: report,
        generatedBy: request.auth.uid,
        generatedAt: new Date(),
      });

      logger.info("Weekly report generated", { 
        reportId: reportRef.id,
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
        generatedBy: request.auth.uid 
      });

      return {
        success: true,
        reportId: reportRef.id,
        data: report,
      };

    } catch (error) {
      logger.error("Error generating weekly report", { 
        startDate: weekStart.toISOString(),
        error: error instanceof Error ? error.message : error 
      });
      
      throw new HttpsError('internal', 'Failed to generate weekly report');
    }
  }
);

/**
 * Callable function to generate monthly report
 * Admin only function
 */
export const generateMonthlyReport = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userRole = request.auth.token.role;
    if (userRole !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can generate reports');
    }

    const { year, month } = request.data;
    const currentDate = new Date();
    const reportYear = year || currentDate.getFullYear();
    const reportMonth = month !== undefined ? month : currentDate.getMonth();

    const monthStart = new Date(reportYear, reportMonth, 1);
    const monthEnd = new Date(reportYear, reportMonth + 1, 0, 23, 59, 59, 999);

    try {
      const report = await generateMonthlyReportData(monthStart, monthEnd);

      // Save report to database
      const reportRef = await db.collection('reports').add({
        type: 'monthly',
        year: reportYear,
        month: reportMonth,
        startDate: monthStart,
        endDate: monthEnd,
        data: report,
        generatedBy: request.auth.uid,
        generatedAt: new Date(),
      });

      logger.info("Monthly report generated", { 
        reportId: reportRef.id,
        year: reportYear,
        month: reportMonth,
        generatedBy: request.auth.uid 
      });

      return {
        success: true,
        reportId: reportRef.id,
        data: report,
      };

    } catch (error) {
      logger.error("Error generating monthly report", { 
        year: reportYear,
        month: reportMonth,
        error: error instanceof Error ? error.message : error 
      });
      
      throw new HttpsError('internal', 'Failed to generate monthly report');
    }
  }
);

/**
 * Callable function to calculate real-time metrics
 * Admin only function
 */
export const calculateMetrics = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userRole = request.auth.token.role;
    if (userRole !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can access metrics');
    }

    const { timeRange, metrics } = request.data;
    const range = timeRange || '24h';

    try {
      const endTime = new Date();
      const startTime = getStartTimeForRange(range, endTime);

      const calculatedMetrics = await calculateRealTimeMetrics(
        startTime, 
        endTime, 
        metrics || ['orders', 'revenue', 'users', 'markets']
      );

      logger.info("Metrics calculated", { 
        timeRange: range,
        requestedBy: request.auth.uid 
      });

      return {
        success: true,
        timeRange: range,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        metrics: calculatedMetrics,
        generatedAt: new Date().toISOString(),
      };

    } catch (error) {
      logger.error("Error calculating metrics", { 
        timeRange: range,
        error: error instanceof Error ? error.message : error 
      });
      
      throw new HttpsError('internal', 'Failed to calculate metrics');
    }
  }
);

// ===========================================
// AUTOMATIC ANALYTICS TRIGGERS
// ===========================================

/**
 * Triggered when a new analytics event is created
 * Updates aggregated metrics
 */
export const onAnalyticsEventCreated = onDocumentCreated(
  "analytics/{eventId}",
  async (event) => {
    const eventId = event.params.eventId;
    const eventData = event.data?.data();

    if (!eventData) {
      logger.error("No analytics event data found", { eventId });
      return;
    }

    try {
      // Update hourly aggregations
      await updateHourlyAggregations(eventData);

      // Update user behavior patterns
      await updateUserBehaviorPatterns(eventData);

      // Update market performance metrics
      if (eventData.properties?.marketId) {
        await updateMarketMetrics(eventData.properties.marketId, eventData);
      }

      logger.info("Analytics event processed", { 
        eventId,
        eventName: eventData.eventName,
        userId: eventData.userId 
      });

    } catch (error) {
      logger.error("Error processing analytics event", { 
        eventId,
        error: error instanceof Error ? error.message : error 
      });
    }
  }
);

// ===========================================
// REPORT GENERATION FUNCTIONS
// ===========================================

async function generateDailyReportData(startDate: Date, endDate: Date) {
  const [
    orderStats,
    revenueStats,
    userStats,
    marketStats,
    topProducts,
    topMarkets,
  ] = await Promise.all([
    getOrderStats(startDate, endDate),
    getRevenueStats(startDate, endDate),
    getUserStats(startDate, endDate),
    getMarketStats(startDate, endDate),
    getTopProducts(startDate, endDate, 10),
    getTopMarkets(startDate, endDate, 10),
  ]);

  return {
    summary: {
      totalOrders: orderStats.total,
      totalRevenue: revenueStats.total,
      newUsers: userStats.newUsers,
      activeMarkets: marketStats.active,
    },
    orders: orderStats,
    revenue: revenueStats,
    users: userStats,
    markets: marketStats,
    topProducts,
    topMarkets,
    generatedAt: new Date().toISOString(),
  };
}

async function generateWeeklyReportData(startDate: Date, endDate: Date) {
  const dailyReports = [];
  const currentDate = new Date(startDate);

  // Generate daily data for each day of the week
  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const dailyData = await generateDailyReportData(dayStart, dayEnd);
    dailyReports.push({
      date: dayStart.toISOString().split('T')[0],
      ...dailyData,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Calculate weekly totals
  const weeklyTotals = dailyReports.reduce((acc, day) => ({
    totalOrders: acc.totalOrders + day.summary.totalOrders,
    totalRevenue: acc.totalRevenue + day.summary.totalRevenue,
    newUsers: acc.newUsers + day.summary.newUsers,
    activeMarkets: Math.max(acc.activeMarkets, day.summary.activeMarkets),
  }), { totalOrders: 0, totalRevenue: 0, newUsers: 0, activeMarkets: 0 });

  return {
    summary: weeklyTotals,
    dailyBreakdown: dailyReports,
    trends: calculateWeeklyTrends(dailyReports),
    generatedAt: new Date().toISOString(),
  };
}

async function generateMonthlyReportData(startDate: Date, endDate: Date) {
  const [
    monthlyStats,
    weeklyBreakdown,
    categoryPerformance,
    userGrowth,
    marketGrowth,
  ] = await Promise.all([
    getMonthlyStats(startDate, endDate),
    getWeeklyBreakdown(startDate, endDate),
    getCategoryPerformance(startDate, endDate),
    getUserGrowthStats(startDate, endDate),
    getMarketGrowthStats(startDate, endDate),
  ]);

  return {
    summary: monthlyStats,
    weeklyBreakdown,
    categoryPerformance,
    userGrowth,
    marketGrowth,
    insights: generateMonthlyInsights(monthlyStats),
    generatedAt: new Date().toISOString(),
  };
}

// ===========================================
// METRICS CALCULATION FUNCTIONS
// ===========================================

async function calculateRealTimeMetrics(
  startTime: Date, 
  endTime: Date, 
  requestedMetrics: string[]
) {
  const metrics: any = {};

  if (requestedMetrics.includes('orders')) {
    metrics.orders = await getOrderMetrics(startTime, endTime);
  }

  if (requestedMetrics.includes('revenue')) {
    metrics.revenue = await getRevenueMetrics(startTime, endTime);
  }

  if (requestedMetrics.includes('users')) {
    metrics.users = await getUserMetrics(startTime, endTime);
  }

  if (requestedMetrics.includes('markets')) {
    metrics.markets = await getMarketMetrics(startTime, endTime);
  }

  if (requestedMetrics.includes('performance')) {
    metrics.performance = await getPerformanceMetrics(startTime, endTime);
  }

  return metrics;
}

async function getOrderStats(startDate: Date, endDate: Date) {
  const ordersQuery = await db.collection('orders')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();

  const orders = ordersQuery.docs.map(doc => doc.data());
  
  const stats = {
    total: orders.length,
    completed: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    pending: orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length,
    byStatus: {} as { [key: string]: number },
    averageValue: 0,
    totalValue: 0,
  };

  // Calculate by status
  orders.forEach(order => {
    stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;
    stats.totalValue += order.totalAmount || 0;
  });

  stats.averageValue = stats.total > 0 ? stats.totalValue / stats.total : 0;

  return stats;
}

async function getRevenueStats(startDate: Date, endDate: Date) {
  const ordersQuery = await db.collection('orders')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .where('status', '==', 'delivered')
    .get();

  const orders = ordersQuery.docs.map(doc => doc.data());
  
  const total = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const deliveryFees = orders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0);
  const subtotal = total - deliveryFees;

  return {
    total,
    subtotal,
    deliveryFees,
    orderCount: orders.length,
    averageOrderValue: orders.length > 0 ? total / orders.length : 0,
  };
}

async function getUserStats(startDate: Date, endDate: Date) {
  const usersQuery = await db.collection('users')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();

  const users = usersQuery.docs.map(doc => doc.data());
  
  const stats = {
    newUsers: users.length,
    byRole: {} as { [key: string]: number },
    verified: users.filter(u => u.verified).length,
    unverified: users.filter(u => !u.verified).length,
  };

  users.forEach(user => {
    stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
  });

  return stats;
}

async function getMarketStats(startDate: Date, endDate: Date) {
  const marketsQuery = await db.collection('markets')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();

  const markets = marketsQuery.docs.map(doc => doc.data());
  
  return {
    new: markets.length,
    active: markets.filter(m => m.isOpen).length,
    inactive: markets.filter(m => !m.isOpen).length,
    byCategory: markets.reduce((acc, market) => {
      market.categories?.forEach((category: string) => {
        acc[category] = (acc[category] || 0) + 1;
      });
      return acc;
    }, {} as { [key: string]: number }),
  };
}

async function getTopProducts(startDate: Date, endDate: Date, limit: number) {
  // This would require more complex aggregation in production
  // For now, return mock data
  return [
    { productId: 'prod1', name: 'Product 1', orderCount: 50, revenue: 2500 },
    { productId: 'prod2', name: 'Product 2', orderCount: 45, revenue: 2250 },
    { productId: 'prod3', name: 'Product 3', orderCount: 40, revenue: 2000 },
  ];
}

async function getTopMarkets(startDate: Date, endDate: Date, limit: number) {
  // This would require more complex aggregation in production
  // For now, return mock data
  return [
    { marketId: 'market1', name: 'Market 1', orderCount: 100, revenue: 5000 },
    { marketId: 'market2', name: 'Market 2', orderCount: 85, revenue: 4250 },
    { marketId: 'market3', name: 'Market 3', orderCount: 70, revenue: 3500 },
  ];
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

async function updateDailyMetrics(eventName: string, userId: string, userRole: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dateKey = today.toISOString().split('T')[0];
  
  await db.collection('dailyMetrics').doc(dateKey).set({
    date: today,
    totalEvents: FieldValue.increment(1),
    [`events.${eventName}`]: FieldValue.increment(1),
    [`userRoles.${userRole}`]: FieldValue.increment(1),
    uniqueUsers: FieldValue.arrayUnion(userId),
    updatedAt: new Date(),
  }, { merge: true });
}

async function updateHourlyAggregations(eventData: any) {
  const hour = new Date(eventData.timestamp);
  hour.setMinutes(0, 0, 0);
  
  const hourKey = hour.toISOString();
  
  await db.collection('hourlyMetrics').doc(hourKey).set({
    hour,
    totalEvents: FieldValue.increment(1),
    [`events.${eventData.eventName}`]: FieldValue.increment(1),
    [`userRoles.${eventData.userRole}`]: FieldValue.increment(1),
    updatedAt: new Date(),
  }, { merge: true });
}

async function updateUserBehaviorPatterns(eventData: any) {
  const userId = eventData.userId;
  const eventName = eventData.eventName;
  
  await db.collection('userBehavior').doc(userId).set({
    userId,
    lastEventAt: eventData.timestamp,
    totalEvents: FieldValue.increment(1),
    [`eventCounts.${eventName}`]: FieldValue.increment(1),
    updatedAt: new Date(),
  }, { merge: true });
}

async function updateMarketMetrics(marketId: string, eventData: any) {
  await db.collection('marketMetrics').doc(marketId).set({
    marketId,
    lastActivityAt: eventData.timestamp,
    totalEvents: FieldValue.increment(1),
    [`events.${eventData.eventName}`]: FieldValue.increment(1),
    updatedAt: new Date(),
  }, { merge: true });
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function getStartTimeForRange(range: string, endTime: Date): Date {
  const start = new Date(endTime);
  
  switch (range) {
    case '1h':
      start.setHours(start.getHours() - 1);
      break;
    case '24h':
      start.setDate(start.getDate() - 1);
      break;
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    default:
      start.setDate(start.getDate() - 1);
  }
  
  return start;
}

function calculateWeeklyTrends(dailyReports: any[]) {
  // Calculate trends based on daily data
  const trends = {
    orders: calculateTrend(dailyReports.map(d => d.summary.totalOrders)),
    revenue: calculateTrend(dailyReports.map(d => d.summary.totalRevenue)),
    users: calculateTrend(dailyReports.map(d => d.summary.newUsers)),
  };
  
  return trends;
}

function calculateTrend(values: number[]): { direction: string; percentage: number } {
  if (values.length < 2) {
    return { direction: 'stable', percentage: 0 };
  }
  
  const first = values[0];
  const last = values[values.length - 1];
  
  if (first === 0) {
    return { direction: last > 0 ? 'up' : 'stable', percentage: 0 };
  }
  
  const percentage = ((last - first) / first) * 100;
  
  return {
    direction: percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable',
    percentage: Math.abs(percentage),
  };
}

function generateMonthlyInsights(monthlyStats: any): string[] {
  const insights = [];
  
  // Add insights based on data patterns
  if (monthlyStats.totalOrders > 1000) {
    insights.push('High order volume this month - consider scaling operations');
  }
  
  if (monthlyStats.totalRevenue > 50000) {
    insights.push('Revenue target exceeded - great performance!');
  }
  
  return insights;
}

// Mock implementations for complex aggregations
async function getOrderMetrics(startTime: Date, endTime: Date) {
  return {
    total: 150,
    completed: 120,
    cancelled: 15,
    pending: 15,
    averageValue: 250,
  };
}

async function getRevenueMetrics(startTime: Date, endTime: Date) {
  return {
    total: 37500,
    growth: 12.5,
    averageOrderValue: 250,
  };
}

async function getUserMetrics(startTime: Date, endTime: Date) {
  return {
    active: 500,
    new: 25,
    returning: 475,
  };
}

async function getMarketMetrics(startTime: Date, endTime: Date) {
  return {
    active: 45,
    totalOrders: 150,
    averageRating: 4.2,
  };
}

async function getPerformanceMetrics(startTime: Date, endTime: Date) {
  return {
    averageDeliveryTime: 35, // minutes
    successRate: 95.5, // percentage
    customerSatisfaction: 4.3, // rating
  };
}

async function getMonthlyStats(startDate: Date, endDate: Date) {
  return {
    totalOrders: 1250,
    totalRevenue: 312500,
    newUsers: 150,
    activeMarkets: 45,
  };
}

async function getWeeklyBreakdown(startDate: Date, endDate: Date) {
  return [
    { week: 1, orders: 300, revenue: 75000 },
    { week: 2, orders: 320, revenue: 80000 },
    { week: 3, orders: 310, revenue: 77500 },
    { week: 4, orders: 320, revenue: 80000 },
  ];
}

async function getCategoryPerformance(startDate: Date, endDate: Date) {
  return [
    { category: 'Food', orders: 800, revenue: 200000 },
    { category: 'Beverages', orders: 300, revenue: 75000 },
    { category: 'Groceries', orders: 150, revenue: 37500 },
  ];
}

async function getUserGrowthStats(startDate: Date, endDate: Date) {
  return {
    newUsers: 150,
    growthRate: 15.5,
    retentionRate: 85.2,
  };
}

async function getMarketGrowthStats(startDate: Date, endDate: Date) {
  return {
    newMarkets: 5,
    growthRate: 12.5,
    activeRate: 88.9,
  };
}
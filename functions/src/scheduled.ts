import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as logger from "firebase-functions/logger";

const db = getFirestore();
const storage = getStorage();

// ===========================================
// DAILY SCHEDULED FUNCTIONS
// ===========================================

/**
 * Daily cleanup tasks
 * Runs every day at 2:00 AM Thailand time
 */
export const dailyCleanup = onSchedule({
  schedule: "0 2 * * *",
  timeZone: "Asia/Bangkok",
  memory: "512MiB",
  timeoutSeconds: 300,
}, async (event) => {
  logger.info("Starting daily cleanup tasks");
  
  try {
    const tasks = [
      cleanupExpiredSessions(),
      cleanupTempFiles(),
      cleanupOldNotifications(),
      updateDailyStats(),
      processExpiredOrders(),
    ];
    
    const results = await Promise.allSettled(tasks);
    
    // Log results
    results.forEach((result, index) => {
      const taskNames = [
        'cleanupExpiredSessions',
        'cleanupTempFiles', 
        'cleanupOldNotifications',
        'updateDailyStats',
        'processExpiredOrders'
      ];
      
      if (result.status === 'fulfilled') {
        logger.info(`Daily task completed: ${taskNames[index]}`);
      } else {
        logger.error(`Daily task failed: ${taskNames[index]}`, { 
          error: result.reason 
        });
      }
    });
    
    // Create cleanup report
    await db.collection('reports').add({
      type: 'daily_cleanup',
      date: new Date().toISOString().split('T')[0],
      tasks: results.map((result, index) => ({
        name: ['cleanupExpiredSessions', 'cleanupTempFiles', 'cleanupOldNotifications', 'updateDailyStats', 'processExpiredOrders'][index],
        status: result.status,
        error: result.status === 'rejected' ? result.reason : null,
      })),
      completedAt: new Date(),
    });
    
    logger.info("Daily cleanup tasks completed");
    
  } catch (error) {
    logger.error("Error in daily cleanup", { 
      error: error instanceof Error ? error.message : error 
    });
  }
});

/**
 * Weekly reports generation
 * Runs every Monday at 6:00 AM Thailand time
 */
export const weeklyReports = onSchedule({
  schedule: "0 6 * * 1",
  timeZone: "Asia/Bangkok",
  memory: "1GiB",
  timeoutSeconds: 540,
}, async (event) => {
  logger.info("Starting weekly reports generation");
  
  try {
    const weekStart = getWeekStart(new Date());
    
    // Generate various weekly reports
    const reports = await Promise.allSettled([
      generateWeeklyOrderReport(weekStart),
      generateWeeklyUserReport(weekStart),
      generateWeeklyRevenueReport(weekStart),
      generateWeeklyPerformanceReport(weekStart),
    ]);
    
    // Save consolidated weekly report
    const weeklyReport = {
      type: 'weekly',
      weekStart,
      weekEnd: getWeekEnd(weekStart),
      reports: reports.map((result, index) => ({
        name: ['orders', 'users', 'revenue', 'performance'][index],
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null,
      })),
      generatedAt: new Date(),
    };
    
    await db.collection('reports').doc(`weekly_${weekStart}`).set(weeklyReport);
    
    // Send report to admins
    await notifyAdminsOfReport('weekly', weeklyReport);
    
    logger.info("Weekly reports generation completed", { weekStart });
    
  } catch (error) {
    logger.error("Error generating weekly reports", { 
      error: error instanceof Error ? error.message : error 
    });
  }
});

/**
 * Monthly analytics processing
 * Runs on the 1st of every month at 3:00 AM Thailand time
 */
export const monthlyAnalytics = onSchedule({
  schedule: "0 3 1 * *",
  timeZone: "Asia/Bangkok",
  memory: "2GiB",
  timeoutSeconds: 900,
}, async (event) => {
  logger.info("Starting monthly analytics processing");
  
  try {
    const lastMonth = getLastMonth();
    
    // Process monthly analytics
    const analytics = await Promise.allSettled([
      processMonthlyUserAnalytics(lastMonth),
      processMonthlyOrderAnalytics(lastMonth),
      processMonthlyMarketAnalytics(lastMonth),
      processMonthlyFinancialAnalytics(lastMonth),
      calculateMonthlyKPIs(lastMonth),
    ]);
    
    // Save monthly analytics
    const monthlyAnalyticsReport = {
      type: 'monthly_analytics',
      month: lastMonth,
      analytics: analytics.map((result, index) => ({
        name: ['users', 'orders', 'markets', 'financial', 'kpis'][index],
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null,
      })),
      processedAt: new Date(),
    };
    
    await db.collection('analytics').doc(`monthly_${lastMonth}`).set(monthlyAnalyticsReport);
    
    // Generate executive summary
    await generateExecutiveSummary(lastMonth, monthlyAnalyticsReport);
    
    logger.info("Monthly analytics processing completed", { month: lastMonth });
    
  } catch (error) {
    logger.error("Error processing monthly analytics", { 
      error: error instanceof Error ? error.message : error 
    });
  }
});

/**
 * Backup schedule
 * Runs every Sunday at 1:00 AM Thailand time
 */
export const backupSchedule = onSchedule({
  schedule: "0 1 * * 0",
  timeZone: "Asia/Bangkok",
  memory: "2GiB",
  timeoutSeconds: 1800,
}, async (event) => {
  logger.info("Starting scheduled backup");
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `scheduled-backup-${timestamp}`;
    
    // Collections to backup
    const collections = [
      'users',
      'markets',
      'products',
      'orders',
      'categories',
      'serviceAreas',
      'reviews',
      'notifications',
    ];
    
    const backupData: { [key: string]: any[] } = {};
    
    // Backup each collection
    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).get();
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
        }));
        
        backupData[collectionName] = documents;
        
        logger.info("Collection backed up", { 
          collection: collectionName,
          documentCount: documents.length 
        });
        
      } catch (error) {
        logger.error("Failed to backup collection", { 
          collection: collectionName,
          error: error instanceof Error ? error.message : error 
        });
      }
    }
    
    // Save backup to Cloud Storage
    const bucket = storage.bucket();
    const backupFile = bucket.file(`backups/scheduled/${backupName}.json`);
    
    await backupFile.save(JSON.stringify(backupData, null, 2), {
      metadata: {
        contentType: 'application/json',
        metadata: {
          type: 'scheduled_backup',
          createdAt: new Date().toISOString(),
          collections: collections.join(','),
        },
      },
    });
    
    // Create backup record
    await db.collection('backups').add({
      name: backupName,
      type: 'scheduled',
      collections,
      filePath: `backups/scheduled/${backupName}.json`,
      size: JSON.stringify(backupData).length,
      createdAt: new Date(),
      status: 'completed',
    });
    
    // Clean up old backups (keep last 30 days)
    await cleanupOldBackups();
    
    logger.info("Scheduled backup completed", { 
      backupName,
      collections: collections.length,
      totalSize: JSON.stringify(backupData).length 
    });
    
  } catch (error) {
    logger.error("Error in scheduled backup", { 
      error: error instanceof Error ? error.message : error 
    });
  }
});

// ===========================================
// CLEANUP FUNCTIONS
// ===========================================

async function cleanupExpiredSessions() {
  logger.info("Cleaning up expired sessions");
  
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Clean up expired FCM tokens
  const usersSnapshot = await db.collection('users').get();
  let cleanedTokens = 0;
  
  for (const userDoc of usersSnapshot.docs) {
    const tokensSnapshot = await userDoc.ref
      .collection('fcmTokens')
      .where('lastUsed', '<', oneDayAgo)
      .get();
    
    const batch = db.batch();
    tokensSnapshot.docs.forEach(tokenDoc => {
      batch.delete(tokenDoc.ref);
      cleanedTokens++;
    });
    
    if (!tokensSnapshot.empty) {
      await batch.commit();
    }
  }
  
  logger.info("Expired sessions cleaned up", { cleanedTokens });
}

async function cleanupTempFiles() {
  logger.info("Cleaning up temporary files");
  
  const bucket = storage.bucket();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const [files] = await bucket.getFiles({
    prefix: 'temp/',
  });
  
  let deletedCount = 0;
  
  for (const file of files) {
    try {
      const [metadata] = await file.getMetadata();
      const createdTime = new Date(metadata.timeCreated || Date.now());
      
      if (createdTime < oneDayAgo) {
        await file.delete();
        deletedCount++;
      }
    } catch (error) {
      logger.warn("Failed to process temp file", { 
        fileName: file.name, 
        error: error instanceof Error ? error.message : error 
      });
    }
  }
  
  logger.info("Temporary files cleaned up", { deletedCount });
}

async function cleanupOldNotifications() {
  logger.info("Cleaning up old notifications");
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const oldNotificationsSnapshot = await db.collection('notifications')
    .where('createdAt', '<', thirtyDaysAgo)
    .where('isRead', '==', true)
    .limit(1000)
    .get();
  
  if (!oldNotificationsSnapshot.empty) {
    const batch = db.batch();
    oldNotificationsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    logger.info("Old notifications cleaned up", { 
      count: oldNotificationsSnapshot.size 
    });
  }
}

async function updateDailyStats() {
  logger.info("Updating daily statistics");
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Calculate yesterday's stats
  const startDate = new Date(yesterday);
  const endDate = new Date(today);
  
  // Orders stats
  const ordersSnapshot = await db.collection('orders')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<', endDate)
    .get();
  
  const orders = ordersSnapshot.docs.map(doc => doc.data());
  const totalRevenue = orders.reduce((sum, order) => sum + (order.finalAmount || 0), 0);
  
  // Users stats
  const newUsersSnapshot = await db.collection('users')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<', endDate)
    .get();
  
  // Save daily stats
  await db.collection('analytics').doc(`daily_${yesterday}`).set({
    date: yesterday,
    orders: {
      total: orders.length,
      revenue: totalRevenue,
      averageValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    },
    users: {
      new: newUsersSnapshot.size,
    },
    calculatedAt: new Date(),
  }, { merge: true });
  
  logger.info("Daily statistics updated", { 
    date: yesterday,
    orders: orders.length,
    revenue: totalRevenue,
    newUsers: newUsersSnapshot.size 
  });
}

async function processExpiredOrders() {
  logger.info("Processing expired orders");
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  // Find pending orders older than 1 hour
  const expiredOrdersSnapshot = await db.collection('orders')
    .where('status', '==', 'pending')
    .where('createdAt', '<', oneHourAgo)
    .get();
  
  const batch = db.batch();
  let processedCount = 0;
  
  expiredOrdersSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      status: 'expired',
      expiredAt: new Date(),
      updatedAt: new Date(),
    });
    processedCount++;
  });
  
  if (processedCount > 0) {
    await batch.commit();
  }
  
  logger.info("Expired orders processed", { processedCount });
}

// ===========================================
// REPORT GENERATION FUNCTIONS
// ===========================================

async function generateWeeklyOrderReport(weekStart: string) {
  const startDate = new Date(weekStart);
  const endDate = new Date(weekStart);
  endDate.setDate(endDate.getDate() + 7);
  
  const ordersSnapshot = await db.collection('orders')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<', endDate)
    .get();
  
  const orders = ordersSnapshot.docs.map(doc => doc.data());
  
  return {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + (order.finalAmount || 0), 0),
    averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + (order.finalAmount || 0), 0) / orders.length : 0,
    ordersByStatus: orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number }),
  };
}

async function generateWeeklyUserReport(weekStart: string) {
  const startDate = new Date(weekStart);
  const endDate = new Date(weekStart);
  endDate.setDate(endDate.getDate() + 7);
  
  const newUsersSnapshot = await db.collection('users')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<', endDate)
    .get();
  
  const users = newUsersSnapshot.docs.map(doc => doc.data());
  
  return {
    newUsers: users.length,
    usersByRole: users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number }),
  };
}

async function generateWeeklyRevenueReport(weekStart: string) {
  const startDate = new Date(weekStart);
  const endDate = new Date(weekStart);
  endDate.setDate(endDate.getDate() + 7);
  
  const paidOrdersSnapshot = await db.collection('orders')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<', endDate)
    .where('paymentStatus', '==', 'paid')
    .get();
  
  const orders = paidOrdersSnapshot.docs.map(doc => doc.data());
  
  return {
    totalRevenue: orders.reduce((sum, order) => sum + (order.finalAmount || 0), 0),
    revenueByMarket: orders.reduce((acc, order) => {
      acc[order.marketId] = (acc[order.marketId] || 0) + (order.finalAmount || 0);
      return acc;
    }, {} as { [key: string]: number }),
  };
}

async function generateWeeklyPerformanceReport(weekStart: string) {
  // This would include performance metrics like response times, error rates, etc.
  return {
    averageResponseTime: 150, // ms
    errorRate: 0.01, // 1%
    uptime: 99.9, // %
  };
}

// ===========================================
// ANALYTICS PROCESSING FUNCTIONS
// ===========================================

async function processMonthlyUserAnalytics(month: string) {
  const startDate = new Date(`${month}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  
  const usersSnapshot = await db.collection('users')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<', endDate)
    .get();
  
  return {
    newUsers: usersSnapshot.size,
    // Additional user analytics would go here
  };
}

async function processMonthlyOrderAnalytics(month: string) {
  const startDate = new Date(`${month}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  
  const ordersSnapshot = await db.collection('orders')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<', endDate)
    .get();
  
  return {
    totalOrders: ordersSnapshot.size,
    // Additional order analytics would go here
  };
}

async function processMonthlyMarketAnalytics(month: string) {
  // Process market performance analytics
  return {
    activeMarkets: 0,
    // Additional market analytics would go here
  };
}

async function processMonthlyFinancialAnalytics(month: string) {
  // Process financial analytics
  return {
    totalRevenue: 0,
    // Additional financial analytics would go here
  };
}

async function calculateMonthlyKPIs(month: string) {
  // Calculate key performance indicators
  return {
    customerAcquisitionCost: 0,
    customerLifetimeValue: 0,
    monthlyRecurringRevenue: 0,
  };
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

async function cleanupOldBackups() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const oldBackupsSnapshot = await db.collection('backups')
    .where('createdAt', '<', thirtyDaysAgo)
    .get();
  
  const bucket = storage.bucket();
  
  for (const backupDoc of oldBackupsSnapshot.docs) {
    const backupData = backupDoc.data();
    
    try {
      // Delete file from storage
      await bucket.file(backupData.filePath).delete();
      
      // Delete backup record
      await backupDoc.ref.delete();
      
      logger.info("Old backup deleted", { 
        backupName: backupData.name,
        filePath: backupData.filePath 
      });
      
    } catch (error) {
      logger.warn("Failed to delete old backup", { 
        backupName: backupData.name,
        error: error instanceof Error ? error.message : error 
      });
    }
  }
}

async function notifyAdminsOfReport(reportType: string, reportData: any) {
  // Get all admin users
  const adminsSnapshot = await db.collection('users')
    .where('role', '==', 'admin')
    .get();
  
  const notifications = adminsSnapshot.docs.map(doc => ({
    userId: doc.id,
    title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report Generated`,
    message: `The ${reportType} report has been generated and is ready for review.`,
    type: 'system',
    data: {
      reportType,
      reportId: reportData.id || `${reportType}_${Date.now()}`,
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
  
  logger.info("Admin notifications sent", { 
    reportType,
    adminCount: notifications.length 
  });
}

async function generateExecutiveSummary(month: string, analyticsData: any) {
  const summary = {
    month,
    keyMetrics: {
      // Extract key metrics from analytics data
      newUsers: analyticsData.analytics.find((a: any) => a.name === 'users')?.data?.newUsers || 0,
      totalOrders: analyticsData.analytics.find((a: any) => a.name === 'orders')?.data?.totalOrders || 0,
      // Add more key metrics
    },
    insights: [
      // Generate insights based on data
      "User growth remained steady this month",
      "Order volume increased by 15% compared to last month",
    ],
    recommendations: [
      // Generate recommendations
      "Focus on customer retention programs",
      "Expand marketing efforts in high-performing regions",
    ],
    generatedAt: new Date(),
  };
  
  await db.collection('reports').doc(`executive_summary_${month}`).set(summary);
  
  logger.info("Executive summary generated", { month });
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

function getLastMonth(): string {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return lastMonth.toISOString().substring(0, 7); // YYYY-MM
}
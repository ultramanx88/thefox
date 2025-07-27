/**
 * Scheduled Cloud Functions
 * Handles recurring tasks and automated maintenance
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";

const db = getFirestore();
const storage = getStorage();

// ===========================================
// DAILY SCHEDULED FUNCTIONS
// ===========================================

/**
 * Daily cleanup task
 * Runs every day at 2:00 AM (Thailand time)
 */
export const dailyCleanup = onSchedule(
  {
    schedule: "0 2 * * *",
    timeZone: "Asia/Bangkok",
    memory: "512MiB",
    timeoutSeconds: 300,
  },
  async (event) => {
    logger.info("Starting daily cleanup task");

    try {
      const results = {
        tempFiles: 0,
        oldNotifications: 0,
        expiredSessions: 0,
        errors: [] as string[],
      };

      // Clean up temporary files older than 24 hours
      try {
        const tempFilesDeleted = await cleanupTempFiles();
        results.tempFiles = tempFilesDeleted;
        logger.info("Temp files cleaned up", { count: tempFilesDeleted });
      } catch (error) {
        const errorMsg = `Temp file cleanup failed: ${error}`;
        results.errors.push(errorMsg);
        logger.error(errorMsg);
      }

      // Clean up old read notifications (older than 30 days)
      try {
        const notificationsDeleted = await cleanupOldNotifications(30);
        results.oldNotifications = notificationsDeleted;
        logger.info("Old notifications cleaned up", { count: notificationsDeleted });
      } catch (error) {
        const errorMsg = `Notification cleanup failed: ${error}`;
        results.errors.push(errorMsg);
        logger.error(errorMsg);
      }

      // Clean up expired user sessions
      try {
        const sessionsDeleted = await cleanupExpiredSessions();
        results.expiredSessions = sessionsDeleted;
        logger.info("Expired sessions cleaned up", { count: sessionsDeleted });
      } catch (error) {
        const errorMsg = `Session cleanup failed: ${error}`;
        results.errors.push(errorMsg);
        logger.error(errorMsg);
      }

      // Update system health metrics
      await updateSystemHealthMetrics();

      // Log cleanup results
      await db.collection('scheduledTaskLogs').add({
        taskName: 'dailyCleanup',
        results,
        executedAt: new Date(),
        success: results.errors.length === 0,
      });

      logger.info("Daily cleanup completed", { results });

    } catch (error) {
      logger.error("Daily cleanup failed", { 
        error: error instanceof Error ? error.message : error 
      });

      // Log failure
      await db.collection('scheduledTaskLogs').add({
        taskName: 'dailyCleanup',
        error: error instanceof Error ? error.message : String(error),
        executedAt: new Date(),
        success: false,
      });
    }
  }
);

/**
 * Daily metrics aggregation
 * Runs every day at 1:00 AM (Thailand time)
 */
export const dailyMetricsAggregation = onSchedule(
  {
    schedule: "0 1 * * *",
    timeZone: "Asia/Bangkok",
    memory: "512MiB",
    timeoutSeconds: 300,
  },
  async (event) => {
    logger.info("Starting daily metrics aggregation");

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date(yesterday);
      today.setDate(today.getDate() + 1);

      // Aggregate daily metrics
      const metrics = await aggregateDailyMetrics(yesterday, today);

      // Save aggregated metrics
      const dateKey = yesterday.toISOString().split('T')[0];
      await db.collection('dailyAggregatedMetrics').doc(dateKey).set({
        date: yesterday,
        metrics,
        aggregatedAt: new Date(),
      });

      // Update monthly aggregations
      await updateMonthlyAggregations(yesterday, metrics);

      logger.info("Daily metrics aggregation completed", { 
        date: dateKey,
        metrics: Object.keys(metrics).length 
      });

    } catch (error) {
      logger.error("Daily metrics aggregation failed", { 
        error: error instanceof Error ? error.message : error 
      });
    }
  }
);

// ===========================================
// WEEKLY SCHEDULED FUNCTIONS
// ===========================================

/**
 * Weekly reports generation
 * Runs every Monday at 6:00 AM (Thailand time)
 */
export const weeklyReports = onSchedule(
  {
    schedule: "0 6 * * 1",
    timeZone: "Asia/Bangkok",
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async (event) => {
    logger.info("Starting weekly reports generation");

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      // Generate weekly report
      const report = await generateWeeklyReport(startDate, endDate);

      // Save report
      const reportRef = await db.collection('reports').add({
        type: 'weekly',
        startDate,
        endDate,
        data: report,
        generatedAt: new Date(),
        automated: true,
      });

      // Send report to admins
      await sendReportToAdmins(reportRef.id, 'weekly', report);

      logger.info("Weekly report generated", { 
        reportId: reportRef.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString() 
      });

    } catch (error) {
      logger.error("Weekly reports generation failed", { 
        error: error instanceof Error ? error.message : error 
      });
    }
  }
);

/**
 * Weekly data backup
 * Runs every Sunday at 3:00 AM (Thailand time)
 */
export const weeklyBackup = onSchedule(
  {
    schedule: "0 3 * * 0",
    timeZone: "Asia/Bangkok",
    memory: "1GiB",
    timeoutSeconds: 900,
  },
  async (event) => {
    logger.info("Starting weekly data backup");

    try {
      const backupId = `weekly_backup_${Date.now()}`;
      const collections = ['users', 'markets', 'products', 'orders', 'payments'];

      const backupResults = [];

      for (const collectionName of collections) {
        try {
          const backupResult = await backupCollection(collectionName, backupId);
          backupResults.push(backupResult);
        } catch (error) {
          logger.error(`Failed to backup collection ${collectionName}`, { error });
          backupResults.push({
            collection: collectionName,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Save backup metadata
      await db.collection('backups').doc(backupId).set({
        backupId,
        type: 'weekly',
        collections: backupResults,
        createdAt: new Date(),
        automated: true,
      });

      const successCount = backupResults.filter(r => r.success).length;
      const failureCount = backupResults.length - successCount;

      logger.info("Weekly backup completed", { 
        backupId,
        totalCollections: collections.length,
        successCount,
        failureCount 
      });

    } catch (error) {
      logger.error("Weekly backup failed", { 
        error: error instanceof Error ? error.message : error 
      });
    }
  }
);

// ===========================================
// MONTHLY SCHEDULED FUNCTIONS
// ===========================================

/**
 * Monthly analytics report
 * Runs on the 1st day of each month at 8:00 AM (Thailand time)
 */
export const monthlyAnalytics = onSchedule(
  {
    schedule: "0 8 1 * *",
    timeZone: "Asia/Bangkok",
    memory: "1GiB",
    timeoutSeconds: 600,
  },
  async (event) => {
    logger.info("Starting monthly analytics generation");

    try {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Generate comprehensive monthly report
      const analytics = await generateMonthlyAnalytics(lastMonth, thisMonth);

      // Save analytics report
      const reportRef = await db.collection('monthlyAnalytics').add({
        year: lastMonth.getFullYear(),
        month: lastMonth.getMonth(),
        startDate: lastMonth,
        endDate: thisMonth,
        data: analytics,
        generatedAt: new Date(),
        automated: true,
      });

      // Send analytics to stakeholders
      await sendMonthlyAnalyticsToStakeholders(reportRef.id, analytics);

      logger.info("Monthly analytics generated", { 
        reportId: reportRef.id,
        year: lastMonth.getFullYear(),
        month: lastMonth.getMonth() 
      });

    } catch (error) {
      logger.error("Monthly analytics generation failed", { 
        error: error instanceof Error ? error.message : error 
      });
    }
  }
);

/**
 * Monthly data archival
 * Runs on the 2nd day of each month at 4:00 AM (Thailand time)
 */
export const monthlyArchival = onSchedule(
  {
    schedule: "0 4 2 * *",
    timeZone: "Asia/Bangkok",
    memory: "1GiB",
    timeoutSeconds: 1800,
  },
  async (event) => {
    logger.info("Starting monthly data archival");

    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 6); // Archive data older than 6 months

      const archivalResults = {
        analytics: 0,
        logs: 0,
        notifications: 0,
        sessions: 0,
      };

      // Archive old analytics data
      archivalResults.analytics = await archiveOldData('analytics', cutoffDate);

      // Archive old logs
      archivalResults.logs = await archiveOldData('maintenanceLogs', cutoffDate);

      // Archive old notifications
      archivalResults.notifications = await archiveOldData('notifications', cutoffDate);

      // Archive old session data
      archivalResults.sessions = await archiveOldData('userSessions', cutoffDate);

      // Log archival results
      await db.collection('archivalLogs').add({
        cutoffDate,
        results: archivalResults,
        executedAt: new Date(),
        automated: true,
      });

      logger.info("Monthly data archival completed", { 
        cutoffDate: cutoffDate.toISOString(),
        results: archivalResults 
      });

    } catch (error) {
      logger.error("Monthly data archival failed", { 
        error: error instanceof Error ? error.message : error 
      });
    }
  }
);

// ===========================================
// HELPER FUNCTIONS
// ===========================================

async function cleanupTempFiles(): Promise<number> {
  const bucket = storage.bucket();
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - 24);

  const [files] = await bucket.getFiles({
    prefix: 'temp/',
  });

  let deletedCount = 0;

  for (const file of files) {
    try {
      const [metadata] = await file.getMetadata();
      const createdTime = new Date(metadata.timeCreated || new Date());

      if (createdTime < cutoffTime) {
        await file.delete();
        deletedCount++;
      }
    } catch (error) {
      logger.warn(`Failed to delete temp file ${file.name}`, { error });
    }
  }

  return deletedCount;
}

async function cleanupOldNotifications(daysOld: number): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const query = db.collection('notifications')
    .where('isRead', '==', true)
    .where('createdAt', '<', cutoffDate)
    .limit(500);

  let deletedCount = 0;
  let hasMore = true;

  while (hasMore) {
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    deletedCount += snapshot.docs.length;

    if (snapshot.docs.length < 500) {
      hasMore = false;
    }
  }

  return deletedCount;
}

async function cleanupExpiredSessions(): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7); // Sessions older than 7 days

  const query = db.collection('userSessions')
    .where('lastAccessAt', '<', cutoffDate)
    .limit(500);

  let deletedCount = 0;
  let hasMore = true;

  while (hasMore) {
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    deletedCount += snapshot.docs.length;

    if (snapshot.docs.length < 500) {
      hasMore = false;
    }
  }

  return deletedCount;
}

async function updateSystemHealthMetrics() {
  const healthMetrics = {
    timestamp: new Date(),
    database: {
      status: 'healthy',
      responseTime: Math.random() * 100, // Mock response time
    },
    storage: {
      status: 'healthy',
      usagePercent: Math.random() * 50, // Mock usage
    },
    functions: {
      status: 'healthy',
      errorRate: Math.random() * 0.01, // Mock error rate
    },
  };

  await db.collection('systemHealth').add(healthMetrics);
}

async function aggregateDailyMetrics(startDate: Date, endDate: Date) {
  // Get orders for the day
  const ordersSnapshot = await db.collection('orders')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<', endDate)
    .get();

  const orders = ordersSnapshot.docs.map(doc => doc.data());

  // Get new users for the day
  const usersSnapshot = await db.collection('users')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<', endDate)
    .get();

  // Get analytics events for the day
  const analyticsSnapshot = await db.collection('analytics')
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<', endDate)
    .get();

  const metrics = {
    orders: {
      total: orders.length,
      completed: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      revenue: orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    },
    users: {
      new: usersSnapshot.size,
      byRole: usersSnapshot.docs.reduce((acc, doc) => {
        const role = doc.data().role;
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }),
    },
    analytics: {
      totalEvents: analyticsSnapshot.size,
      uniqueUsers: new Set(analyticsSnapshot.docs.map(doc => doc.data().userId)).size,
      topEvents: getTopEvents(analyticsSnapshot.docs.map(doc => doc.data())),
    },
  };

  return metrics;
}

async function updateMonthlyAggregations(date: Date, dailyMetrics: any) {
  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  
  await db.collection('monthlyAggregatedMetrics').doc(monthKey).set({
    [`daily.${date.getDate()}`]: dailyMetrics,
    lastUpdated: new Date(),
  }, { merge: true });
}

async function generateWeeklyReport(startDate: Date, endDate: Date) {
  // Mock weekly report generation
  return {
    summary: {
      totalOrders: 150,
      totalRevenue: 37500,
      newUsers: 25,
      activeMarkets: 45,
    },
    trends: {
      orders: { direction: 'up', percentage: 12.5 },
      revenue: { direction: 'up', percentage: 8.3 },
      users: { direction: 'stable', percentage: 2.1 },
    },
    topPerformers: {
      markets: [
        { id: 'market1', name: 'Market 1', orders: 50, revenue: 12500 },
        { id: 'market2', name: 'Market 2', orders: 45, revenue: 11250 },
      ],
      products: [
        { id: 'product1', name: 'Product 1', orders: 30, revenue: 1500 },
        { id: 'product2', name: 'Product 2', orders: 25, revenue: 1250 },
      ],
    },
  };
}

async function generateMonthlyAnalytics(startDate: Date, endDate: Date) {
  // Mock monthly analytics generation
  return {
    overview: {
      totalOrders: 650,
      totalRevenue: 162500,
      newUsers: 120,
      activeMarkets: 48,
      growthRate: 15.2,
    },
    performance: {
      averageOrderValue: 250,
      customerRetentionRate: 68.5,
      marketUtilizationRate: 85.7,
      deliverySuccessRate: 94.2,
    },
    insights: [
      'Order volume increased by 15% compared to last month',
      'Customer retention improved by 5%',
      'New market onboarding exceeded targets',
    ],
  };
}

async function backupCollection(collectionName: string, backupId: string) {
  const snapshot = await db.collection(collectionName).get();
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    data: doc.data(),
  }));

  // Save to storage
  const bucket = storage.bucket();
  const fileName = `backups/${backupId}/${collectionName}.json`;
  const file = bucket.file(fileName);

  await file.save(JSON.stringify(data, null, 2), {
    metadata: {
      contentType: 'application/json',
      metadata: {
        backupId,
        collection: collectionName,
        documentCount: data.length.toString(),
        createdAt: new Date().toISOString(),
      },
    },
  });

  return {
    collection: collectionName,
    documentCount: data.length,
    filePath: fileName,
    success: true,
  };
}

async function archiveOldData(collectionName: string, cutoffDate: Date): Promise<number> {
  // Mock archival - in production, move to cold storage
  const query = db.collection(collectionName)
    .where('createdAt', '<', cutoffDate)
    .limit(1000);

  const snapshot = await query.get();
  
  if (snapshot.empty) {
    return 0;
  }

  // In production, you would:
  // 1. Export data to archive storage
  // 2. Verify archive integrity
  // 3. Delete from active database

  return snapshot.size;
}

async function sendReportToAdmins(reportId: string, reportType: string, reportData: any) {
  // Get admin users
  const adminsSnapshot = await db.collection('users')
    .where('role', '==', 'admin')
    .get();

  const notifications = adminsSnapshot.docs.map(doc => ({
    userId: doc.id,
    title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report Available`,
    message: `New ${reportType} report has been generated and is ready for review.`,
    type: 'system',
    data: { reportId, reportType },
    isRead: false,
    createdAt: new Date(),
  }));

  // Send notifications
  const batch = db.batch();
  notifications.forEach(notification => {
    const notificationRef = db.collection('notifications').doc();
    batch.set(notificationRef, notification);
  });

  await batch.commit();
}

async function sendMonthlyAnalyticsToStakeholders(reportId: string, analytics: any) {
  // Similar to sendReportToAdmins but for monthly analytics
  await sendReportToAdmins(reportId, 'monthly analytics', analytics);
}

function getTopEvents(events: any[]): { [key: string]: number } {
  const eventCounts = events.reduce((acc, event) => {
    acc[event.eventName] = (acc[event.eventName] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // Return top 10 events
  return Object.entries(eventCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .reduce((acc, [event, count]) => {
      acc[event] = count as number;
      return acc;
    }, {} as { [key: string]: number });
}
/**
 * Utility Cloud Functions
 * Handles file cleanup, image optimization, and data maintenance
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";

const db = getFirestore();
const storage = getStorage();

// ===========================================
// FILE MANAGEMENT FUNCTIONS
// ===========================================

/**
 * Callable function to clean up temporary files
 * Admin only function
 */
export const cleanupTempFiles = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userRole = request.auth.token.role;
    if (userRole !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can cleanup temp files');
    }

    const { olderThanHours = 24 } = request.data;

    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

      const bucket = storage.bucket();
      const [files] = await bucket.getFiles({
        prefix: 'temp/',
      });

      let deletedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const file of files) {
        try {
          const [metadata] = await file.getMetadata();
          const createdTime = new Date(metadata.timeCreated || new Date());

          if (createdTime < cutoffTime) {
            await file.delete();
            deletedCount++;
            logger.info("Temp file deleted", { fileName: file.name });
          }
        } catch (error) {
          errorCount++;
          const errorMsg = `Failed to delete ${file.name}: ${error instanceof Error ? error.message : error}`;
          errors.push(errorMsg);
          logger.warn("Failed to delete temp file", { 
            fileName: file.name, 
            error: errorMsg 
          });
        }
      }

      // Log cleanup results
      await db.collection('maintenanceLogs').add({
        type: 'temp_file_cleanup',
        totalFiles: files.length,
        deletedCount,
        errorCount,
        errors: errors.slice(0, 10), // Limit error logs
        cutoffTime,
        executedBy: request.auth.uid,
        executedAt: new Date(),
      });

      logger.info("Temp file cleanup completed", { 
        totalFiles: files.length,
        deletedCount,
        errorCount,
        executedBy: request.auth.uid 
      });

      return {
        success: true,
        totalFiles: files.length,
        deletedCount,
        errorCount,
        message: `Cleaned up ${deletedCount} temporary files`,
      };

    } catch (error) {
      logger.error("Error during temp file cleanup", { 
        error: error instanceof Error ? error.message : error 
      });
      
      throw new HttpsError('internal', 'Failed to cleanup temporary files');
    }
  }
);

/**
 * Callable function to optimize images
 * Resizes and compresses images for better performance
 */
export const optimizeImages = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { imagePaths, options = {} } = request.data;

    if (!imagePaths || !Array.isArray(imagePaths)) {
      throw new HttpsError('invalid-argument', 'imagePaths array is required');
    }

    const defaultOptions = {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 85,
      format: 'jpeg',
    };

    const optimizationOptions = { ...defaultOptions, ...options };

    try {
      const results = [];
      
      for (const imagePath of imagePaths) {
        try {
          const result = await optimizeImage(imagePath, optimizationOptions);
          results.push({
            originalPath: imagePath,
            optimizedPath: result.optimizedPath,
            originalSize: result.originalSize,
            optimizedSize: result.optimizedSize,
            compressionRatio: result.compressionRatio,
            success: true,
          });
        } catch (error) {
          results.push({
            originalPath: imagePath,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      logger.info("Image optimization completed", { 
        totalImages: imagePaths.length,
        successCount,
        failureCount,
        executedBy: request.auth.uid 
      });

      return {
        success: true,
        totalImages: imagePaths.length,
        successCount,
        failureCount,
        results,
      };

    } catch (error) {
      logger.error("Error during image optimization", { 
        error: error instanceof Error ? error.message : error 
      });
      
      throw new HttpsError('internal', 'Failed to optimize images');
    }
  }
);

/**
 * Callable function to generate thumbnails
 * Creates thumbnail versions of images
 */
export const generateThumbnails = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { imagePaths, sizes = [150, 300, 600] } = request.data;

    if (!imagePaths || !Array.isArray(imagePaths)) {
      throw new HttpsError('invalid-argument', 'imagePaths array is required');
    }

    try {
      const results = [];

      for (const imagePath of imagePaths) {
        try {
          const thumbnails = await generateImageThumbnails(imagePath, sizes);
          results.push({
            originalPath: imagePath,
            thumbnails,
            success: true,
          });
        } catch (error) {
          results.push({
            originalPath: imagePath,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      logger.info("Thumbnail generation completed", { 
        totalImages: imagePaths.length,
        successCount,
        failureCount,
        executedBy: request.auth.uid 
      });

      return {
        success: true,
        totalImages: imagePaths.length,
        successCount,
        failureCount,
        results,
      };

    } catch (error) {
      logger.error("Error during thumbnail generation", { 
        error: error instanceof Error ? error.message : error 
      });
      
      throw new HttpsError('internal', 'Failed to generate thumbnails');
    }
  }
);

/**
 * Callable function to backup data
 * Creates backups of important collections
 */
export const backupData = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userRole = request.auth.token.role;
    if (userRole !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can create backups');
    }

    const { collections = ['users', 'markets', 'orders', 'products'], format = 'json' } = request.data;

    try {
      const backupId = `backup_${Date.now()}`;
      const backupPath = `backups/${backupId}`;
      const bucket = storage.bucket();

      const backupResults = [];

      for (const collectionName of collections) {
        try {
          const collectionData = await backupCollection(collectionName);
          
          // Save to storage
          const fileName = `${backupPath}/${collectionName}.${format}`;
          const file = bucket.file(fileName);
          
          await file.save(JSON.stringify(collectionData, null, 2), {
            metadata: {
              contentType: 'application/json',
              metadata: {
                backupId,
                collection: collectionName,
                createdAt: new Date().toISOString(),
                createdBy: request.auth.uid,
              },
            },
          });

          backupResults.push({
            collection: collectionName,
            documentCount: collectionData.length,
            filePath: fileName,
            success: true,
          });

        } catch (error) {
          backupResults.push({
            collection: collectionName,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Create backup metadata
      const backupMetadata = {
        backupId,
        collections: backupResults,
        totalCollections: collections.length,
        successCount: backupResults.filter(r => r.success).length,
        failureCount: backupResults.filter(r => !r.success).length,
        createdBy: request.auth.uid,
        createdAt: new Date(),
        format,
      };

      await db.collection('backups').doc(backupId).set(backupMetadata);

      logger.info("Data backup completed", { 
        backupId,
        collections: collections.length,
        successCount: backupMetadata.successCount,
        failureCount: backupMetadata.failureCount,
        createdBy: request.auth.uid 
      });

      return {
        success: true,
        backupId,
        results: backupResults,
        metadata: backupMetadata,
      };

    } catch (error) {
      logger.error("Error during data backup", { 
        error: error instanceof Error ? error.message : error 
      });
      
      throw new HttpsError('internal', 'Failed to create data backup');
    }
  }
);

// ===========================================
// DATA MAINTENANCE FUNCTIONS
// ===========================================

/**
 * Callable function to clean up old data
 * Removes old analytics events, logs, and temporary data
 */
export const cleanupOldData = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userRole = request.auth.token.role;
    if (userRole !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can cleanup old data');
    }

    const { 
      analyticsRetentionDays = 90,
      logsRetentionDays = 30,
      notificationsRetentionDays = 60 
    } = request.data;

    try {
      const results = {
        analytics: 0,
        logs: 0,
        notifications: 0,
        errors: [] as string[],
      };

      // Cleanup old analytics events
      try {
        const analyticsCount = await cleanupOldDocuments(
          'analytics',
          analyticsRetentionDays
        );
        results.analytics = analyticsCount;
      } catch (error) {
        results.errors.push(`Analytics cleanup failed: ${error}`);
      }

      // Cleanup old logs
      try {
        const logsCount = await cleanupOldDocuments(
          'maintenanceLogs',
          logsRetentionDays
        );
        results.logs = logsCount;
      } catch (error) {
        results.errors.push(`Logs cleanup failed: ${error}`);
      }

      // Cleanup old notifications
      try {
        const notificationsCount = await cleanupOldDocuments(
          'notifications',
          notificationsRetentionDays
        );
        results.notifications = notificationsCount;
      } catch (error) {
        results.errors.push(`Notifications cleanup failed: ${error}`);
      }

      // Log cleanup results
      await db.collection('maintenanceLogs').add({
        type: 'old_data_cleanup',
        results,
        executedBy: request.auth.uid,
        executedAt: new Date(),
      });

      logger.info("Old data cleanup completed", { 
        results,
        executedBy: request.auth.uid 
      });

      return {
        success: true,
        results,
        message: `Cleaned up ${results.analytics + results.logs + results.notifications} old documents`,
      };

    } catch (error) {
      logger.error("Error during old data cleanup", { 
        error: error instanceof Error ? error.message : error 
      });
      
      throw new HttpsError('internal', 'Failed to cleanup old data');
    }
  }
);

/**
 * Callable function to rebuild search indexes
 * Rebuilds search indexes for better performance
 */
export const rebuildSearchIndexes = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userRole = request.auth.token.role;
    if (userRole !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can rebuild search indexes');
    }

    const { collections = ['markets', 'products'] } = request.data;

    try {
      const results = [];

      for (const collectionName of collections) {
        try {
          const indexCount = await rebuildCollectionSearchIndex(collectionName);
          results.push({
            collection: collectionName,
            indexedDocuments: indexCount,
            success: true,
          });
        } catch (error) {
          results.push({
            collection: collectionName,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      logger.info("Search index rebuild completed", { 
        totalCollections: collections.length,
        successCount,
        failureCount,
        executedBy: request.auth.uid 
      });

      return {
        success: true,
        totalCollections: collections.length,
        successCount,
        failureCount,
        results,
      };

    } catch (error) {
      logger.error("Error during search index rebuild", { 
        error: error instanceof Error ? error.message : error 
      });
      
      throw new HttpsError('internal', 'Failed to rebuild search indexes');
    }
  }
);

// ===========================================
// HELPER FUNCTIONS
// ===========================================

async function optimizeImage(imagePath: string, options: any) {
  // Mock image optimization
  // In production, use image processing library like Sharp
  logger.info("Optimizing image", { imagePath, options });

  const mockResult = {
    optimizedPath: imagePath.replace(/\.(jpg|jpeg|png)$/i, '_optimized.jpg'),
    originalSize: 1024 * 1024, // 1MB
    optimizedSize: 512 * 1024, // 512KB
    compressionRatio: 0.5,
  };

  return mockResult;
}

async function generateImageThumbnails(imagePath: string, sizes: number[]) {
  // Mock thumbnail generation
  // In production, use image processing library
  logger.info("Generating thumbnails", { imagePath, sizes });

  const thumbnails = sizes.map(size => ({
    size,
    path: imagePath.replace(/\.(jpg|jpeg|png)$/i, `_thumb_${size}.$1`),
    width: size,
    height: size,
  }));

  return thumbnails;
}

async function backupCollection(collectionName: string) {
  const snapshot = await db.collection(collectionName).get();
  
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    data: doc.data(),
  }));

  logger.info("Collection backed up", { 
    collection: collectionName, 
    documentCount: data.length 
  });

  return data;
}

async function cleanupOldDocuments(collectionName: string, retentionDays: number): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const query = db.collection(collectionName)
    .where('createdAt', '<', cutoffDate)
    .limit(500); // Process in batches

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

    // If we got less than the limit, we're done
    if (snapshot.docs.length < 500) {
      hasMore = false;
    }
  }

  logger.info("Old documents cleaned up", { 
    collection: collectionName, 
    deletedCount,
    cutoffDate: cutoffDate.toISOString() 
  });

  return deletedCount;
}

async function rebuildCollectionSearchIndex(collectionName: string): Promise<number> {
  // Mock search index rebuild
  // In production, integrate with search service (Algolia, Elasticsearch, etc.)
  const snapshot = await db.collection(collectionName).get();
  
  let indexedCount = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Create search index document
    const searchDoc = {
      id: doc.id,
      name: data.name || '',
      description: data.description || '',
      keywords: generateSearchKeywords(data),
      updatedAt: new Date(),
    };

    await db.collection(`${collectionName}_search`).doc(doc.id).set(searchDoc);
    indexedCount++;
  }

  logger.info("Search index rebuilt", { 
    collection: collectionName, 
    indexedCount 
  });

  return indexedCount;
}

function generateSearchKeywords(data: any): string[] {
  const keywords = [];
  
  if (data.name) {
    keywords.push(...data.name.toLowerCase().split(' '));
  }
  
  if (data.description) {
    keywords.push(...data.description.toLowerCase().split(' '));
  }
  
  if (data.categories) {
    keywords.push(...data.categories.map((c: string) => c.toLowerCase()));
  }
  
  if (data.tags) {
    keywords.push(...data.tags.map((t: string) => t.toLowerCase()));
  }

  // Remove duplicates and empty strings
  return [...new Set(keywords.filter(k => k.length > 2))];
}
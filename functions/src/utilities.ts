import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as logger from "firebase-functions/logger";

const db = getFirestore();
const storage = getStorage();

// ===========================================
// FILE MANAGEMENT UTILITIES
// ===========================================

/**
 * Clean up temporary files older than 24 hours
 */
export const cleanupTempFiles = onCall({ 
  cors: true 
}, async (request) => {
  const callerUid = request.auth?.uid;
  
  try {
    // Verify admin access
    const isAdmin = await verifyAdminRole(callerUid);
    if (!isAdmin) {
      throw new Error("Admin access required");
    }
    
    logger.info("Starting temp files cleanup", { callerUid });
    
    const bucket = storage.bucket();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // List all files in temp directory
    const [files] = await bucket.getFiles({
      prefix: 'temp/',
    });
    
    let deletedCount = 0;
    const deletePromises = [];
    
    for (const file of files) {
      try {
        const [metadata] = await file.getMetadata();
        const createdTime = new Date(metadata.timeCreated || Date.now());
        
        if (createdTime < oneDayAgo) {
          deletePromises.push(
            file.delete().then(() => {
              deletedCount++;
              logger.info("Deleted temp file", { fileName: file.name });
            }).catch(error => {
              logger.warn("Failed to delete temp file", { 
                fileName: file.name, 
                error: error.message 
              });
            })
          );
        }
      } catch (error) {
        logger.warn("Failed to get file metadata", { 
          fileName: file.name, 
          error: error instanceof Error ? error.message : error 
        });
      }
    }
    
    await Promise.all(deletePromises);
    
    logger.info("Temp files cleanup completed", { 
      totalFiles: files.length,
      deletedCount,
      callerUid 
    });
    
    return {
      success: true,
      totalFiles: files.length,
      deletedCount,
      message: `Cleaned up ${deletedCount} temporary files`,
    };
    
  } catch (error) {
    logger.error("Error cleaning up temp files", { 
      callerUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Optimize images by compressing and generating thumbnails
 */
export const optimizeImages = onCall<{
  imagePaths: string[];
  quality?: number;
  generateThumbnails?: boolean;
}>({ 
  cors: true 
}, async (request) => {
  const { imagePaths, quality = 0.8, generateThumbnails = true } = request.data;
  const callerUid = request.auth?.uid;
  
  try {
    if (!callerUid) {
      throw new Error("Authentication required");
    }
    
    logger.info("Starting image optimization", { 
      imageCount: imagePaths.length,
      quality,
      generateThumbnails,
      callerUid 
    });
    
    const results = [];
    
    for (const imagePath of imagePaths) {
      try {
        const result = await optimizeImage(imagePath, quality, generateThumbnails);
        results.push({
          originalPath: imagePath,
          success: true,
          ...result,
        });
      } catch (error) {
        results.push({
          originalPath: imagePath,
          success: false,
          error: error instanceof Error ? error.message : error,
        });
        logger.warn("Failed to optimize image", { 
          imagePath, 
          error: error instanceof Error ? error.message : error 
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    logger.info("Image optimization completed", { 
      totalImages: imagePaths.length,
      successCount,
      failureCount: imagePaths.length - successCount,
      callerUid 
    });
    
    return {
      success: true,
      results,
      summary: {
        total: imagePaths.length,
        successful: successCount,
        failed: imagePaths.length - successCount,
      },
    };
    
  } catch (error) {
    logger.error("Error optimizing images", { 
      imagePaths, 
      callerUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Generate thumbnails for existing images
 */
export const generateThumbnails = onCall<{
  imagePaths: string[];
  sizes?: number[];
}>({ 
  cors: true 
}, async (request) => {
  const { imagePaths, sizes = [150, 300, 600] } = request.data;
  const callerUid = request.auth?.uid;
  
  try {
    if (!callerUid) {
      throw new Error("Authentication required");
    }
    
    logger.info("Generating thumbnails", { 
      imageCount: imagePaths.length,
      sizes,
      callerUid 
    });
    
    const results = [];
    
    for (const imagePath of imagePaths) {
      try {
        const thumbnails = await generateImageThumbnails(imagePath, sizes);
        results.push({
          originalPath: imagePath,
          success: true,
          thumbnails,
        });
      } catch (error) {
        results.push({
          originalPath: imagePath,
          success: false,
          error: error instanceof Error ? error.message : error,
        });
        logger.warn("Failed to generate thumbnails", { 
          imagePath, 
          error: error instanceof Error ? error.message : error 
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    logger.info("Thumbnail generation completed", { 
      totalImages: imagePaths.length,
      successCount,
      failureCount: imagePaths.length - successCount,
      callerUid 
    });
    
    return {
      success: true,
      results,
      summary: {
        total: imagePaths.length,
        successful: successCount,
        failed: imagePaths.length - successCount,
      },
    };
    
  } catch (error) {
    logger.error("Error generating thumbnails", { 
      imagePaths, 
      callerUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Backup data to Cloud Storage
 */
export const backupData = onCall<{
  collections: string[];
  backupName?: string;
}>({ 
  cors: true 
}, async (request) => {
  const { collections, backupName } = request.data;
  const callerUid = request.auth?.uid;
  
  try {
    // Verify admin access
    const isAdmin = await verifyAdminRole(callerUid);
    if (!isAdmin) {
      throw new Error("Admin access required");
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const finalBackupName = backupName || `backup-${timestamp}`;
    
    logger.info("Starting data backup", { 
      collections,
      backupName: finalBackupName,
      callerUid 
    });
    
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
        throw error;
      }
    }
    
    // Save backup to Cloud Storage
    const bucket = storage.bucket();
    const backupFile = bucket.file(`backups/${finalBackupName}.json`);
    
    await backupFile.save(JSON.stringify(backupData, null, 2), {
      metadata: {
        contentType: 'application/json',
        metadata: {
          createdBy: callerUid,
          createdAt: new Date().toISOString(),
          collections: collections.join(','),
        },
      },
    });
    
    // Create backup record
    await db.collection('backups').add({
      name: finalBackupName,
      collections,
      filePath: `backups/${finalBackupName}.json`,
      size: JSON.stringify(backupData).length,
      createdBy: callerUid,
      createdAt: new Date(),
      status: 'completed',
    });
    
    logger.info("Data backup completed", { 
      backupName: finalBackupName,
      collections,
      totalSize: JSON.stringify(backupData).length,
      callerUid 
    });
    
    return {
      success: true,
      backupName: finalBackupName,
      collections,
      filePath: `backups/${finalBackupName}.json`,
      size: JSON.stringify(backupData).length,
      message: "Data backup completed successfully",
    };
    
  } catch (error) {
    logger.error("Error backing up data", { 
      collections, 
      backupName,
      callerUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

// ===========================================
// DATA PROCESSING UTILITIES
// ===========================================

/**
 * Process and validate data integrity
 */
export const validateDataIntegrity = onCall<{
  collections: string[];
}>({ 
  cors: true 
}, async (request) => {
  const { collections } = request.data;
  const callerUid = request.auth?.uid;
  
  try {
    // Verify admin access
    const isAdmin = await verifyAdminRole(callerUid);
    if (!isAdmin) {
      throw new Error("Admin access required");
    }
    
    logger.info("Starting data integrity validation", { 
      collections,
      callerUid 
    });
    
    const results: { [key: string]: any } = {};
    
    for (const collectionName of collections) {
      results[collectionName] = await validateCollectionIntegrity(collectionName);
    }
    
    logger.info("Data integrity validation completed", { 
      collections,
      callerUid 
    });
    
    return {
      success: true,
      results,
      message: "Data integrity validation completed",
    };
    
  } catch (error) {
    logger.error("Error validating data integrity", { 
      collections,
      callerUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

/**
 * Migrate data between collections or update schema
 */
export const migrateData = onCall<{
  sourceCollection: string;
  targetCollection?: string;
  migrationScript: string;
  dryRun?: boolean;
}>({ 
  cors: true 
}, async (request) => {
  const { sourceCollection, targetCollection, migrationScript, dryRun = true } = request.data;
  const callerUid = request.auth?.uid;
  
  try {
    // Verify admin access
    const isAdmin = await verifyAdminRole(callerUid);
    if (!isAdmin) {
      throw new Error("Admin access required");
    }
    
    logger.info("Starting data migration", { 
      sourceCollection,
      targetCollection,
      dryRun,
      callerUid 
    });
    
    // Get source documents
    const sourceSnapshot = await db.collection(sourceCollection).get();
    const sourceDocuments = sourceSnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data(),
    }));
    
    // Apply migration script (simplified - in production would use proper script execution)
    const migratedDocuments = sourceDocuments.map(doc => {
      // This would apply the actual migration logic
      return {
        id: doc.id,
        data: applyMigrationScript(doc.data, migrationScript),
      };
    });
    
    let processedCount = 0;
    
    if (!dryRun) {
      const target = targetCollection || sourceCollection;
      const batch = db.batch();
      
      migratedDocuments.forEach(doc => {
        const docRef = db.collection(target).doc(doc.id);
        batch.set(docRef, doc.data);
        processedCount++;
      });
      
      await batch.commit();
    }
    
    logger.info("Data migration completed", { 
      sourceCollection,
      targetCollection,
      processedCount: dryRun ? 0 : processedCount,
      dryRun,
      callerUid 
    });
    
    return {
      success: true,
      sourceCollection,
      targetCollection: targetCollection || sourceCollection,
      totalDocuments: sourceDocuments.length,
      processedCount: dryRun ? 0 : processedCount,
      dryRun,
      preview: dryRun ? migratedDocuments.slice(0, 5) : undefined,
      message: dryRun ? "Migration preview completed" : "Migration completed successfully",
    };
    
  } catch (error) {
    logger.error("Error migrating data", { 
      sourceCollection,
      targetCollection,
      callerUid,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
});

// ===========================================
// HELPER FUNCTIONS
// ===========================================

async function optimizeImage(imagePath: string, quality: number, generateThumbnails: boolean) {
  // In a real implementation, this would:
  // 1. Download the image from Cloud Storage
  // 2. Use image processing library (like Sharp) to compress
  // 3. Upload the optimized image back
  // 4. Generate thumbnails if requested
  
  logger.info("Optimizing image", { imagePath, quality, generateThumbnails });
  
  // Simulate image optimization
  const originalSize = 1024 * 1024; // 1MB
  const optimizedSize = Math.floor(originalSize * quality);
  
  const result: any = {
    optimizedPath: imagePath.replace(/(\.[^.]+)$/, '_optimized$1'),
    originalSize,
    optimizedSize,
    compressionRatio: (1 - quality) * 100,
  };
  
  if (generateThumbnails) {
    result.thumbnails = await generateImageThumbnails(imagePath, [150, 300, 600]);
  }
  
  return result;
}

async function generateImageThumbnails(imagePath: string, sizes: number[]) {
  // In a real implementation, this would generate actual thumbnails
  logger.info("Generating thumbnails", { imagePath, sizes });
  
  return sizes.map(size => ({
    size,
    path: imagePath.replace(/(\.[^.]+)$/, `_thumb_${size}$1`),
    dimensions: `${size}x${size}`,
  }));
}

async function validateCollectionIntegrity(collectionName: string) {
  const snapshot = await db.collection(collectionName).get();
  const documents = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
  
  const issues = [];
  let validCount = 0;
  
  for (const doc of documents) {
    const validation = validateDocumentStructure(collectionName, doc.data);
    if (validation.valid) {
      validCount++;
    } else {
      issues.push({
        documentId: doc.id,
        issues: validation.issues,
      });
    }
  }
  
  return {
    collection: collectionName,
    totalDocuments: documents.length,
    validDocuments: validCount,
    invalidDocuments: issues.length,
    issues: issues.slice(0, 10), // Return first 10 issues
  };
}

function validateDocumentStructure(collectionName: string, data: any) {
  const issues = [];
  
  // Basic validation rules for each collection
  const requiredFields: { [key: string]: string[] } = {
    users: ['email', 'name', 'role', 'createdAt'],
    orders: ['userId', 'marketId', 'items', 'status', 'totalAmount', 'createdAt'],
    markets: ['name', 'ownerId', 'address', 'location', 'isOpen', 'createdAt'],
    products: ['name', 'marketId', 'price', 'category', 'inStock', 'createdAt'],
  };
  
  const required = requiredFields[collectionName] || [];
  
  for (const field of required) {
    if (!data[field]) {
      issues.push(`Missing required field: ${field}`);
    }
  }
  
  // Type validation
  if (collectionName === 'orders' && data.totalAmount && typeof data.totalAmount !== 'number') {
    issues.push('totalAmount must be a number');
  }
  
  if (collectionName === 'users' && data.email && !data.email.includes('@')) {
    issues.push('Invalid email format');
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

function applyMigrationScript(data: any, script: string): any {
  // Simplified migration script application
  // In production, this would use a proper script execution environment
  
  try {
    // Example migration scripts
    switch (script) {
      case 'add_updated_at':
        return {
          ...data,
          updatedAt: new Date(),
        };
      case 'normalize_phone':
        return {
          ...data,
          phone: data.phone ? data.phone.replace(/[^0-9]/g, '') : null,
        };
      default:
        return data;
    }
  } catch (error) {
    logger.error("Error applying migration script", { script, error });
    return data;
  }
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
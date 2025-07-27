import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable,
  getDownloadURL, 
  deleteObject, 
  listAll,
  getMetadata,
  updateMetadata,
  UploadTask,
  UploadTaskSnapshot,
  StorageReference,
  FullMetadata
} from 'firebase/storage';
import { storage } from './config';

// ===========================================
// TYPE DEFINITIONS
// ===========================================

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
}

export interface FileUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: Error) => void;
  onComplete?: (downloadURL: string) => void;
  metadata?: {
    contentType?: string;
    customMetadata?: { [key: string]: string };
  };
}

export interface FileInfo {
  name: string;
  fullPath: string;
  size: number;
  contentType: string;
  downloadURL: string;
  timeCreated: string;
  updated: string;
  customMetadata?: { [key: string]: string };
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

// ===========================================
// STORAGE PATHS CONSTANTS
// ===========================================

export const STORAGE_PATHS = {
  // User files
  USER_AVATAR: (userId: string) => `users/${userId}/profile/avatar`,
  USER_DOCUMENTS: (userId: string) => `users/${userId}/documents`,
  DRIVER_DOCUMENTS: (userId: string, docType: string) => `users/${userId}/driver/${docType}`,
  
  // Market files
  MARKET_PROFILE: (marketId: string) => `markets/${marketId}/profile`,
  MARKET_GALLERY: (marketId: string) => `markets/${marketId}/gallery`,
  MARKET_DOCUMENTS: (marketId: string, docType: string) => `markets/${marketId}/documents/${docType}`,
  
  // Product files
  PRODUCT_IMAGES: (productId: string) => `products/${productId}/images`,
  PRODUCT_THUMBNAILS: (productId: string) => `products/${productId}/thumbnails`,
  
  // Order files
  ORDER_RECEIPTS: (orderId: string) => `orders/${orderId}/receipts`,
  ORDER_DELIVERY: (orderId: string) => `orders/${orderId}/delivery`,
  
  // Category files
  CATEGORY_IMAGES: (categoryId: string) => `categories/${categoryId}/images`,
  
  // System files
  SYSTEM_BRANDING: () => 'system/branding',
  SYSTEM_TEMPLATES: () => 'system/templates',
  
  // Temporary uploads
  TEMP_UPLOADS: (userId: string, uploadId: string) => `temp/${userId}/${uploadId}`,
  
  // Backups and exports
  BACKUPS: () => 'backups',
  EXPORTS: () => 'exports',
} as const;

// ===========================================
// FIREBASE STORAGE SERVICE
// ===========================================

export class FirebaseStorageService {
  
  // ===========================================
  // BASIC FILE OPERATIONS
  // ===========================================
  
  /**
   * Upload a file to Firebase Storage
   */
  async uploadFile(
    path: string,
    file: File | Blob,
    options: FileUploadOptions = {}
  ): Promise<string> {
    try {
      const storageRef = ref(storage, `${path}/${file.name || 'file'}`);
      
      // Set metadata
      const metadata = {
        contentType: file.type || options.metadata?.contentType,
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          originalName: file.name || 'unknown',
          ...options.metadata?.customMetadata,
        },
      };
      
      if (options.onProgress) {
        // Use resumable upload for progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file, metadata);
        
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
              const progress: UploadProgress = {
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
                state: snapshot.state as any,
              };
              options.onProgress?.(progress);
            },
            (error) => {
              options.onError?.(error);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                options.onComplete?.(downloadURL);
                resolve(downloadURL);
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      } else {
        // Simple upload without progress tracking
        const snapshot = await uploadBytes(storageRef, file, metadata);
        return await getDownloadURL(snapshot.ref);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
  
  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    path: string,
    files: File[],
    options: FileUploadOptions = {}
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => 
        this.uploadFile(path, file, options)
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }
  
  /**
   * Get download URL for a file
   */
  async getDownloadURL(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  }
  
  /**
   * Delete a file
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
  
  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(paths: string[]): Promise<void> {
    try {
      const deletePromises = paths.map(path => this.deleteFile(path));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting multiple files:', error);
      throw error;
    }
  }
  
  /**
   * Get file metadata
   */
  async getFileMetadata(path: string): Promise<FullMetadata> {
    try {
      const storageRef = ref(storage, path);
      return await getMetadata(storageRef);
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }
  
  /**
   * Update file metadata
   */
  async updateFileMetadata(
    path: string, 
    metadata: { [key: string]: string }
  ): Promise<FullMetadata> {
    try {
      const storageRef = ref(storage, path);
      return await updateMetadata(storageRef, { customMetadata: metadata });
    } catch (error) {
      console.error('Error updating file metadata:', error);
      throw error;
    }
  }
  
  /**
   * List files in a directory
   */
  async listFiles(path: string): Promise<FileInfo[]> {
    try {
      const storageRef = ref(storage, path);
      const result = await listAll(storageRef);
      
      const fileInfoPromises = result.items.map(async (itemRef) => {
        const metadata = await getMetadata(itemRef);
        const downloadURL = await getDownloadURL(itemRef);
        
        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          size: metadata.size,
          contentType: metadata.contentType || 'unknown',
          downloadURL,
          timeCreated: metadata.timeCreated,
          updated: metadata.updated,
          customMetadata: metadata.customMetadata,
        };
      });
      
      return await Promise.all(fileInfoPromises);
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }
  
  // ===========================================
  // IMAGE PROCESSING UTILITIES
  // ===========================================
  
  /**
   * Resize and compress image before upload
   */
  async processImage(
    file: File, 
    options: ImageProcessingOptions = {}
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const { maxWidth = 1920, maxHeight = 1080, quality = 0.8, format = 'jpeg' } = options;
        
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to process image'));
            }
          },
          `image/${format}`,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
  
  /**
   * Generate thumbnail from image
   */
  async generateThumbnail(
    file: File, 
    size: number = 200
  ): Promise<Blob> {
    return this.processImage(file, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
      format: 'jpeg',
    });
  }
  
  // ===========================================
  // SPECIALIZED UPLOAD METHODS
  // ===========================================
  
  /**
   * Upload user avatar with automatic processing
   */
  async uploadUserAvatar(
    userId: string, 
    file: File,
    options: FileUploadOptions = {}
  ): Promise<string> {
    try {
      // Process image
      const processedImage = await this.processImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8,
        format: 'jpeg',
      });
      
      // Create processed file
      const processedFile = new File([processedImage], `avatar.jpg`, {
        type: 'image/jpeg',
      });
      
      return await this.uploadFile(
        STORAGE_PATHS.USER_AVATAR(userId),
        processedFile,
        options
      );
    } catch (error) {
      console.error('Error uploading user avatar:', error);
      throw error;
    }
  }
  
  /**
   * Upload product images with thumbnails
   */
  async uploadProductImages(
    productId: string,
    files: File[],
    options: FileUploadOptions = {}
  ): Promise<{ images: string[]; thumbnails: string[] }> {
    try {
      const imagePromises = files.map(async (file, index) => {
        // Process main image
        const processedImage = await this.processImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.85,
        });
        
        // Generate thumbnail
        const thumbnail = await this.generateThumbnail(file, 300);
        
        // Create processed files
        const mainFile = new File([processedImage], `image-${index}.jpg`, {
          type: 'image/jpeg',
        });
        const thumbFile = new File([thumbnail], `thumb-${index}.jpg`, {
          type: 'image/jpeg',
        });
        
        // Upload both
        const [imageURL, thumbnailURL] = await Promise.all([
          this.uploadFile(STORAGE_PATHS.PRODUCT_IMAGES(productId), mainFile, options),
          this.uploadFile(STORAGE_PATHS.PRODUCT_THUMBNAILS(productId), thumbFile, options),
        ]);
        
        return { imageURL, thumbnailURL };
      });
      
      const results = await Promise.all(imagePromises);
      
      return {
        images: results.map(r => r.imageURL),
        thumbnails: results.map(r => r.thumbnailURL),
      };
    } catch (error) {
      console.error('Error uploading product images:', error);
      throw error;
    }
  }
  
  /**
   * Upload market gallery images
   */
  async uploadMarketGallery(
    marketId: string,
    files: File[],
    options: FileUploadOptions = {}
  ): Promise<string[]> {
    try {
      const processedFiles = await Promise.all(
        files.map(async (file, index) => {
          const processed = await this.processImage(file, {
            maxWidth: 1200,
            maxHeight: 800,
            quality: 0.85,
          });
          
          return new File([processed], `gallery-${index}.jpg`, {
            type: 'image/jpeg',
          });
        })
      );
      
      return await this.uploadMultipleFiles(
        STORAGE_PATHS.MARKET_GALLERY(marketId),
        processedFiles,
        options
      );
    } catch (error) {
      console.error('Error uploading market gallery:', error);
      throw error;
    }
  }
  
  // ===========================================
  // FILE VALIDATION
  // ===========================================
  
  /**
   * Validate file type and size
   */
  validateFile(file: File, allowedTypes: string[], maxSize: number): boolean {
    // Check file type
    if (!allowedTypes.some(type => file.type.includes(type))) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
    }
    
    return true;
  }
  
  /**
   * Validate image file
   */
  validateImageFile(file: File): boolean {
    return this.validateFile(
      file,
      ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      5 * 1024 * 1024 // 5MB
    );
  }
  
  /**
   * Validate document file
   */
  validateDocumentFile(file: File): boolean {
    return this.validateFile(
      file,
      ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      10 * 1024 * 1024 // 10MB
    );
  }
  
  // ===========================================
  // CLEANUP UTILITIES
  // ===========================================
  
  /**
   * Clean up temporary files older than 24 hours
   */
  async cleanupTempFiles(): Promise<void> {
    try {
      const tempRef = ref(storage, 'temp');
      const result = await listAll(tempRef);
      
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      
      const deletePromises = result.items.map(async (itemRef) => {
        try {
          const metadata = await getMetadata(itemRef);
          const createdTime = new Date(metadata.timeCreated).getTime();
          
          if (createdTime < oneDayAgo) {
            await deleteObject(itemRef);
            console.log(`Deleted old temp file: ${itemRef.fullPath}`);
          }
        } catch (error) {
          console.warn(`Failed to process temp file: ${itemRef.fullPath}`, error);
        }
      });
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
      throw error;
    }
  }
  
  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByType: { [key: string]: number };
  }> {
    try {
      const rootRef = ref(storage);
      const result = await listAll(rootRef);
      
      let totalFiles = 0;
      let totalSize = 0;
      const filesByType: { [key: string]: number } = {};
      
      const processItems = async (items: StorageReference[]) => {
        for (const itemRef of items) {
          try {
            const metadata = await getMetadata(itemRef);
            totalFiles++;
            totalSize += metadata.size;
            
            const contentType = metadata.contentType || 'unknown';
            filesByType[contentType] = (filesByType[contentType] || 0) + 1;
          } catch (error) {
            console.warn(`Failed to get metadata for: ${itemRef.fullPath}`, error);
          }
        }
      };
      
      await processItems(result.items);
      
      // Process subdirectories recursively
      for (const prefixRef of result.prefixes) {
        const subResult = await listAll(prefixRef);
        await processItems(subResult.items);
      }
      
      return {
        totalFiles,
        totalSize,
        filesByType,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const storageService = new FirebaseStorageService();

// Export utility functions
export { STORAGE_PATHS };
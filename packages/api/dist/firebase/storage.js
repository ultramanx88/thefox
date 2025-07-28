"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = exports.FirebaseStorageService = exports.STORAGE_PATHS = void 0;
const storage_1 = require("firebase/storage");
const config_1 = require("./config");
// ===========================================
// STORAGE PATHS CONSTANTS
// ===========================================
exports.STORAGE_PATHS = {
    // User files
    USER_AVATAR: (userId) => `users/${userId}/profile/avatar`,
    USER_DOCUMENTS: (userId) => `users/${userId}/documents`,
    DRIVER_DOCUMENTS: (userId, docType) => `users/${userId}/driver/${docType}`,
    // Market files
    MARKET_PROFILE: (marketId) => `markets/${marketId}/profile`,
    MARKET_GALLERY: (marketId) => `markets/${marketId}/gallery`,
    MARKET_DOCUMENTS: (marketId, docType) => `markets/${marketId}/documents/${docType}`,
    // Product files
    PRODUCT_IMAGES: (productId) => `products/${productId}/images`,
    PRODUCT_THUMBNAILS: (productId) => `products/${productId}/thumbnails`,
    // Order files
    ORDER_RECEIPTS: (orderId) => `orders/${orderId}/receipts`,
    ORDER_DELIVERY: (orderId) => `orders/${orderId}/delivery`,
    // Category files
    CATEGORY_IMAGES: (categoryId) => `categories/${categoryId}/images`,
    // System files
    SYSTEM_BRANDING: () => 'system/branding',
    SYSTEM_TEMPLATES: () => 'system/templates',
    // Temporary uploads
    TEMP_UPLOADS: (userId, uploadId) => `temp/${userId}/${uploadId}`,
    // Backups and exports
    BACKUPS: () => 'backups',
    EXPORTS: () => 'exports',
};
// ===========================================
// FIREBASE STORAGE SERVICE
// ===========================================
class FirebaseStorageService {
    // ===========================================
    // BASIC FILE OPERATIONS
    // ===========================================
    /**
     * Upload a file to Firebase Storage
     */
    async uploadFile(path, file, options = {}) {
        try {
            const storageRef = (0, storage_1.ref)(config_1.storage, `${path}/${file.name || 'file'}`);
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
                const uploadTask = (0, storage_1.uploadBytesResumable)(storageRef, file, metadata);
                return new Promise((resolve, reject) => {
                    uploadTask.on('state_changed', (snapshot) => {
                        const progress = {
                            bytesTransferred: snapshot.bytesTransferred,
                            totalBytes: snapshot.totalBytes,
                            percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
                            state: snapshot.state,
                        };
                        options.onProgress?.(progress);
                    }, (error) => {
                        options.onError?.(error);
                        reject(error);
                    }, async () => {
                        try {
                            const downloadURL = await (0, storage_1.getDownloadURL)(uploadTask.snapshot.ref);
                            options.onComplete?.(downloadURL);
                            resolve(downloadURL);
                        }
                        catch (error) {
                            reject(error);
                        }
                    });
                });
            }
            else {
                // Simple upload without progress tracking
                const snapshot = await (0, storage_1.uploadBytes)(storageRef, file, metadata);
                return await (0, storage_1.getDownloadURL)(snapshot.ref);
            }
        }
        catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }
    /**
     * Upload multiple files
     */
    async uploadMultipleFiles(path, files, options = {}) {
        try {
            const uploadPromises = files.map(file => this.uploadFile(path, file, options));
            return await Promise.all(uploadPromises);
        }
        catch (error) {
            console.error('Error uploading multiple files:', error);
            throw error;
        }
    }
    /**
     * Get download URL for a file
     */
    async getDownloadURL(path) {
        try {
            const storageRef = (0, storage_1.ref)(config_1.storage, path);
            return await (0, storage_1.getDownloadURL)(storageRef);
        }
        catch (error) {
            console.error('Error getting download URL:', error);
            throw error;
        }
    }
    /**
     * Delete a file
     */
    async deleteFile(path) {
        try {
            const storageRef = (0, storage_1.ref)(config_1.storage, path);
            await (0, storage_1.deleteObject)(storageRef);
        }
        catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }
    /**
     * Delete multiple files
     */
    async deleteMultipleFiles(paths) {
        try {
            const deletePromises = paths.map(path => this.deleteFile(path));
            await Promise.all(deletePromises);
        }
        catch (error) {
            console.error('Error deleting multiple files:', error);
            throw error;
        }
    }
    /**
     * Get file metadata
     */
    async getFileMetadata(path) {
        try {
            const storageRef = (0, storage_1.ref)(config_1.storage, path);
            return await (0, storage_1.getMetadata)(storageRef);
        }
        catch (error) {
            console.error('Error getting file metadata:', error);
            throw error;
        }
    }
    /**
     * Update file metadata
     */
    async updateFileMetadata(path, metadata) {
        try {
            const storageRef = (0, storage_1.ref)(config_1.storage, path);
            return await (0, storage_1.updateMetadata)(storageRef, { customMetadata: metadata });
        }
        catch (error) {
            console.error('Error updating file metadata:', error);
            throw error;
        }
    }
    /**
     * List files in a directory
     */
    async listFiles(path) {
        try {
            const storageRef = (0, storage_1.ref)(config_1.storage, path);
            const result = await (0, storage_1.listAll)(storageRef);
            const fileInfoPromises = result.items.map(async (itemRef) => {
                const metadata = await (0, storage_1.getMetadata)(itemRef);
                const downloadURL = await (0, storage_1.getDownloadURL)(itemRef);
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
        }
        catch (error) {
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
    async processImage(file, options = {}) {
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
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    }
                    else {
                        reject(new Error('Failed to process image'));
                    }
                }, `image/${format}`, quality);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }
    /**
     * Generate thumbnail from image
     */
    async generateThumbnail(file, size = 200) {
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
    async uploadUserAvatar(userId, file, options = {}) {
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
            return await this.uploadFile(exports.STORAGE_PATHS.USER_AVATAR(userId), processedFile, options);
        }
        catch (error) {
            console.error('Error uploading user avatar:', error);
            throw error;
        }
    }
    /**
     * Upload product images with thumbnails
     */
    async uploadProductImages(productId, files, options = {}) {
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
                    this.uploadFile(exports.STORAGE_PATHS.PRODUCT_IMAGES(productId), mainFile, options),
                    this.uploadFile(exports.STORAGE_PATHS.PRODUCT_THUMBNAILS(productId), thumbFile, options),
                ]);
                return { imageURL, thumbnailURL };
            });
            const results = await Promise.all(imagePromises);
            return {
                images: results.map(r => r.imageURL),
                thumbnails: results.map(r => r.thumbnailURL),
            };
        }
        catch (error) {
            console.error('Error uploading product images:', error);
            throw error;
        }
    }
    /**
     * Upload market gallery images
     */
    async uploadMarketGallery(marketId, files, options = {}) {
        try {
            const processedFiles = await Promise.all(files.map(async (file, index) => {
                const processed = await this.processImage(file, {
                    maxWidth: 1200,
                    maxHeight: 800,
                    quality: 0.85,
                });
                return new File([processed], `gallery-${index}.jpg`, {
                    type: 'image/jpeg',
                });
            }));
            return await this.uploadMultipleFiles(exports.STORAGE_PATHS.MARKET_GALLERY(marketId), processedFiles, options);
        }
        catch (error) {
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
    validateFile(file, allowedTypes, maxSize) {
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
    validateImageFile(file) {
        return this.validateFile(file, ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'], 5 * 1024 * 1024 // 5MB
        );
    }
    /**
     * Validate document file
     */
    validateDocumentFile(file) {
        return this.validateFile(file, ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], 10 * 1024 * 1024 // 10MB
        );
    }
    // ===========================================
    // CLEANUP UTILITIES
    // ===========================================
    /**
     * Clean up temporary files older than 24 hours
     */
    async cleanupTempFiles() {
        try {
            const tempRef = (0, storage_1.ref)(config_1.storage, 'temp');
            const result = await (0, storage_1.listAll)(tempRef);
            const now = Date.now();
            const oneDayAgo = now - (24 * 60 * 60 * 1000);
            const deletePromises = result.items.map(async (itemRef) => {
                try {
                    const metadata = await (0, storage_1.getMetadata)(itemRef);
                    const createdTime = new Date(metadata.timeCreated).getTime();
                    if (createdTime < oneDayAgo) {
                        await (0, storage_1.deleteObject)(itemRef);
                        console.log(`Deleted old temp file: ${itemRef.fullPath}`);
                    }
                }
                catch (error) {
                    console.warn(`Failed to process temp file: ${itemRef.fullPath}`, error);
                }
            });
            await Promise.all(deletePromises);
        }
        catch (error) {
            console.error('Error cleaning up temp files:', error);
            throw error;
        }
    }
    /**
     * Get storage usage statistics
     */
    async getStorageStats() {
        try {
            const rootRef = (0, storage_1.ref)(config_1.storage);
            const result = await (0, storage_1.listAll)(rootRef);
            let totalFiles = 0;
            let totalSize = 0;
            const filesByType = {};
            const processItems = async (items) => {
                for (const itemRef of items) {
                    try {
                        const metadata = await (0, storage_1.getMetadata)(itemRef);
                        totalFiles++;
                        totalSize += metadata.size;
                        const contentType = metadata.contentType || 'unknown';
                        filesByType[contentType] = (filesByType[contentType] || 0) + 1;
                    }
                    catch (error) {
                        console.warn(`Failed to get metadata for: ${itemRef.fullPath}`, error);
                    }
                }
            };
            await processItems(result.items);
            // Process subdirectories recursively
            for (const prefixRef of result.prefixes) {
                const subResult = await (0, storage_1.listAll)(prefixRef);
                await processItems(subResult.items);
            }
            return {
                totalFiles,
                totalSize,
                filesByType,
            };
        }
        catch (error) {
            console.error('Error getting storage stats:', error);
            throw error;
        }
    }
}
exports.FirebaseStorageService = FirebaseStorageService;
// Export singleton instance
exports.storageService = new FirebaseStorageService();

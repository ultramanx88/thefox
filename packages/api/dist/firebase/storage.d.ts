import { FullMetadata } from 'firebase/storage';
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
        customMetadata?: {
            [key: string]: string;
        };
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
    customMetadata?: {
        [key: string]: string;
    };
}
export interface ImageProcessingOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
}
export declare const STORAGE_PATHS: {
    readonly USER_AVATAR: (userId: string) => string;
    readonly USER_DOCUMENTS: (userId: string) => string;
    readonly DRIVER_DOCUMENTS: (userId: string, docType: string) => string;
    readonly MARKET_PROFILE: (marketId: string) => string;
    readonly MARKET_GALLERY: (marketId: string) => string;
    readonly MARKET_DOCUMENTS: (marketId: string, docType: string) => string;
    readonly PRODUCT_IMAGES: (productId: string) => string;
    readonly PRODUCT_THUMBNAILS: (productId: string) => string;
    readonly ORDER_RECEIPTS: (orderId: string) => string;
    readonly ORDER_DELIVERY: (orderId: string) => string;
    readonly CATEGORY_IMAGES: (categoryId: string) => string;
    readonly SYSTEM_BRANDING: () => string;
    readonly SYSTEM_TEMPLATES: () => string;
    readonly TEMP_UPLOADS: (userId: string, uploadId: string) => string;
    readonly BACKUPS: () => string;
    readonly EXPORTS: () => string;
};
export declare class FirebaseStorageService {
    /**
     * Upload a file to Firebase Storage
     */
    uploadFile(path: string, file: File | Blob, options?: FileUploadOptions): Promise<string>;
    /**
     * Upload multiple files
     */
    uploadMultipleFiles(path: string, files: File[], options?: FileUploadOptions): Promise<string[]>;
    /**
     * Get download URL for a file
     */
    getDownloadURL(path: string): Promise<string>;
    /**
     * Delete a file
     */
    deleteFile(path: string): Promise<void>;
    /**
     * Delete multiple files
     */
    deleteMultipleFiles(paths: string[]): Promise<void>;
    /**
     * Get file metadata
     */
    getFileMetadata(path: string): Promise<FullMetadata>;
    /**
     * Update file metadata
     */
    updateFileMetadata(path: string, metadata: {
        [key: string]: string;
    }): Promise<FullMetadata>;
    /**
     * List files in a directory
     */
    listFiles(path: string): Promise<FileInfo[]>;
    /**
     * Resize and compress image before upload
     */
    processImage(file: File, options?: ImageProcessingOptions): Promise<Blob>;
    /**
     * Generate thumbnail from image
     */
    generateThumbnail(file: File, size?: number): Promise<Blob>;
    /**
     * Upload user avatar with automatic processing
     */
    uploadUserAvatar(userId: string, file: File, options?: FileUploadOptions): Promise<string>;
    /**
     * Upload product images with thumbnails
     */
    uploadProductImages(productId: string, files: File[], options?: FileUploadOptions): Promise<{
        images: string[];
        thumbnails: string[];
    }>;
    /**
     * Upload market gallery images
     */
    uploadMarketGallery(marketId: string, files: File[], options?: FileUploadOptions): Promise<string[]>;
    /**
     * Validate file type and size
     */
    validateFile(file: File, allowedTypes: string[], maxSize: number): boolean;
    /**
     * Validate image file
     */
    validateImageFile(file: File): boolean;
    /**
     * Validate document file
     */
    validateDocumentFile(file: File): boolean;
    /**
     * Clean up temporary files older than 24 hours
     */
    cleanupTempFiles(): Promise<void>;
    /**
     * Get storage usage statistics
     */
    getStorageStats(): Promise<{
        totalFiles: number;
        totalSize: number;
        filesByType: {
            [key: string]: number;
        };
    }>;
}
export declare const storageService: FirebaseStorageService;
export { STORAGE_PATHS };

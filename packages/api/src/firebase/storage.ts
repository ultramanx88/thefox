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
  StorageReference,
} from 'firebase/storage';
import { storage } from './config';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export class FirebaseStorageService {
  // Upload file with progress tracking
  static uploadFile(
    file: File | Blob,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          };
          onProgress?.(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  // Simple upload without progress tracking
  static async uploadFileSimple(file: File | Blob, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  // Upload multiple files
  static async uploadMultipleFiles(
    files: File[],
    basePath: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<string[]> {
    const uploadPromises = files.map((file, index) => {
      const fileName = `${Date.now()}_${index}_${file.name}`;
      const filePath = `${basePath}/${fileName}`;
      
      return this.uploadFile(file, filePath, (progress) => {
        onProgress?.(index, progress);
      });
    });

    return Promise.all(uploadPromises);
  }

  // Delete file
  static async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  // Get download URL
  static async getDownloadURL(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Get download URL error:', error);
      throw error;
    }
  }

  // List files in a directory
  static async listFiles(path: string): Promise<StorageReference[]> {
    try {
      const storageRef = ref(storage, path);
      const result = await listAll(storageRef);
      return result.items;
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  }

  // Get file metadata
  static async getFileMetadata(path: string) {
    try {
      const storageRef = ref(storage, path);
      return await getMetadata(storageRef);
    } catch (error) {
      console.error('Get metadata error:', error);
      throw error;
    }
  }

  // Update file metadata
  static async updateFileMetadata(path: string, metadata: any) {
    try {
      const storageRef = ref(storage, path);
      return await updateMetadata(storageRef, metadata);
    } catch (error) {
      console.error('Update metadata error:', error);
      throw error;
    }
  }

  // Helper methods for common upload scenarios
  static async uploadUserAvatar(userId: string, file: File): Promise<string> {
    const path = `users/${userId}/avatar/${Date.now()}_${file.name}`;
    return this.uploadFileSimple(file, path);
  }

  static async uploadProductImage(marketId: string, productId: string, file: File): Promise<string> {
    const path = `markets/${marketId}/products/${productId}/${Date.now()}_${file.name}`;
    return this.uploadFileSimple(file, path);
  }

  static async uploadMarketImage(marketId: string, file: File): Promise<string> {
    const path = `markets/${marketId}/images/${Date.now()}_${file.name}`;
    return this.uploadFileSimple(file, path);
  }

  // Upload with compression (for web)
  static async uploadImageWithCompression(
    file: File,
    path: string,
    maxWidth: number = 1200,
    quality: number = 0.8
  ): Promise<string> {
    try {
      const compressedFile = await this.compressImage(file, maxWidth, quality);
      return this.uploadFileSimple(compressedFile, path);
    } catch (error) {
      console.error('Upload with compression error:', error);
      throw error;
    }
  }

  // Image compression helper (browser only)
  private static compressImage(file: File, maxWidth: number, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      // Check if running in browser
      if (typeof document === 'undefined') {
        reject(new Error('Image compression only available in browser'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob: Blob | null) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to blob conversion failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // Generate unique file path
  static generateFilePath(basePath: string, fileName: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const extension = fileName.split('.').pop();
    return `${basePath}/${timestamp}_${randomId}.${extension}`;
  }
}
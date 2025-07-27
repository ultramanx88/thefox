import { useState, useCallback } from 'react';
import { 
  storageService, 
  FileUploadOptions, 
  UploadProgress, 
  FileInfo,
  STORAGE_PATHS 
} from '@/packages/api/src/firebase/storage';

// ===========================================
// GENERIC STORAGE HOOKS
// ===========================================

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);

  const uploadFile = useCallback(async (
    path: string,
    file: File,
    options: Omit<FileUploadOptions, 'onProgress' | 'onError' | 'onComplete'> = {}
  ) => {
    setUploading(true);
    setError(null);
    setProgress(null);
    setDownloadURL(null);

    try {
      const url = await storageService.uploadFile(path, file, {
        ...options,
        onProgress: setProgress,
        onError: (err) => setError(err.message),
        onComplete: setDownloadURL,
      });
      
      setDownloadURL(url);
      return url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(null);
    setError(null);
    setDownloadURL(null);
  }, []);

  return {
    uploadFile,
    uploading,
    progress,
    error,
    downloadURL,
    reset,
  };
}

export function useMultipleFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ [key: string]: UploadProgress }>({});
  const [error, setError] = useState<string | null>(null);
  const [downloadURLs, setDownloadURLs] = useState<string[]>([]);
  const [completed, setCompleted] = useState<number>(0);

  const uploadFiles = useCallback(async (
    path: string,
    files: File[],
    options: Omit<FileUploadOptions, 'onProgress' | 'onError' | 'onComplete'> = {}
  ) => {
    setUploading(true);
    setError(null);
    setProgress({});
    setDownloadURLs([]);
    setCompleted(0);

    try {
      const uploadPromises = files.map(async (file, index) => {
        return storageService.uploadFile(path, file, {
          ...options,
          onProgress: (prog) => {
            setProgress(prev => ({ ...prev, [index]: prog }));
          },
          onError: (err) => setError(err.message),
          onComplete: () => {
            setCompleted(prev => prev + 1);
          },
        });
      });

      const urls = await Promise.all(uploadPromises);
      setDownloadURLs(urls);
      return urls;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress({});
    setError(null);
    setDownloadURLs([]);
    setCompleted(0);
  }, []);

  return {
    uploadFiles,
    uploading,
    progress,
    error,
    downloadURLs,
    completed,
    total: Object.keys(progress).length,
    reset,
  };
}

export function useFileList(path: string) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fileList = await storageService.listFiles(path);
      setFiles(fileList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load files';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [path]);

  const deleteFile = useCallback(async (filePath: string) => {
    try {
      await storageService.deleteFile(filePath);
      setFiles(prev => prev.filter(file => file.fullPath !== filePath));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    files,
    loading,
    error,
    loadFiles,
    deleteFile,
  };
}

// ===========================================
// SPECIALIZED STORAGE HOOKS
// ===========================================

export function useUserAvatarUpload(userId: string) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarURL, setAvatarURL] = useState<string | null>(null);

  const uploadAvatar = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    setProgress(null);

    try {
      // Validate image file
      storageService.validateImageFile(file);

      const url = await storageService.uploadUserAvatar(userId, file, {
        onProgress: setProgress,
        onError: (err) => setError(err.message),
        onComplete: setAvatarURL,
      });

      setAvatarURL(url);
      return url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Avatar upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [userId]);

  return {
    uploadAvatar,
    uploading,
    progress,
    error,
    avatarURL,
  };
}

export function useProductImageUpload(productId: string) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ [key: string]: UploadProgress }>({});
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  const uploadImages = useCallback(async (files: File[]) => {
    setUploading(true);
    setError(null);
    setProgress({});

    try {
      // Validate all files
      files.forEach(file => storageService.validateImageFile(file));

      const result = await storageService.uploadProductImages(productId, files, {
        onProgress: (prog) => {
          // Note: This is simplified - in reality you'd track progress per file
          setProgress({ overall: prog });
        },
        onError: (err) => setError(err.message),
      });

      setImages(result.images);
      setThumbnails(result.thumbnails);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Image upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [productId]);

  return {
    uploadImages,
    uploading,
    progress,
    error,
    images,
    thumbnails,
  };
}

export function useMarketGalleryUpload(marketId: string) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ [key: string]: UploadProgress }>({});
  const [error, setError] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const uploadGallery = useCallback(async (files: File[]) => {
    setUploading(true);
    setError(null);
    setProgress({});

    try {
      // Validate all files
      files.forEach(file => storageService.validateImageFile(file));

      const urls = await storageService.uploadMarketGallery(marketId, files, {
        onProgress: (prog) => {
          setProgress({ overall: prog });
        },
        onError: (err) => setError(err.message),
      });

      setGalleryImages(urls);
      return urls;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gallery upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [marketId]);

  return {
    uploadGallery,
    uploading,
    progress,
    error,
    galleryImages,
  };
}

export function useDocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [documentURL, setDocumentURL] = useState<string | null>(null);

  const uploadDocument = useCallback(async (path: string, file: File) => {
    setUploading(true);
    setError(null);
    setProgress(null);

    try {
      // Validate document file
      storageService.validateDocumentFile(file);

      const url = await storageService.uploadFile(path, file, {
        onProgress: setProgress,
        onError: (err) => setError(err.message),
        onComplete: setDocumentURL,
      });

      setDocumentURL(url);
      return url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Document upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    uploadDocument,
    uploading,
    progress,
    error,
    documentURL,
  };
}

// ===========================================
// UTILITY HOOKS
// ===========================================

export function useStorageStats() {
  const [stats, setStats] = useState<{
    totalFiles: number;
    totalSize: number;
    filesByType: { [key: string]: number };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const storageStats = await storageService.getStorageStats();
      setStats(storageStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stats';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    loading,
    error,
    loadStats,
  };
}

export function useTempFileCleanup() {
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanupTempFiles = useCallback(async () => {
    setCleaning(true);
    setError(null);

    try {
      await storageService.cleanupTempFiles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Cleanup failed';
      setError(errorMessage);
      throw err;
    } finally {
      setCleaning(false);
    }
  }, []);

  return {
    cleanupTempFiles,
    cleaning,
    error,
  };
}

// ===========================================
// DRAG AND DROP HOOK
// ===========================================

export function useDragAndDrop(
  onFilesDropped: (files: File[]) => void,
  acceptedTypes: string[] = ['image/*']
) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    
    // Validate file types
    const invalidFiles = files.filter(file => 
      !acceptedTypes.some(type => 
        type === '*/*' || 
        file.type.match(type.replace('*', '.*'))
      )
    );

    if (invalidFiles.length > 0) {
      setError(`Invalid file types: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    onFilesDropped(files);
  }, [onFilesDropped, acceptedTypes]);

  return {
    isDragging,
    error,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  };
}
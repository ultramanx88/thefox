import {
  ref,
  uploadBytesResumable,
  getDownloadURL as _getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './config';

export const FirebaseStorageService = {
  uploadFile: (
    file: File,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<string> =>
    new Promise((resolve, reject) => {
      const task = uploadBytesResumable(ref(storage, path), file);
      task.on(
        'state_changed',
        (snap) => onProgress?.(snap.bytesTransferred / snap.totalBytes),
        reject,
        async () => resolve(await _getDownloadURL(task.snapshot.ref))
      );
    }),

  uploadMultipleFiles: (files: File[], basePath: string) =>
    Promise.all(files.map((f, i) => FirebaseStorageService.uploadFile(f, `${basePath}/${i}_${f.name}`))),

  uploadProductImage: (marketId: string, productId: string, file: File) =>
    FirebaseStorageService.uploadFile(file, `markets/${marketId}/products/${productId}/${file.name}`),

  uploadUserAvatar: (userId: string, file: File) =>
    FirebaseStorageService.uploadFile(file, `users/${userId}/avatar/${file.name}`),

  deleteFile: (path: string) => deleteObject(ref(storage, path)),

  getDownloadURL: (path: string) => _getDownloadURL(ref(storage, path)),
};

export const storageService = FirebaseStorageService;

// Firebase services exports
export { app, auth, db, storage, functions } from './config';
export { FirebaseAuthService } from './auth';
export { FirestoreService } from './firestore';
export { FirebaseStorageService } from './storage';
export { FirebaseFunctionsService } from './functions';
export { CategoryService } from './categories';

// Re-export Firebase types for convenience
export type {
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';

export type {
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';

export type {
  StorageReference,
  UploadTask,
} from 'firebase/storage';

export type {
  HttpsCallableResult,
} from 'firebase/functions';
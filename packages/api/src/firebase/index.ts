// Firebase services exports
export { app, auth, db, storage, functions } from './config';
export { FirebaseAuthService, type UserRole, type UserStatus, type UserProfile, type AuthUser } from './auth';
export { FirestoreService } from './firestore';
export { FirebaseStorageService } from './storage';
export { FirebaseFunctionsService } from './functions';
export { CategoryService } from './categories';
export { SettingsService } from './settings';

// Registration and verification services
export { RegistrationService } from './registration';
export { VerificationService } from './verification';
export { UserClaimsService } from './user-claims';

// Registration types
export type {
  BaseRegistrationData,
  CustomerRegistrationData,
  DriverRegistrationData,
  VendorRegistrationData,
  RegistrationResult,
  DocumentInfo,
  WorkingHours,
  DaySchedule,
  OperatingHours,
} from './registration';

export type {
  VerificationToken,
  SMSVerificationData,
  VerificationResult,
} from './verification';

export type {
  CustomClaims,
  RolePermissions,
} from './user-claims';

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
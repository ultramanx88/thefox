# Design Document

## Overview

การออกแบบระบบสมัครสมาชิกที่ครบถ้วนสำหรับแอปพลิเคชัน theFOX โดยรองรับการสมัครสมาชิกสำหรับผู้ใช้ 3 ประเภท: ลูกค้า (Customer), คนขับ (Driver), และร้านค้า (Vendor) พร้อมระบบยืนยันตัวตน การอนุมัติ และการจัดการข้อมูลที่เหมาะสมสำหรับแต่ละบทบาท

จากการวิเคราะห์โค้ดที่มีอยู่ พบว่าระบบมีหน้า UI สำหรับการสมัครสมาชิกแล้ว แต่ยังขาดการเชื่อมต่อกับ Firebase และ business logic ที่สมบูรณ์

## Architecture

### Registration Flow Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Customer      │    │     Driver      │    │     Vendor      │
│  Registration   │    │  Registration   │    │  Registration   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │           Registration Service                  │
         │         (Firebase Auth + Firestore)            │
         └─────────────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │              Verification System                │
         │    (Email, SMS, Document Verification)          │
         └─────────────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │             Admin Approval System               │
         │        (Driver & Vendor Applications)           │
         └─────────────────────────────────────────────────┘
```

### User Role System
```
User (Base)
├── Customer (Auto-approved)
├── Driver (Requires approval)
│   ├── Documents verification
│   ├── Background check
│   └── Vehicle verification
└── Vendor (Requires approval)
    ├── Business verification
    ├── Document validation
    └── Location verification
```

## Components and Interfaces

### 1. Registration Form Components
```typescript
// Customer Registration
interface CustomerRegistrationForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: Date;
  acceptTerms: boolean;
}

// Driver Registration
interface DriverRegistrationForm {
  // Personal Information
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: Date;
  nationalId: string;
  
  // Vehicle Information
  vehicleType: 'motorcycle' | 'car' | 'truck';
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  licensePlate: string;
  
  // Documents
  idCardFile: File;
  driverLicenseFile: File;
  vehicleRegistrationFile: File;
  profilePhotoFile: File;
  
  // Availability
  availableAreas: string[];
  workingHours: WorkingHours;
  
  acceptTerms: boolean;
}

// Vendor Registration
interface VendorRegistrationForm {
  // Business Information
  email: string;
  password: string;
  businessName: string;
  businessType: 'individual' | 'company';
  taxId?: string;
  
  // Contact Information
  ownerFirstName: string;
  ownerLastName: string;
  phone: string;
  alternativePhone?: string;
  
  // Location Information
  address: string;
  district: string;
  province: string;
  postalCode: string;
  coordinates: { lat: number; lng: number };
  
  // Business Details
  categories: string[];
  description: string;
  operatingHours: OperatingHours;
  
  // Documents
  businessLicenseFile?: File;
  idCardFile: File;
  bankBookFile: File;
  storePhotoFiles: File[];
  
  acceptTerms: boolean;
}
```

### 2. Registration Service Interface
```typescript
interface RegistrationService {
  // Customer Registration
  registerCustomer(data: CustomerRegistrationForm): Promise<RegistrationResult>;
  
  // Driver Registration
  registerDriver(data: DriverRegistrationForm): Promise<RegistrationResult>;
  
  // Vendor Registration
  registerVendor(data: VendorRegistrationForm): Promise<RegistrationResult>;
  
  // Verification
  sendEmailVerification(email: string): Promise<void>;
  verifyEmail(token: string): Promise<boolean>;
  sendSMSVerification(phone: string): Promise<void>;
  verifySMS(phone: string, code: string): Promise<boolean>;
  
  // Document Upload
  uploadDocument(file: File, path: string): Promise<string>;
  
  // Application Status
  getApplicationStatus(userId: string): Promise<ApplicationStatus>;
}

interface RegistrationResult {
  success: boolean;
  userId?: string;
  message: string;
  requiresApproval?: boolean;
  verificationRequired?: {
    email: boolean;
    phone: boolean;
    documents: boolean;
  };
}
```

### 3. Admin Approval System
```typescript
interface AdminApprovalService {
  // Get pending applications
  getPendingApplications(type: 'driver' | 'vendor'): Promise<Application[]>;
  
  // Review application
  reviewApplication(applicationId: string, decision: ApprovalDecision): Promise<void>;
  
  // Get application details
  getApplicationDetails(applicationId: string): Promise<ApplicationDetails>;
}

interface Application {
  id: string;
  userId: string;
  type: 'driver' | 'vendor';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  userData: any;
  documents: DocumentInfo[];
}

interface ApprovalDecision {
  approved: boolean;
  reason?: string;
  notes?: string;
  conditions?: string[];
}
```

## Data Models

### User Base Model
```typescript
interface BaseUser {
  id: string;
  email: string;
  role: 'customer' | 'driver' | 'vendor' | 'admin';
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    avatar?: string;
  };
  verification: {
    email: boolean;
    phone: boolean;
    documents: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface Customer extends BaseUser {
  role: 'customer';
  preferences: {
    language: string;
    currency: string;
    notifications: NotificationSettings;
  };
  addresses: Address[];
  paymentMethods: PaymentMethod[];
}

interface Driver extends BaseUser {
  role: 'driver';
  driverInfo: {
    nationalId: string;
    dateOfBirth: Date;
    licenseNumber: string;
    licenseExpiry: Date;
    rating: number;
    totalDeliveries: number;
  };
  vehicle: {
    type: 'motorcycle' | 'car' | 'truck';
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
    color: string;
    capacity: number;
  };
  availability: {
    areas: string[];
    workingHours: WorkingHours;
    isOnline: boolean;
    currentLocation?: { lat: number; lng: number };
  };
  documents: {
    idCard: DocumentInfo;
    driverLicense: DocumentInfo;
    vehicleRegistration: DocumentInfo;
    profilePhoto: DocumentInfo;
  };
  bankInfo: BankInfo;
}

interface Vendor extends BaseUser {
  role: 'vendor';
  businessInfo: {
    businessName: string;
    businessType: 'individual' | 'company';
    taxId?: string;
    description: string;
    categories: string[];
    rating: number;
    totalOrders: number;
  };
  location: {
    address: string;
    district: string;
    province: string;
    postalCode: string;
    coordinates: { lat: number; lng: number };
  };
  operatingHours: OperatingHours;
  documents: {
    businessLicense?: DocumentInfo;
    idCard: DocumentInfo;
    bankBook: DocumentInfo;
    storePhotos: DocumentInfo[];
  };
  bankInfo: BankInfo;
  settings: {
    autoAcceptOrders: boolean;
    preparationTime: number;
    minimumOrder: number;
    deliveryRadius: number;
  };
}
```

### Supporting Models
```typescript
interface DocumentInfo {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  notes?: string;
}

interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface DaySchedule {
  isOpen: boolean;
  openTime?: string; // "09:00"
  closeTime?: string; // "18:00"
  breakStart?: string;
  breakEnd?: string;
}

interface BankInfo {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchName?: string;
}
```

## Error Handling

### Registration Error Types
```typescript
enum RegistrationErrorType {
  VALIDATION_ERROR = 'validation_error',
  EMAIL_EXISTS = 'email_exists',
  PHONE_EXISTS = 'phone_exists',
  WEAK_PASSWORD = 'weak_password',
  INVALID_DOCUMENT = 'invalid_document',
  UPLOAD_FAILED = 'upload_failed',
  VERIFICATION_FAILED = 'verification_failed',
  NETWORK_ERROR = 'network_error',
  SERVER_ERROR = 'server_error'
}

interface RegistrationError {
  type: RegistrationErrorType;
  message: string;
  field?: string;
  details?: any;
}
```

### Error Handling Strategy
```typescript
class RegistrationErrorHandler {
  handleValidationError(error: ValidationError): UserFriendlyError;
  handleFirebaseError(error: FirebaseError): UserFriendlyError;
  handleUploadError(error: StorageError): UserFriendlyError;
  retryRegistration(data: any, maxRetries: number): Promise<RegistrationResult>;
}
```

## Testing Strategy

### Unit Testing
- Form validation testing
- Registration service testing
- Document upload testing
- Error handling testing

### Integration Testing
- End-to-end registration flows
- Firebase integration testing
- Email/SMS verification testing
- Admin approval workflow testing

### User Acceptance Testing
- Registration form usability
- Mobile responsiveness
- Document upload experience
- Approval notification system

## Security Considerations

### Data Protection
- Password hashing and salting
- Sensitive data encryption
- PII data handling compliance
- Document secure storage

### Verification Security
- Email verification token expiry
- SMS verification rate limiting
- Document authenticity validation
- Anti-fraud measures

### Access Control
- Role-based permissions
- Registration rate limiting
- Suspicious activity detection
- Account lockout mechanisms

## Performance Optimization

### Frontend Optimization
- Form validation debouncing
- Progressive form loading
- Image compression before upload
- Offline form data persistence

### Backend Optimization
- Batch document processing
- Async verification workflows
- Database query optimization
- CDN for document storage

### Monitoring
- Registration success rates
- Form abandonment tracking
- Document verification times
- Admin approval metrics
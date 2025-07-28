import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './config';
import { FirebaseAuthService, UserRole, UserStatus, UserProfile } from './auth';

// ===========================================
// REGISTRATION INTERFACES
// ===========================================

export interface BaseRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth?: Date;
}

export interface CustomerRegistrationData extends BaseRegistrationData {
  acceptTerms: boolean;
}

export interface DriverRegistrationData extends BaseRegistrationData {
  nationalId: string;
  vehicleType: 'motorcycle' | 'car' | 'truck';
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  licensePlate: string;
  availableAreas: string[];
  workingHours: WorkingHours;
  documents: {
    idCard: File;
    driverLicense: File;
    vehicleRegistration: File;
    profilePhoto: File;
  };
  acceptTerms: boolean;
}

export interface VendorRegistrationData extends BaseRegistrationData {
  businessName: string;
  businessType: 'individual' | 'company';
  taxId?: string;
  alternativePhone?: string;
  address: string;
  district: string;
  province: string;
  postalCode: string;
  coordinates: { lat: number; lng: number };
  categories: string[];
  description: string;
  operatingHours: OperatingHours;
  documents: {
    businessLicense?: File;
    idCard: File;
    bankBook: File;
    storePhotos: File[];
  };
  acceptTerms: boolean;
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string; // "09:00"
  closeTime?: string; // "18:00"
  breakStart?: string;
  breakEnd?: string;
}

export interface OperatingHours {
  [key: string]: {
    open: string;
    close: string;
    isOpen: boolean;
  };
}

export interface RegistrationResult {
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

export interface DocumentInfo {
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

// ===========================================
// REGISTRATION SERVICE CLASS
// ===========================================

export class RegistrationService {
  
  // ===========================================
  // CUSTOMER REGISTRATION
  // ===========================================
  
  static async registerCustomer(data: CustomerRegistrationData): Promise<RegistrationResult> {
    try {
      // Validate terms acceptance
      if (!data.acceptTerms) {
        return {
          success: false,
          message: 'You must accept the terms and conditions to register.',
        };
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      // Create user profile in Firestore
      const userProfile = await FirebaseAuthService.createUserProfile(
        user.uid,
        data.email,
        'customer',
        {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
        }
      );

      // Send email verification
      await sendEmailVerification(user);

      return {
        success: true,
        userId: user.uid,
        message: 'Customer registration successful. Please check your email for verification.',
        requiresApproval: false,
        verificationRequired: {
          email: true,
          phone: false,
          documents: false,
        },
      };
    } catch (error: any) {
      console.error('Customer registration error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  // ===========================================
  // DRIVER REGISTRATION
  // ===========================================
  
  static async registerDriver(data: DriverRegistrationData): Promise<RegistrationResult> {
    try {
      // Validate terms acceptance
      if (!data.acceptTerms) {
        return {
          success: false,
          message: 'You must accept the terms and conditions to register.',
        };
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      // Upload documents
      const uploadedDocuments = await this.uploadDriverDocuments(user.uid, data.documents);

      // Create user profile in Firestore
      await FirebaseAuthService.createUserProfile(
        user.uid,
        data.email,
        'driver',
        {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
        }
      );

      // Create driver-specific data
      await setDoc(doc(db, 'users', user.uid), {
        driverInfo: {
          nationalId: data.nationalId,
          dateOfBirth: data.dateOfBirth,
          licenseNumber: '', // To be filled during verification
          licenseExpiry: null,
          rating: 0,
          totalDeliveries: 0,
        },
        vehicle: {
          type: data.vehicleType,
          brand: data.vehicleBrand,
          model: data.vehicleModel,
          year: data.vehicleYear,
          licensePlate: data.licensePlate,
          color: '',
          capacity: 0,
        },
        availability: {
          areas: data.availableAreas,
          workingHours: data.workingHours,
          isOnline: false,
          currentLocation: null,
        },
        documents: uploadedDocuments,
        bankInfo: null,
      }, { merge: true });

      // Create application record for admin review
      await this.createApplication(user.uid, 'driver', {
        personalInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          nationalId: data.nationalId,
          dateOfBirth: data.dateOfBirth,
        },
        vehicleInfo: {
          type: data.vehicleType,
          brand: data.vehicleBrand,
          model: data.vehicleModel,
          year: data.vehicleYear,
          licensePlate: data.licensePlate,
        },
        availability: {
          areas: data.availableAreas,
          workingHours: data.workingHours,
        },
        documents: uploadedDocuments,
      });

      // Send email verification
      await sendEmailVerification(user);

      return {
        success: true,
        userId: user.uid,
        message: 'Driver application submitted successfully. Your application will be reviewed by our team.',
        requiresApproval: true,
        verificationRequired: {
          email: true,
          phone: true,
          documents: true,
        },
      };
    } catch (error: any) {
      console.error('Driver registration error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  // ===========================================
  // VENDOR REGISTRATION
  // ===========================================
  
  static async registerVendor(data: VendorRegistrationData): Promise<RegistrationResult> {
    try {
      // Validate terms acceptance
      if (!data.acceptTerms) {
        return {
          success: false,
          message: 'You must accept the terms and conditions to register.',
        };
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      // Upload documents
      const uploadedDocuments = await this.uploadVendorDocuments(user.uid, data.documents);

      // Create user profile in Firestore
      await FirebaseAuthService.createUserProfile(
        user.uid,
        data.email,
        'vendor',
        {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
        }
      );

      // Create vendor-specific data
      await setDoc(doc(db, 'users', user.uid), {
        businessInfo: {
          businessName: data.businessName,
          businessType: data.businessType,
          taxId: data.taxId,
          description: data.description,
          categories: data.categories,
          rating: 0,
          totalOrders: 0,
        },
        location: {
          address: data.address,
          district: data.district,
          province: data.province,
          postalCode: data.postalCode,
          coordinates: data.coordinates,
        },
        operatingHours: data.operatingHours,
        documents: uploadedDocuments,
        bankInfo: null,
        settings: {
          autoAcceptOrders: false,
          preparationTime: 30,
          minimumOrder: 0,
          deliveryRadius: 5,
        },
      }, { merge: true });

      // Create application record for admin review
      await this.createApplication(user.uid, 'vendor', {
        personalInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          alternativePhone: data.alternativePhone,
        },
        businessInfo: {
          businessName: data.businessName,
          businessType: data.businessType,
          taxId: data.taxId,
          description: data.description,
          categories: data.categories,
        },
        location: {
          address: data.address,
          district: data.district,
          province: data.province,
          postalCode: data.postalCode,
          coordinates: data.coordinates,
        },
        operatingHours: data.operatingHours,
        documents: uploadedDocuments,
      });

      // Send email verification
      await sendEmailVerification(user);

      return {
        success: true,
        userId: user.uid,
        message: 'Vendor application submitted successfully. Your application will be reviewed by our team.',
        requiresApproval: true,
        verificationRequired: {
          email: true,
          phone: false,
          documents: true,
        },
      };
    } catch (error: any) {
      console.error('Vendor registration error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  // ===========================================
  // DOCUMENT UPLOAD HELPERS
  // ===========================================
  
  private static async uploadDriverDocuments(
    userId: string,
    documents: DriverRegistrationData['documents']
  ): Promise<Record<string, DocumentInfo>> {
    const uploadedDocs: Record<string, DocumentInfo> = {};

    try {
      // Upload ID Card
      if (documents.idCard) {
        uploadedDocs.idCard = await this.uploadDocument(
          documents.idCard,
          `users/${userId}/documents/id-card`
        );
      }

      // Upload Driver License
      if (documents.driverLicense) {
        uploadedDocs.driverLicense = await this.uploadDocument(
          documents.driverLicense,
          `users/${userId}/documents/driver-license`
        );
      }

      // Upload Vehicle Registration
      if (documents.vehicleRegistration) {
        uploadedDocs.vehicleRegistration = await this.uploadDocument(
          documents.vehicleRegistration,
          `users/${userId}/documents/vehicle-registration`
        );
      }

      // Upload Profile Photo
      if (documents.profilePhoto) {
        uploadedDocs.profilePhoto = await this.uploadDocument(
          documents.profilePhoto,
          `users/${userId}/documents/profile-photo`
        );
      }

      return uploadedDocs;
    } catch (error) {
      console.error('Error uploading driver documents:', error);
      throw error;
    }
  }

  private static async uploadVendorDocuments(
    userId: string,
    documents: VendorRegistrationData['documents']
  ): Promise<Record<string, DocumentInfo | DocumentInfo[]>> {
    const uploadedDocs: Record<string, DocumentInfo | DocumentInfo[]> = {};

    try {
      // Upload Business License (optional)
      if (documents.businessLicense) {
        uploadedDocs.businessLicense = await this.uploadDocument(
          documents.businessLicense,
          `users/${userId}/documents/business-license`
        );
      }

      // Upload ID Card
      if (documents.idCard) {
        uploadedDocs.idCard = await this.uploadDocument(
          documents.idCard,
          `users/${userId}/documents/id-card`
        );
      }

      // Upload Bank Book
      if (documents.bankBook) {
        uploadedDocs.bankBook = await this.uploadDocument(
          documents.bankBook,
          `users/${userId}/documents/bank-book`
        );
      }

      // Upload Store Photos
      if (documents.storePhotos && documents.storePhotos.length > 0) {
        const storePhotos: DocumentInfo[] = [];
        for (let i = 0; i < documents.storePhotos.length; i++) {
          const photo = await this.uploadDocument(
            documents.storePhotos[i],
            `users/${userId}/documents/store-photos/photo-${i + 1}`
          );
          storePhotos.push(photo);
        }
        uploadedDocs.storePhotos = storePhotos;
      }

      return uploadedDocs;
    } catch (error) {
      console.error('Error uploading vendor documents:', error);
      throw error;
    }
  }

  private static async uploadDocument(file: File, path: string): Promise<DocumentInfo> {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${path}.${fileExtension}`;
      const storageRef = ref(storage, fileName);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        id: snapshot.ref.name,
        fileName: file.name,
        fileUrl: downloadURL,
        fileType: file.type,
        uploadedAt: new Date(),
        verified: false,
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  // ===========================================
  // APPLICATION MANAGEMENT
  // ===========================================
  
  private static async createApplication(
    userId: string,
    type: 'driver' | 'vendor',
    userData: any
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'applications'), {
        userId,
        type,
        status: 'pending',
        userData,
        submittedAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
        reviewNotes: null,
      });
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  }

  // ===========================================
  // ERROR HANDLING
  // ===========================================
  
  private static getErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email address is already registered. Please use a different email or try signing in.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password with at least 8 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password registration is not enabled. Please contact support.';
      case 'storage/unauthorized':
        return 'File upload failed due to permissions. Please try again.';
      case 'storage/canceled':
        return 'File upload was canceled. Please try again.';
      case 'storage/unknown':
        return 'An unknown error occurred during file upload. Please try again.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }
}

// Export for convenience
export { RegistrationService as default };
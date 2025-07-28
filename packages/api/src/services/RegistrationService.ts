import { FirebaseAuthService, UserRole, UserProfile } from '../firebase/auth';
import { FirebaseFunctionsService } from '../firebase/functions';
import { storageService } from '../firebase/storage';

export interface CustomerRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth?: Date;
  acceptTerms: boolean;
}

export interface DriverRegistrationData {
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
  workingHours: any; // WorkingHours type
  
  acceptTerms: boolean;
}

export interface VendorRegistrationData {
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
  operatingHours: any; // OperatingHours type
  
  // Documents
  businessLicenseFile?: File;
  idCardFile: File;
  bankBookFile: File;
  storePhotoFiles: File[];
  
  acceptTerms: boolean;
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

export class RegistrationService {
  /**
   * Register a new customer
   */
  static async registerCustomer(data: CustomerRegistrationData): Promise<RegistrationResult> {
    try {
      // Validate terms acceptance
      if (!data.acceptTerms) {
        throw new Error('Terms and conditions must be accepted');
      }

      // Create user with Firebase Auth
      const userCredential = await FirebaseAuthService.signUp(
        data.email,
        data.password,
        `${data.firstName} ${data.lastName}`
      );

      // Create user profile
      const profile = await FirebaseAuthService.createUserProfile(
        userCredential.user.uid,
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
      await FirebaseFunctionsService.sendEmailVerification(userCredential.user.uid);

      return {
        success: true,
        userId: userCredential.user.uid,
        message: 'Customer registration successful. Please verify your email.',
        requiresApproval: false,
        verificationRequired: {
          email: true,
          phone: false,
          documents: false,
        },
      };
    } catch (error) {
      console.error('Customer registration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Register a new driver
   */
  static async registerDriver(data: DriverRegistrationData): Promise<RegistrationResult> {
    try {
      // Validate terms acceptance
      if (!data.acceptTerms) {
        throw new Error('Terms and conditions must be accepted');
      }

      // Create user with Firebase Auth
      const userCredential = await FirebaseAuthService.signUp(
        data.email,
        data.password,
        `${data.firstName} ${data.lastName}`
      );

      const userId = userCredential.user.uid;

      // Upload documents
      const documentUrls = await this.uploadDriverDocuments(userId, {
        idCard: data.idCardFile,
        driverLicense: data.driverLicenseFile,
        vehicleRegistration: data.vehicleRegistrationFile,
        profilePhoto: data.profilePhotoFile,
      });

      // Create user profile with driver-specific data
      const profile = await FirebaseAuthService.createUserProfile(
        userId,
        data.email,
        'driver',
        {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
        }
      );

      // Save driver-specific information
      await this.saveDriverInfo(userId, {
        nationalId: data.nationalId,
        vehicle: {
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
        documents: documentUrls,
      });

      // Send email verification
      await FirebaseFunctionsService.sendEmailVerification(userId);

      return {
        success: true,
        userId,
        message: 'Driver application submitted successfully. Please verify your email and wait for approval.',
        requiresApproval: true,
        verificationRequired: {
          email: true,
          phone: true,
          documents: true,
        },
      };
    } catch (error) {
      console.error('Driver registration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Register a new vendor
   */
  static async registerVendor(data: VendorRegistrationData): Promise<RegistrationResult> {
    try {
      // Validate terms acceptance
      if (!data.acceptTerms) {
        throw new Error('Terms and conditions must be accepted');
      }

      // Create user with Firebase Auth
      const userCredential = await FirebaseAuthService.signUp(
        data.email,
        data.password,
        `${data.ownerFirstName} ${data.ownerLastName}`
      );

      const userId = userCredential.user.uid;

      // Upload documents
      const documentUrls = await this.uploadVendorDocuments(userId, {
        businessLicense: data.businessLicenseFile,
        idCard: data.idCardFile,
        bankBook: data.bankBookFile,
        storePhotos: data.storePhotoFiles,
      });

      // Create user profile with vendor-specific data
      const profile = await FirebaseAuthService.createUserProfile(
        userId,
        data.email,
        'vendor',
        {
          firstName: data.ownerFirstName,
          lastName: data.ownerLastName,
          phone: data.phone,
        }
      );

      // Save vendor-specific information
      await this.saveVendorInfo(userId, {
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
        contact: {
          phone: data.phone,
          alternativePhone: data.alternativePhone,
        },
        operatingHours: data.operatingHours,
        documents: documentUrls,
      });

      // Send email verification
      await FirebaseFunctionsService.sendEmailVerification(userId);

      return {
        success: true,
        userId,
        message: 'Vendor application submitted successfully. Please verify your email and wait for approval.',
        requiresApproval: true,
        verificationRequired: {
          email: true,
          phone: false,
          documents: true,
        },
      };
    } catch (error) {
      console.error('Vendor registration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Upload driver documents
   */
  private static async uploadDriverDocuments(
    userId: string,
    files: {
      idCard: File;
      driverLicense: File;
      vehicleRegistration: File;
      profilePhoto: File;
    }
  ): Promise<{
    idCard: string;
    driverLicense: string;
    vehicleRegistration: string;
    profilePhoto: string;
  }> {
    const uploads = await Promise.all([
      storageService.uploadFile(
        `drivers/${userId}/documents/id-card`,
        files.idCard
      ),
      storageService.uploadFile(
        `drivers/${userId}/documents/driver-license`,
        files.driverLicense
      ),
      storageService.uploadFile(
        `drivers/${userId}/documents/vehicle-registration`,
        files.vehicleRegistration
      ),
      storageService.uploadFile(
        `drivers/${userId}/profile/photo`,
        files.profilePhoto
      ),
    ]);

    return {
      idCard: uploads[0],
      driverLicense: uploads[1],
      vehicleRegistration: uploads[2],
      profilePhoto: uploads[3],
    };
  }

  /**
   * Upload vendor documents
   */
  private static async uploadVendorDocuments(
    userId: string,
    files: {
      businessLicense?: File;
      idCard: File;
      bankBook: File;
      storePhotos: File[];
    }
  ): Promise<{
    businessLicense?: string;
    idCard: string;
    bankBook: string;
    storePhotos: string[];
  }> {
    const uploads: Promise<string>[] = [];

    // Upload business license if provided
    if (files.businessLicense) {
      uploads.push(
        storageService.uploadFile(
          `vendors/${userId}/documents/business-license`,
          files.businessLicense
        )
      );
    }

    // Upload ID card
    uploads.push(
      storageService.uploadFile(
        `vendors/${userId}/documents/id-card`,
        files.idCard
      )
    );

    // Upload bank book
    uploads.push(
      storageService.uploadFile(
        `vendors/${userId}/documents/bank-book`,
        files.bankBook
      )
    );

    // Upload store photos
    const storePhotoUploads = files.storePhotos.map((photo, index) =>
      storageService.uploadFile(
        `vendors/${userId}/store/photo-${index + 1}`,
        photo
      )
    );

    uploads.push(...storePhotoUploads);

    const results = await Promise.all(uploads);

    let resultIndex = 0;
    const documentUrls: any = {};

    if (files.businessLicense) {
      documentUrls.businessLicense = results[resultIndex++];
    }

    documentUrls.idCard = results[resultIndex++];
    documentUrls.bankBook = results[resultIndex++];
    documentUrls.storePhotos = results.slice(resultIndex);

    return documentUrls;
  }

  /**
   * Save driver-specific information
   */
  private static async saveDriverInfo(userId: string, driverData: any): Promise<void> {
    // This would typically save to a drivers collection
    // For now, we'll update the user profile with driver-specific data
    await FirebaseAuthService.updateUserProfileData(userId, {
      driverInfo: driverData,
    });
  }

  /**
   * Save vendor-specific information
   */
  private static async saveVendorInfo(userId: string, vendorData: any): Promise<void> {
    // This would typically save to a vendors collection
    // For now, we'll update the user profile with vendor-specific data
    await FirebaseAuthService.updateUserProfileData(userId, {
      vendorInfo: vendorData,
    });
  }
}
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
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth: Date;
    nationalId: string;
    vehicleType: 'motorcycle' | 'car' | 'truck';
    vehicleBrand: string;
    vehicleModel: string;
    vehicleYear: number;
    licensePlate: string;
    idCardFile: File;
    driverLicenseFile: File;
    vehicleRegistrationFile: File;
    profilePhotoFile: File;
    availableAreas: string[];
    workingHours: any;
    acceptTerms: boolean;
}
export interface VendorRegistrationData {
    email: string;
    password: string;
    businessName: string;
    businessType: 'individual' | 'company';
    taxId?: string;
    ownerFirstName: string;
    ownerLastName: string;
    phone: string;
    alternativePhone?: string;
    address: string;
    district: string;
    province: string;
    postalCode: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    categories: string[];
    description: string;
    operatingHours: any;
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
export declare class RegistrationService {
    /**
     * Register a new customer
     */
    static registerCustomer(data: CustomerRegistrationData): Promise<RegistrationResult>;
    /**
     * Register a new driver
     */
    static registerDriver(data: DriverRegistrationData): Promise<RegistrationResult>;
    /**
     * Register a new vendor
     */
    static registerVendor(data: VendorRegistrationData): Promise<RegistrationResult>;
    /**
     * Upload driver documents
     */
    private static uploadDriverDocuments;
    /**
     * Upload vendor documents
     */
    private static uploadVendorDocuments;
    /**
     * Save driver-specific information
     */
    private static saveDriverInfo;
    /**
     * Save vendor-specific information
     */
    private static saveVendorInfo;
}

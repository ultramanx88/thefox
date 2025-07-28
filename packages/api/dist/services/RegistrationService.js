"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationService = void 0;
const auth_1 = require("../firebase/auth");
const functions_1 = require("../firebase/functions");
const storage_1 = require("../firebase/storage");
class RegistrationService {
    /**
     * Register a new customer
     */
    static async registerCustomer(data) {
        try {
            // Validate terms acceptance
            if (!data.acceptTerms) {
                throw new Error('Terms and conditions must be accepted');
            }
            // Create user with Firebase Auth
            const userCredential = await auth_1.FirebaseAuthService.signUp(data.email, data.password, `${data.firstName} ${data.lastName}`);
            // Create user profile
            const profile = await auth_1.FirebaseAuthService.createUserProfile(userCredential.user.uid, data.email, 'customer', {
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                dateOfBirth: data.dateOfBirth,
            });
            // Send email verification
            await functions_1.FirebaseFunctionsService.sendEmailVerification(userCredential.user.uid);
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
        }
        catch (error) {
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
    static async registerDriver(data) {
        try {
            // Validate terms acceptance
            if (!data.acceptTerms) {
                throw new Error('Terms and conditions must be accepted');
            }
            // Create user with Firebase Auth
            const userCredential = await auth_1.FirebaseAuthService.signUp(data.email, data.password, `${data.firstName} ${data.lastName}`);
            const userId = userCredential.user.uid;
            // Upload documents
            const documentUrls = await this.uploadDriverDocuments(userId, {
                idCard: data.idCardFile,
                driverLicense: data.driverLicenseFile,
                vehicleRegistration: data.vehicleRegistrationFile,
                profilePhoto: data.profilePhotoFile,
            });
            // Create user profile with driver-specific data
            const profile = await auth_1.FirebaseAuthService.createUserProfile(userId, data.email, 'driver', {
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                dateOfBirth: data.dateOfBirth,
            });
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
            await functions_1.FirebaseFunctionsService.sendEmailVerification(userId);
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
        }
        catch (error) {
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
    static async registerVendor(data) {
        try {
            // Validate terms acceptance
            if (!data.acceptTerms) {
                throw new Error('Terms and conditions must be accepted');
            }
            // Create user with Firebase Auth
            const userCredential = await auth_1.FirebaseAuthService.signUp(data.email, data.password, `${data.ownerFirstName} ${data.ownerLastName}`);
            const userId = userCredential.user.uid;
            // Upload documents
            const documentUrls = await this.uploadVendorDocuments(userId, {
                businessLicense: data.businessLicenseFile,
                idCard: data.idCardFile,
                bankBook: data.bankBookFile,
                storePhotos: data.storePhotoFiles,
            });
            // Create user profile with vendor-specific data
            const profile = await auth_1.FirebaseAuthService.createUserProfile(userId, data.email, 'vendor', {
                firstName: data.ownerFirstName,
                lastName: data.ownerLastName,
                phone: data.phone,
            });
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
            await functions_1.FirebaseFunctionsService.sendEmailVerification(userId);
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
        }
        catch (error) {
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
    static async uploadDriverDocuments(userId, files) {
        const uploads = await Promise.all([
            storage_1.FirebaseStorageService.uploadFile(`drivers/${userId}/documents/id-card.${files.idCard.name.split('.').pop()}`, files.idCard),
            storage_1.FirebaseStorageService.uploadFile(`drivers/${userId}/documents/driver-license.${files.driverLicense.name.split('.').pop()}`, files.driverLicense),
            storage_1.FirebaseStorageService.uploadFile(`drivers/${userId}/documents/vehicle-registration.${files.vehicleRegistration.name.split('.').pop()}`, files.vehicleRegistration),
            storage_1.FirebaseStorageService.uploadFile(`drivers/${userId}/profile/photo.${files.profilePhoto.name.split('.').pop()}`, files.profilePhoto),
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
    static async uploadVendorDocuments(userId, files) {
        const uploads = [];
        // Upload business license if provided
        if (files.businessLicense) {
            uploads.push(storage_1.FirebaseStorageService.uploadFile(`vendors/${userId}/documents/business-license.${files.businessLicense.name.split('.').pop()}`, files.businessLicense));
        }
        // Upload ID card
        uploads.push(storage_1.FirebaseStorageService.uploadFile(`vendors/${userId}/documents/id-card.${files.idCard.name.split('.').pop()}`, files.idCard));
        // Upload bank book
        uploads.push(storage_1.FirebaseStorageService.uploadFile(`vendors/${userId}/documents/bank-book.${files.bankBook.name.split('.').pop()}`, files.bankBook));
        // Upload store photos
        const storePhotoUploads = files.storePhotos.map((photo, index) => storage_1.FirebaseStorageService.uploadFile(`vendors/${userId}/store/photo-${index + 1}.${photo.name.split('.').pop()}`, photo));
        uploads.push(...storePhotoUploads);
        const results = await Promise.all(uploads);
        let resultIndex = 0;
        const documentUrls = {};
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
    static async saveDriverInfo(userId, driverData) {
        // This would typically save to a drivers collection
        // For now, we'll update the user profile with driver-specific data
        await auth_1.FirebaseAuthService.updateUserProfileData(userId, {
            driverInfo: driverData,
        });
    }
    /**
     * Save vendor-specific information
     */
    static async saveVendorInfo(userId, vendorData) {
        // This would typically save to a vendors collection
        // For now, we'll update the user profile with vendor-specific data
        await auth_1.FirebaseAuthService.updateUserProfileData(userId, {
            vendorInfo: vendorData,
        });
    }
}
exports.RegistrationService = RegistrationService;

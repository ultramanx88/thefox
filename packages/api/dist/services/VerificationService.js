"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationService = void 0;
const auth_1 = require("../firebase/auth");
const functions_1 = require("../firebase/functions");
const firestore_1 = require("firebase/firestore");
const config_1 = require("../firebase/config");
class VerificationService {
    /**
     * Send email verification
     */
    static async sendEmailVerification(userId) {
        try {
            const result = await functions_1.FirebaseFunctionsService.sendEmailVerification(userId);
            return {
                success: true,
                message: 'Verification email sent successfully',
                data: result,
            };
        }
        catch (error) {
            console.error('Send email verification error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to send verification email',
            };
        }
    }
    /**
     * Verify email with token
     */
    static async verifyEmail(token) {
        try {
            const result = await functions_1.FirebaseFunctionsService.verifyEmailToken(token);
            return {
                success: true,
                message: 'Email verified successfully',
                data: result,
            };
        }
        catch (error) {
            console.error('Email verification error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Email verification failed',
            };
        }
    }
    /**
     * Send SMS verification code
     */
    static async sendSMSVerification(userId, phoneNumber) {
        try {
            // Generate 6-digit verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            // Store verification code in user document (with expiry)
            const expiryTime = new Date();
            expiryTime.setMinutes(expiryTime.getMinutes() + 10); // 10 minutes expiry
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(config_1.db, 'users', userId), {
                'verification.smsCode': verificationCode,
                'verification.smsCodeExpiry': expiryTime,
                'verification.smsCodeSentAt': (0, firestore_1.serverTimestamp)(),
                updatedAt: (0, firestore_1.serverTimestamp)(),
            });
            // In a real implementation, you would send SMS via a service like Twilio
            // For now, we'll just log the code (in production, remove this)
            console.log(`SMS Verification Code for ${phoneNumber}: ${verificationCode}`);
            // Simulate SMS sending
            await this.simulateSMSSending(phoneNumber, verificationCode);
            return {
                success: true,
                message: 'SMS verification code sent successfully',
                data: {
                    phoneNumber,
                    expiryTime,
                },
            };
        }
        catch (error) {
            console.error('Send SMS verification error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to send SMS verification',
            };
        }
    }
    /**
     * Verify SMS code
     */
    static async verifySMS(userId, code) {
        try {
            // Get user profile to check stored code
            const userProfile = await auth_1.FirebaseAuthService.getUserProfile(userId);
            if (!userProfile) {
                throw new Error('User not found');
            }
            const storedCode = userProfile.verification?.smsCode;
            const codeExpiry = userProfile.verification?.smsCodeExpiry;
            if (!storedCode) {
                throw new Error('No verification code found. Please request a new code.');
            }
            // Check if code has expired
            if (codeExpiry && new Date() > new Date(codeExpiry)) {
                throw new Error('Verification code has expired. Please request a new code.');
            }
            // Verify code
            if (storedCode !== code) {
                throw new Error('Invalid verification code');
            }
            // Update verification status
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(config_1.db, 'users', userId), {
                'verification.phone': true,
                'verification.phoneVerifiedAt': (0, firestore_1.serverTimestamp)(),
                'verification.smsCode': null, // Clear the code
                'verification.smsCodeExpiry': null,
                updatedAt: (0, firestore_1.serverTimestamp)(),
            });
            return {
                success: true,
                message: 'Phone number verified successfully',
            };
        }
        catch (error) {
            console.error('SMS verification error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'SMS verification failed',
            };
        }
    }
    /**
     * Resend verification code
     */
    static async resendVerificationCode(userId, type) {
        try {
            const userProfile = await auth_1.FirebaseAuthService.getUserProfile(userId);
            if (!userProfile) {
                throw new Error('User not found');
            }
            if (type === 'email') {
                return await this.sendEmailVerification(userId);
            }
            else if (type === 'sms') {
                return await this.sendSMSVerification(userId, userProfile.profile.phone);
            }
            else {
                throw new Error('Invalid verification type');
            }
        }
        catch (error) {
            console.error('Resend verification error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to resend verification',
            };
        }
    }
    /**
     * Check verification status
     */
    static async getVerificationStatus(userId) {
        try {
            const userProfile = await auth_1.FirebaseAuthService.getUserProfile(userId);
            if (!userProfile) {
                throw new Error('User not found');
            }
            return {
                success: true,
                message: 'Verification status retrieved',
                data: {
                    email: userProfile.verification.email,
                    phone: userProfile.verification.phone,
                    documents: userProfile.verification.documents,
                },
            };
        }
        catch (error) {
            console.error('Get verification status error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get verification status',
            };
        }
    }
    /**
     * Mark documents as verified (Admin only)
     */
    static async verifyDocuments(userId, verified, adminId) {
        try {
            // Verify admin permissions
            const isAdmin = await auth_1.FirebaseAuthService.hasRole(adminId, 'admin');
            if (!isAdmin) {
                throw new Error('Admin access required');
            }
            // Update document verification status
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(config_1.db, 'users', userId), {
                'verification.documents': verified,
                'verification.documentsVerifiedAt': verified ? (0, firestore_1.serverTimestamp)() : null,
                'verification.documentsVerifiedBy': verified ? adminId : null,
                updatedAt: (0, firestore_1.serverTimestamp)(),
            });
            return {
                success: true,
                message: `Documents ${verified ? 'verified' : 'rejected'} successfully`,
            };
        }
        catch (error) {
            console.error('Document verification error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Document verification failed',
            };
        }
    }
    /**
     * Get verification requirements for user role
     */
    static getVerificationRequirements(role) {
        switch (role) {
            case 'customer':
                return {
                    email: true,
                    phone: false,
                    documents: false,
                };
            case 'driver':
                return {
                    email: true,
                    phone: true,
                    documents: true,
                };
            case 'vendor':
                return {
                    email: true,
                    phone: false,
                    documents: true,
                };
            default:
                return {
                    email: true,
                    phone: false,
                    documents: false,
                };
        }
    }
    /**
     * Check if user meets verification requirements
     */
    static async isFullyVerified(userId) {
        try {
            const userProfile = await auth_1.FirebaseAuthService.getUserProfile(userId);
            if (!userProfile) {
                return false;
            }
            const requirements = this.getVerificationRequirements(userProfile.role);
            const verification = userProfile.verification;
            // Check each required verification
            if (requirements.email && !verification.email) {
                return false;
            }
            if (requirements.phone && !verification.phone) {
                return false;
            }
            if (requirements.documents && !verification.documents) {
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Check verification error:', error);
            return false;
        }
    }
    /**
     * Simulate SMS sending (replace with real SMS service in production)
     */
    static async simulateSMSSending(phoneNumber, code) {
        // In production, integrate with SMS service like Twilio, AWS SNS, etc.
        // For now, just simulate delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Log for development (remove in production)
        console.log(`[SMS Service] Sending to ${phoneNumber}: Your verification code is ${code}`);
    }
}
exports.VerificationService = VerificationService;

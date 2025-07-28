export interface VerificationResult {
    success: boolean;
    message: string;
    data?: any;
}
export declare class VerificationService {
    /**
     * Send email verification
     */
    static sendEmailVerification(userId: string): Promise<VerificationResult>;
    /**
     * Verify email with token
     */
    static verifyEmail(token: string): Promise<VerificationResult>;
    /**
     * Send SMS verification code
     */
    static sendSMSVerification(userId: string, phoneNumber: string): Promise<VerificationResult>;
    /**
     * Verify SMS code
     */
    static verifySMS(userId: string, code: string): Promise<VerificationResult>;
    /**
     * Resend verification code
     */
    static resendVerificationCode(userId: string, type: 'email' | 'sms'): Promise<VerificationResult>;
    /**
     * Check verification status
     */
    static getVerificationStatus(userId: string): Promise<VerificationResult>;
    /**
     * Mark documents as verified (Admin only)
     */
    static verifyDocuments(userId: string, verified: boolean, adminId: string): Promise<VerificationResult>;
    /**
     * Get verification requirements for user role
     */
    static getVerificationRequirements(role: string): {
        email: boolean;
        phone: boolean;
        documents: boolean;
    };
    /**
     * Check if user meets verification requirements
     */
    static isFullyVerified(userId: string): Promise<boolean>;
    /**
     * Simulate SMS sending (replace with real SMS service in production)
     */
    private static simulateSMSSending;
}

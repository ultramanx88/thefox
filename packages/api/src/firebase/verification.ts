import {
  sendEmailVerification,
  applyActionCode,
  checkActionCode,
  verifyBeforeUpdateEmail,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { FirebaseAuthService } from './auth';

// ===========================================
// VERIFICATION INTERFACES
// ===========================================

export interface VerificationToken {
  id: string;
  userId: string;
  type: 'email' | 'sms';
  token: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
  attempts: number;
}

export interface SMSVerificationData {
  phone: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  verified?: boolean;
}

// ===========================================
// VERIFICATION SERVICE CLASS
// ===========================================

export class VerificationService {
  
  // ===========================================
  // EMAIL VERIFICATION
  // ===========================================
  
  /**
   * Send email verification to current user
   */
  static async sendEmailVerification(): Promise<VerificationResult> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return {
          success: false,
          message: 'No user is currently signed in.',
        };
      }

      if (user.emailVerified) {
        return {
          success: false,
          message: 'Email is already verified.',
        };
      }

      await sendEmailVerification(user);

      return {
        success: true,
        message: 'Verification email sent successfully. Please check your inbox.',
      };
    } catch (error: any) {
      console.error('Send email verification error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Send email verification to specific user
   */
  static async sendEmailVerificationToUser(user: User): Promise<VerificationResult> {
    try {
      if (user.emailVerified) {
        return {
          success: false,
          message: 'Email is already verified.',
        };
      }

      await sendEmailVerification(user);

      return {
        success: true,
        message: 'Verification email sent successfully.',
      };
    } catch (error: any) {
      console.error('Send email verification error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Verify email with action code
   */
  static async verifyEmail(actionCode: string): Promise<VerificationResult> {
    try {
      // Check the action code first
      const info = await checkActionCode(auth, actionCode);
      
      // Apply the action code to verify email
      await applyActionCode(auth, actionCode);

      // Update user verification status in Firestore
      if (info.data.email) {
        const user = auth.currentUser;
        if (user) {
          await FirebaseAuthService.updateVerificationStatus(user.uid, 'email', true);
        }
      }

      return {
        success: true,
        message: 'Email verified successfully.',
        verified: true,
      };
    } catch (error: any) {
      console.error('Email verification error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        verified: false,
      };
    }
  }

  /**
   * Check if user's email is verified
   */
  static async isEmailVerified(userId: string): Promise<boolean> {
    try {
      const userProfile = await FirebaseAuthService.getUserProfile(userId);
      return userProfile?.verification.email || false;
    } catch (error) {
      console.error('Check email verification error:', error);
      return false;
    }
  }

  // ===========================================
  // SMS VERIFICATION
  // ===========================================
  
  /**
   * Send SMS verification code
   */
  static async sendSMSVerification(phone: string): Promise<VerificationResult> {
    try {
      // Generate 6-digit verification code
      const code = this.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store verification data in Firestore
      const verificationData: SMSVerificationData = {
        phone,
        code,
        expiresAt,
        attempts: 0,
        verified: false,
      };

      await setDoc(doc(db, 'smsVerifications', phone), {
        ...verificationData,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: serverTimestamp(),
      });

      // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
      // For now, we'll log the code (remove in production)
      console.log(`SMS Verification Code for ${phone}: ${code}`);

      return {
        success: true,
        message: 'Verification code sent to your phone number.',
      };
    } catch (error: any) {
      console.error('Send SMS verification error:', error);
      return {
        success: false,
        message: 'Failed to send verification code. Please try again.',
      };
    }
  }

  /**
   * Verify SMS code
   */
  static async verifySMS(phone: string, code: string): Promise<VerificationResult> {
    try {
      const verificationDoc = await getDoc(doc(db, 'smsVerifications', phone));
      
      if (!verificationDoc.exists()) {
        return {
          success: false,
          message: 'No verification code found for this phone number.',
          verified: false,
        };
      }

      const verificationData = verificationDoc.data() as SMSVerificationData & {
        expiresAt: Timestamp;
        createdAt: Timestamp;
      };

      // Check if code has expired
      if (verificationData.expiresAt.toDate() < new Date()) {
        await deleteDoc(doc(db, 'smsVerifications', phone));
        return {
          success: false,
          message: 'Verification code has expired. Please request a new one.',
          verified: false,
        };
      }

      // Check if too many attempts
      if (verificationData.attempts >= 3) {
        await deleteDoc(doc(db, 'smsVerifications', phone));
        return {
          success: false,
          message: 'Too many failed attempts. Please request a new verification code.',
          verified: false,
        };
      }

      // Check if code matches
      if (verificationData.code !== code) {
        // Increment attempts
        await updateDoc(doc(db, 'smsVerifications', phone), {
          attempts: verificationData.attempts + 1,
        });

        return {
          success: false,
          message: 'Invalid verification code. Please try again.',
          verified: false,
        };
      }

      // Mark as verified and clean up
      await updateDoc(doc(db, 'smsVerifications', phone), {
        verified: true,
      });

      // Update user verification status if user is signed in
      const user = auth.currentUser;
      if (user) {
        await FirebaseAuthService.updateVerificationStatus(user.uid, 'phone', true);
      }

      // Clean up verification document after successful verification
      setTimeout(async () => {
        await deleteDoc(doc(db, 'smsVerifications', phone));
      }, 5000);

      return {
        success: true,
        message: 'Phone number verified successfully.',
        verified: true,
      };
    } catch (error: any) {
      console.error('SMS verification error:', error);
      return {
        success: false,
        message: 'Verification failed. Please try again.',
        verified: false,
      };
    }
  }

  /**
   * Check if phone number is verified for user
   */
  static async isPhoneVerified(userId: string): Promise<boolean> {
    try {
      const userProfile = await FirebaseAuthService.getUserProfile(userId);
      return userProfile?.verification.phone || false;
    } catch (error) {
      console.error('Check phone verification error:', error);
      return false;
    }
  }

  // ===========================================
  // DOCUMENT VERIFICATION
  // ===========================================
  
  /**
   * Mark documents as verified (admin only)
   */
  static async verifyDocuments(userId: string, verifiedBy: string): Promise<VerificationResult> {
    try {
      await FirebaseAuthService.updateVerificationStatus(userId, 'documents', true);

      // Log verification action
      await setDoc(doc(db, 'verificationLogs', `${userId}_documents_${Date.now()}`), {
        userId,
        type: 'documents',
        verifiedBy,
        verifiedAt: serverTimestamp(),
        action: 'verified',
      });

      return {
        success: true,
        message: 'Documents verified successfully.',
        verified: true,
      };
    } catch (error: any) {
      console.error('Document verification error:', error);
      return {
        success: false,
        message: 'Failed to verify documents.',
        verified: false,
      };
    }
  }

  /**
   * Check if documents are verified for user
   */
  static async areDocumentsVerified(userId: string): Promise<boolean> {
    try {
      const userProfile = await FirebaseAuthService.getUserProfile(userId);
      return userProfile?.verification.documents || false;
    } catch (error) {
      console.error('Check document verification error:', error);
      return false;
    }
  }

  // ===========================================
  // VERIFICATION STATUS
  // ===========================================
  
  /**
   * Get complete verification status for user
   */
  static async getVerificationStatus(userId: string): Promise<{
    email: boolean;
    phone: boolean;
    documents: boolean;
    isComplete: boolean;
  }> {
    try {
      const userProfile = await FirebaseAuthService.getUserProfile(userId);
      
      if (!userProfile) {
        return {
          email: false,
          phone: false,
          documents: false,
          isComplete: false,
        };
      }

      const verification = userProfile.verification;
      const isComplete = verification.email && 
        (userProfile.role === 'customer' || verification.phone) &&
        (userProfile.role === 'customer' || verification.documents);

      return {
        email: verification.email,
        phone: verification.phone,
        documents: verification.documents,
        isComplete,
      };
    } catch (error) {
      console.error('Get verification status error:', error);
      return {
        email: false,
        phone: false,
        documents: false,
        isComplete: false,
      };
    }
  }

  /**
   * Resend verification based on type
   */
  static async resendVerification(
    type: 'email' | 'sms',
    data?: { phone?: string }
  ): Promise<VerificationResult> {
    try {
      if (type === 'email') {
        return await this.sendEmailVerification();
      } else if (type === 'sms' && data?.phone) {
        return await this.sendSMSVerification(data.phone);
      } else {
        return {
          success: false,
          message: 'Invalid verification type or missing data.',
        };
      }
    } catch (error: any) {
      console.error('Resend verification error:', error);
      return {
        success: false,
        message: 'Failed to resend verification. Please try again.',
      };
    }
  }

  // ===========================================
  // HELPER METHODS
  // ===========================================
  
  /**
   * Generate 6-digit verification code
   */
  private static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Get user-friendly error message
   */
  private static getErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/invalid-action-code':
        return 'The verification link is invalid or has expired. Please request a new one.';
      case 'auth/expired-action-code':
        return 'The verification link has expired. Please request a new one.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/too-many-requests':
        return 'Too many verification attempts. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }
}

// Export for convenience
export { VerificationService as default };
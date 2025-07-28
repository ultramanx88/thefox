import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// User role types
export type UserRole = 'customer' | 'driver' | 'vendor' | 'admin';

export type UserStatus = 'pending' | 'active' | 'suspended' | 'rejected';

// Extended user profile interface
export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    avatar?: string;
    dateOfBirth?: Date;
  };
  verification: {
    email: boolean;
    phone: boolean;
    documents: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  // Role-specific data
  driverInfo?: any;
  vendorInfo?: any;
}

// Auth user with profile
export interface AuthUser extends User {
  profile?: UserProfile;
}

export class FirebaseAuthService {
  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login time
      if (userCredential.user) {
        await this.updateLastLogin(userCredential.user.uid);
      }
      
      return userCredential;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Sign up with email and password
  static async signUp(email: string, password: string, displayName?: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      return userCredential;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  // Create user profile in Firestore
  static async createUserProfile(
    uid: string,
    email: string,
    role: UserRole,
    profileData: {
      firstName: string;
      lastName: string;
      phone: string;
      dateOfBirth?: Date;
    }
  ): Promise<UserProfile> {
    try {
      const userProfile: UserProfile = {
        uid,
        email,
        role,
        status: role === 'customer' ? 'active' : 'pending', // Customers are auto-approved
        profile: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          dateOfBirth: profileData.dateOfBirth,
        },
        verification: {
          email: false,
          phone: false,
          documents: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to Firestore
      await setDoc(doc(db, 'users', uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return userProfile;
    } catch (error) {
      console.error('Create user profile error:', error);
      throw error;
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Send password reset email
  static async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Send email verification
  static async sendEmailVerification(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
      } else {
        throw new Error('No user is currently signed in');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateUserProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, updates);
      } else {
        throw new Error('No user is currently signed in');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Get user token
  static async getUserToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  // Get user profile from Firestore
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate(),
          profile: {
            ...data.profile,
            dateOfBirth: data.profile?.dateOfBirth?.toDate(),
          },
        } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  // Update user profile
  static async updateUserProfileData(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  // Update user status (for admin approval)
  static async updateUserStatus(uid: string, status: UserStatus, reason?: string): Promise<void> {
    try {
      const updates: any = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (reason) {
        updates.statusReason = reason;
      }

      await updateDoc(doc(db, 'users', uid), updates);
    } catch (error) {
      console.error('Update user status error:', error);
      throw error;
    }
  }

  // Update verification status
  static async updateVerificationStatus(
    uid: string,
    verificationType: keyof UserProfile['verification'],
    verified: boolean
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        [`verification.${verificationType}`]: verified,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Update verification status error:', error);
      throw error;
    }
  }

  // Update last login time
  static async updateLastLogin(uid: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        lastLoginAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Update last login error:', error);
      // Don't throw error for login time update failure
    }
  }

  // Check if user has role
  static async hasRole(uid: string, role: UserRole): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(uid);
      return profile?.role === role;
    } catch (error) {
      console.error('Check role error:', error);
      return false;
    }
  }

  // Check if user is active
  static async isUserActive(uid: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(uid);
      return profile?.status === 'active';
    } catch (error) {
      console.error('Check user active error:', error);
      return false;
    }
  }

  // Get enhanced auth user with profile
  static async getAuthUserWithProfile(user: User): Promise<AuthUser> {
    try {
      const profile = await this.getUserProfile(user.uid);
      return {
        ...user,
        profile,
      } as AuthUser;
    } catch (error) {
      console.error('Get auth user with profile error:', error);
      return user as AuthUser;
    }
  }
}
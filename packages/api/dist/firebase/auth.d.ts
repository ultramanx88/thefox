import { User, UserCredential } from 'firebase/auth';
export type UserRole = 'customer' | 'driver' | 'vendor' | 'admin';
export type UserStatus = 'pending' | 'active' | 'suspended' | 'rejected';
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
}
export interface AuthUser extends User {
    profile?: UserProfile;
}
export declare class FirebaseAuthService {
    static signIn(email: string, password: string): Promise<UserCredential>;
    static signUp(email: string, password: string, displayName?: string): Promise<UserCredential>;
    static createUserProfile(uid: string, email: string, role: UserRole, profileData: {
        firstName: string;
        lastName: string;
        phone: string;
        dateOfBirth?: Date;
    }): Promise<UserProfile>;
    static signOut(): Promise<void>;
    static getCurrentUser(): User | null;
    static onAuthStateChanged(callback: (user: User | null) => void): import("@firebase/util").Unsubscribe;
    static sendPasswordResetEmail(email: string): Promise<void>;
    static sendEmailVerification(): Promise<void>;
    static updateUserProfile(updates: {
        displayName?: string;
        photoURL?: string;
    }): Promise<void>;
    static getUserToken(): Promise<string | null>;
    static getUserProfile(uid: string): Promise<UserProfile | null>;
    static updateUserProfileData(uid: string, updates: Partial<UserProfile>): Promise<void>;
    static updateUserStatus(uid: string, status: UserStatus, reason?: string): Promise<void>;
    static updateVerificationStatus(uid: string, verificationType: keyof UserProfile['verification'], verified: boolean): Promise<void>;
    static updateLastLogin(uid: string): Promise<void>;
    static hasRole(uid: string, role: UserRole): Promise<boolean>;
    static isUserActive(uid: string): Promise<boolean>;
    static getAuthUserWithProfile(user: User): Promise<AuthUser>;
}

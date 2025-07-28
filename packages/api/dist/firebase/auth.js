"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseAuthService = void 0;
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const config_1 = require("./config");
class FirebaseAuthService {
    // Sign in with email and password
    static async signIn(email, password) {
        try {
            const userCredential = await (0, auth_1.signInWithEmailAndPassword)(config_1.auth, email, password);
            // Update last login time
            if (userCredential.user) {
                await this.updateLastLogin(userCredential.user.uid);
            }
            return userCredential;
        }
        catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    }
    // Sign up with email and password
    static async signUp(email, password, displayName) {
        try {
            const userCredential = await (0, auth_1.createUserWithEmailAndPassword)(config_1.auth, email, password);
            // Update profile with display name
            if (displayName && userCredential.user) {
                await (0, auth_1.updateProfile)(userCredential.user, { displayName });
            }
            return userCredential;
        }
        catch (error) {
            console.error('Sign up error:', error);
            throw error;
        }
    }
    // Create user profile in Firestore
    static async createUserProfile(uid, email, role, profileData) {
        try {
            const userProfile = {
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
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(config_1.db, 'users', uid), {
                ...userProfile,
                createdAt: (0, firestore_1.serverTimestamp)(),
                updatedAt: (0, firestore_1.serverTimestamp)(),
            });
            return userProfile;
        }
        catch (error) {
            console.error('Create user profile error:', error);
            throw error;
        }
    }
    // Sign out
    static async signOut() {
        try {
            await (0, auth_1.signOut)(config_1.auth);
        }
        catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }
    // Get current user
    static getCurrentUser() {
        return config_1.auth.currentUser;
    }
    // Listen to auth state changes
    static onAuthStateChanged(callback) {
        return (0, auth_1.onAuthStateChanged)(config_1.auth, callback);
    }
    // Send password reset email
    static async sendPasswordResetEmail(email) {
        try {
            await (0, auth_1.sendPasswordResetEmail)(config_1.auth, email);
        }
        catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    }
    // Send email verification
    static async sendEmailVerification() {
        try {
            const user = config_1.auth.currentUser;
            if (user) {
                await (0, auth_1.sendEmailVerification)(user);
            }
            else {
                throw new Error('No user is currently signed in');
            }
        }
        catch (error) {
            console.error('Email verification error:', error);
            throw error;
        }
    }
    // Update user profile
    static async updateUserProfile(updates) {
        try {
            const user = config_1.auth.currentUser;
            if (user) {
                await (0, auth_1.updateProfile)(user, updates);
            }
            else {
                throw new Error('No user is currently signed in');
            }
        }
        catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }
    // Get user token
    static async getUserToken() {
        try {
            const user = config_1.auth.currentUser;
            if (user) {
                return await user.getIdToken();
            }
            return null;
        }
        catch (error) {
            console.error('Get token error:', error);
            return null;
        }
    }
    // Get user profile from Firestore
    static async getUserProfile(uid) {
        try {
            const userDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(config_1.db, 'users', uid));
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
                };
            }
            return null;
        }
        catch (error) {
            console.error('Get user profile error:', error);
            return null;
        }
    }
    // Update user profile
    static async updateUserProfileData(uid, updates) {
        try {
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(config_1.db, 'users', uid), {
                ...updates,
                updatedAt: (0, firestore_1.serverTimestamp)(),
            });
        }
        catch (error) {
            console.error('Update user profile error:', error);
            throw error;
        }
    }
    // Update user status (for admin approval)
    static async updateUserStatus(uid, status, reason) {
        try {
            const updates = {
                status,
                updatedAt: (0, firestore_1.serverTimestamp)(),
            };
            if (reason) {
                updates.statusReason = reason;
            }
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(config_1.db, 'users', uid), updates);
        }
        catch (error) {
            console.error('Update user status error:', error);
            throw error;
        }
    }
    // Update verification status
    static async updateVerificationStatus(uid, verificationType, verified) {
        try {
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(config_1.db, 'users', uid), {
                [`verification.${verificationType}`]: verified,
                updatedAt: (0, firestore_1.serverTimestamp)(),
            });
        }
        catch (error) {
            console.error('Update verification status error:', error);
            throw error;
        }
    }
    // Update last login time
    static async updateLastLogin(uid) {
        try {
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(config_1.db, 'users', uid), {
                lastLoginAt: (0, firestore_1.serverTimestamp)(),
            });
        }
        catch (error) {
            console.error('Update last login error:', error);
            // Don't throw error for login time update failure
        }
    }
    // Check if user has role
    static async hasRole(uid, role) {
        try {
            const profile = await this.getUserProfile(uid);
            return profile?.role === role;
        }
        catch (error) {
            console.error('Check role error:', error);
            return false;
        }
    }
    // Check if user is active
    static async isUserActive(uid) {
        try {
            const profile = await this.getUserProfile(uid);
            return profile?.status === 'active';
        }
        catch (error) {
            console.error('Check user active error:', error);
            return false;
        }
    }
    // Get enhanced auth user with profile
    static async getAuthUserWithProfile(user) {
        try {
            const profile = await this.getUserProfile(user.uid);
            return {
                ...user,
                profile,
            };
        }
        catch (error) {
            console.error('Get auth user with profile error:', error);
            return user;
        }
    }
}
exports.FirebaseAuthService = FirebaseAuthService;

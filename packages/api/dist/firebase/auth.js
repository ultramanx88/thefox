import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail, sendEmailVerification, } from 'firebase/auth';
import { auth } from './config';
export class FirebaseAuthService {
    // Sign in with email and password
    static async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Update profile with display name
            if (displayName && userCredential.user) {
                await updateProfile(userCredential.user, { displayName });
            }
            return userCredential;
        }
        catch (error) {
            console.error('Sign up error:', error);
            throw error;
        }
    }
    // Sign out
    static async signOut() {
        try {
            await signOut(auth);
        }
        catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }
    // Get current user
    static getCurrentUser() {
        return auth.currentUser;
    }
    // Listen to auth state changes
    static onAuthStateChanged(callback) {
        return onAuthStateChanged(auth, callback);
    }
    // Send password reset email
    static async sendPasswordResetEmail(email) {
        try {
            await sendPasswordResetEmail(auth, email);
        }
        catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    }
    // Send email verification
    static async sendEmailVerification() {
        try {
            const user = auth.currentUser;
            if (user) {
                await sendEmailVerification(user);
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
            const user = auth.currentUser;
            if (user) {
                await updateProfile(user, updates);
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
            const user = auth.currentUser;
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
}

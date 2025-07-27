import { User, UserCredential } from 'firebase/auth';
export declare class FirebaseAuthService {
    static signIn(email: string, password: string): Promise<UserCredential>;
    static signUp(email: string, password: string, displayName?: string): Promise<UserCredential>;
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
}

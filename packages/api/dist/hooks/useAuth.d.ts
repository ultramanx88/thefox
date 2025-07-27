import { User as FirebaseUser } from 'firebase/auth';
export interface AuthState {
    user: FirebaseUser | null;
    loading: boolean;
    error: string | null;
}
export declare function useAuth(): {
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName?: string) => Promise<void>;
    signOut: () => Promise<void>;
    sendPasswordResetEmail: (email: string) => Promise<void>;
    user: FirebaseUser | null;
    loading: boolean;
    error: string | null;
};

import { useState, useEffect } from 'react';
import { FirebaseAuthService } from '../firebase/auth';
export function useAuth() {
    const [authState, setAuthState] = useState({
        user: null,
        loading: true,
        error: null,
    });
    useEffect(() => {
        const unsubscribe = FirebaseAuthService.onAuthStateChanged((user) => {
            setAuthState({
                user,
                loading: false,
                error: null,
            });
        });
        return unsubscribe;
    }, []);
    const signIn = async (email, password) => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));
            await FirebaseAuthService.signIn(email, password);
        }
        catch (error) {
            setAuthState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Sign in failed'
            }));
            throw error;
        }
    };
    const signUp = async (email, password, displayName) => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));
            await FirebaseAuthService.signUp(email, password, displayName);
        }
        catch (error) {
            setAuthState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Sign up failed'
            }));
            throw error;
        }
    };
    const signOut = async () => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));
            await FirebaseAuthService.signOut();
        }
        catch (error) {
            setAuthState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Sign out failed'
            }));
            throw error;
        }
    };
    const sendPasswordResetEmail = async (email) => {
        try {
            await FirebaseAuthService.sendPasswordResetEmail(email);
        }
        catch (error) {
            setAuthState(prev => ({
                ...prev,
                error: error.message || 'Password reset failed'
            }));
            throw error;
        }
    };
    return {
        ...authState,
        signIn,
        signUp,
        signOut,
        sendPasswordResetEmail,
    };
}

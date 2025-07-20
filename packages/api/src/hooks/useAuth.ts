import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { FirebaseAuthService } from '../firebase/auth';

export interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = FirebaseAuthService.onAuthStateChanged((user: FirebaseUser | null) => {
      setAuthState({
        user,
        loading: false,
        error: null,
      });
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await FirebaseAuthService.signIn(email, password);
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Sign in failed' 
      }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await FirebaseAuthService.signUp(email, password, displayName);
    } catch (error: any) {
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
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Sign out failed' 
      }));
      throw error;
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      await FirebaseAuthService.sendPasswordResetEmail(email);
    } catch (error: any) {
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
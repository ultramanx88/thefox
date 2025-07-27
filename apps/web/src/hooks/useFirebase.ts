import { useEffect, useState } from 'react';
import { initializeFirebase, FirebaseInitResult, isFirebaseReady } from '@/packages/api/src/firebase/init';

export interface UseFirebaseResult extends FirebaseInitResult {
  isLoading: boolean;
  isReady: boolean;
  retry: () => Promise<void>;
}

/**
 * Hook for Firebase initialization and status monitoring
 */
export function useFirebase(): UseFirebaseResult {
  const [initResult, setInitResult] = useState<FirebaseInitResult>({
    success: false,
    environment: 'development',
    services: {
      auth: false,
      firestore: false,
      storage: false,
      functions: false,
      analytics: false,
      messaging: false,
    },
    errors: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const initFirebase = async () => {
    setIsLoading(true);
    try {
      const result = await initializeFirebase();
      setInitResult(result);
      setIsReady(result.success && isFirebaseReady());
    } catch (error) {
      console.error('Firebase initialization error:', error);
      setInitResult(prev => ({
        ...prev,
        success: false,
        errors: [...prev.errors, `Initialization failed: ${error}`],
      }));
      setIsReady(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initFirebase();
  }, []);

  const retry = async () => {
    await initFirebase();
  };

  return {
    ...initResult,
    isLoading,
    isReady,
    retry,
  };
}

/**
 * Hook for checking specific Firebase service status
 */
export function useFirebaseService(serviceName: keyof FirebaseInitResult['services']) {
  const firebase = useFirebase();
  
  return {
    isAvailable: firebase.services[serviceName],
    isLoading: firebase.isLoading,
    error: firebase.errors.find(error => error.toLowerCase().includes(serviceName)),
  };
}
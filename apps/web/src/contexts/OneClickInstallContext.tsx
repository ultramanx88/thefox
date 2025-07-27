'use client';

/**
 * OneClickInstallProvider - Context for managing PWA installation state
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { 
  OneClickInstallState, 
  OneClickInstallActions, 
  InstallationEvent,
  DeviceCapabilities,
  InstallationPreferences
} from '@/types/pwa-install';
import { InstallationError } from '@/types/pwa-install';
import { 
  detectDeviceType, 
  detectDeviceCapabilities, 
  generateDeviceFingerprint,
  isAppInstalled,
  shouldShowInstallPrompt
} from '@/utils/device-detection';
import { 
  pwaStorage, 
  pwaSessionStorage, 
  pwaAnalyticsStorage,
  generateSessionId
} from '@/utils/pwa-storage';
import { permissionManager } from '@/utils/permission-manager';

// Initial state
const initialState: OneClickInstallState = {
  installationState: 'idle',
  permissionState: 'unknown',
  deviceType: 'unsupported',
  canInstall: false,
  deferredPrompt: null,
  isStandalone: false,
  error: undefined
};

// Action types
type InstallAction = 
  | { type: 'SET_DEVICE_TYPE'; payload: typeof initialState.deviceType }
  | { type: 'SET_PERMISSION_STATE'; payload: typeof initialState.permissionState }
  | { type: 'SET_INSTALLATION_STATE'; payload: typeof initialState.installationState }
  | { type: 'SET_CAN_INSTALL'; payload: boolean }
  | { type: 'SET_DEFERRED_PROMPT'; payload: BeforeInstallPromptEvent | null }
  | { type: 'SET_ERROR'; payload: string | undefined }
  | { type: 'SET_STANDALONE'; payload: boolean }
  | { type: 'RESET_STATE' };

// Reducer
function installReducer(state: OneClickInstallState, action: InstallAction): OneClickInstallState {
  switch (action.type) {
    case 'SET_DEVICE_TYPE':
      return { ...state, deviceType: action.payload };
    case 'SET_PERMISSION_STATE':
      return { ...state, permissionState: action.payload };
    case 'SET_INSTALLATION_STATE':
      return { ...state, installationState: action.payload };
    case 'SET_CAN_INSTALL':
      return { ...state, canInstall: action.payload };
    case 'SET_DEFERRED_PROMPT':
      return { ...state, deferredPrompt: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_STANDALONE':
      return { ...state, isStandalone: action.payload };
    case 'RESET_STATE':
      return { ...initialState };
    default:
      return state;
  }
}

// Context
const OneClickInstallContext = createContext<
  (OneClickInstallState & OneClickInstallActions) | null
>(null);

// Provider props
interface OneClickInstallProviderProps {
  children: React.ReactNode;
}

// Session ID for analytics
let sessionId: string;

export function OneClickInstallProvider({ children }: OneClickInstallProviderProps) {
  const [state, dispatch] = useReducer(installReducer, initialState);

  // Initialize session ID
  useEffect(() => {
    sessionId = generateSessionId();
  }, []);

  // Track analytics events
  const trackInstallEvent = useCallback((eventType: string, metadata?: any) => {
    const event: InstallationEvent = {
      eventType: eventType as any,
      timestamp: new Date().toISOString(),
      deviceType: state.deviceType,
      userAgent: navigator.userAgent,
      sessionId,
      metadata
    };

    pwaAnalyticsStorage.queueEvent(event);
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('PWA Install Event:', event);
    }
  }, [state.deviceType]);

  // Initialize device detection and capabilities
  useEffect(() => {
    const initializeDevice = async () => {
      try {
        // Detect device type
        const deviceType = detectDeviceType();
        dispatch({ type: 'SET_DEVICE_TYPE', payload: deviceType });

        // Check if app is already installed
        const isStandalone = isAppInstalled();
        dispatch({ type: 'SET_STANDALONE', payload: isStandalone });

        // Get or detect device capabilities
        let capabilities = pwaStorage.getDeviceCapabilities();
        if (!capabilities) {
          capabilities = detectDeviceCapabilities();
          pwaStorage.setDeviceCapabilities(capabilities);
        }

        // Load installation preferences
        const preferences = pwaStorage.getInstallationPreferences();
        
        // Update device fingerprint if not set
        if (!preferences.deviceFingerprint) {
          const fingerprint = generateDeviceFingerprint();
          pwaStorage.updatePreferences({ deviceFingerprint: fingerprint });
        }

        // Set permission state based on preferences
        if (preferences.permissionGranted) {
          dispatch({ type: 'SET_PERMISSION_STATE', payload: 'granted' });
        }

        // Determine if we can show install prompt
        const canShowPrompt = !isStandalone && 
                             capabilities.installMethod !== 'unsupported' &&
                             shouldShowInstallPrompt(preferences.dismissCount, preferences.lastPromptDate);

        dispatch({ type: 'SET_CAN_INSTALL', payload: canShowPrompt });

        // Track initialization
        trackInstallEvent('provider_initialized', {
          deviceType,
          isStandalone,
          canInstall: canShowPrompt,
          installMethod: capabilities.installMethod
        });

      } catch (error) {
        console.error('Failed to initialize PWA install provider:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize installation system' });
      }
    };

    initializeDevice();
  }, [trackInstallEvent]);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Save the event for later use
      dispatch({ type: 'SET_DEFERRED_PROMPT', payload: e });
      dispatch({ type: 'SET_CAN_INSTALL', payload: true });
      
      trackInstallEvent('prompt_available');
    };

    const handleAppInstalled = () => {
      dispatch({ type: 'SET_STANDALONE', payload: true });
      dispatch({ type: 'SET_CAN_INSTALL', payload: false });
      dispatch({ type: 'SET_INSTALLATION_STATE', payload: 'success' });
      
      trackInstallEvent('install_success');
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [trackInstallEvent]);

  // Request installation
  const requestInstallation = useCallback(async () => {
    try {
      dispatch({ type: 'SET_INSTALLATION_STATE', payload: 'installing' });
      dispatch({ type: 'SET_ERROR', payload: undefined });

      // Check rate limiting
      if (permissionManager.isRateLimited()) {
        dispatch({ type: 'SET_INSTALLATION_STATE', payload: 'error' });
        dispatch({ type: 'SET_ERROR', payload: 'Too many installation attempts. Please try again later.' });
        trackInstallEvent('install_rate_limited');
        return;
      }

      // Check if permission is already granted
      if (permissionManager.hasPermission() && state.deferredPrompt) {
        // Direct installation
        trackInstallEvent('install_button_clicked', { hasPermission: true });
        
        const result = await state.deferredPrompt.prompt();
        
        if (result.outcome === 'accepted') {
          dispatch({ type: 'SET_INSTALLATION_STATE', payload: 'success' });
          trackInstallEvent('install_success');
        } else {
          dispatch({ type: 'SET_INSTALLATION_STATE', payload: 'idle' });
          trackInstallEvent('install_cancelled');
        }
      } else {
        // Check if we should show permission dialog
        if (permissionManager.shouldShowPermissionDialog()) {
          dispatch({ type: 'SET_INSTALLATION_STATE', payload: 'requesting-permission' });
          trackInstallEvent('permission_requested');
        } else {
          dispatch({ type: 'SET_INSTALLATION_STATE', payload: 'error' });
          dispatch({ type: 'SET_ERROR', payload: 'Installation not available at this time.' });
          trackInstallEvent('install_blocked');
        }
      }

    } catch (error) {
      console.error('Installation failed:', error);
      dispatch({ type: 'SET_INSTALLATION_STATE', payload: 'error' });
      dispatch({ type: 'SET_ERROR', payload: 'Installation failed. Please try again.' });
      
      trackInstallEvent('install_failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }, [state.deferredPrompt, trackInstallEvent]);

  // Reset permissions
  const resetPermissions = useCallback(() => {
    permissionManager.resetPermissions();
    dispatch({ type: 'SET_PERMISSION_STATE', payload: 'unknown' });
    dispatch({ type: 'SET_INSTALLATION_STATE', payload: 'idle' });
    
    trackInstallEvent('permissions_reset');
  }, [trackInstallEvent]);

  // Dismiss install prompt
  const dismissInstallPrompt = useCallback(() => {
    permissionManager.dismissPermission();
    dispatch({ type: 'SET_CAN_INSTALL', payload: false });
    dispatch({ type: 'SET_INSTALLATION_STATE', payload: 'idle' });
    
    const stats = permissionManager.getPermissionStats();
    trackInstallEvent('install_dismissed', { dismissCount: stats.dismissCount });
  }, [trackInstallEvent]);

  // Grant permission
  const grantPermission = useCallback((rememberChoice: boolean = true) => {
    permissionManager.grantPermission(rememberChoice);
    dispatch({ type: 'SET_PERMISSION_STATE', payload: 'granted' });
    
    trackInstallEvent('permission_granted', { rememberChoice });
    
    // Proceed with installation if deferred prompt is available
    if (state.deferredPrompt) {
      requestInstallation();
    }
  }, [state.deferredPrompt, trackInstallEvent, requestInstallation]);

  // Deny permission
  const denyPermission = useCallback((rememberChoice: boolean = true) => {
    permissionManager.denyPermission(rememberChoice);
    dispatch({ type: 'SET_PERMISSION_STATE', payload: 'denied' });
    dispatch({ type: 'SET_INSTALLATION_STATE', payload: 'idle' });
    
    trackInstallEvent('permission_denied', { rememberChoice });
  }, [trackInstallEvent]);

  // Check installability
  const checkInstallability = useCallback(() => {
    const isStandalone = isAppInstalled();
    const preferences = pwaStorage.getInstallationPreferences();
    const canShow = shouldShowInstallPrompt(preferences.dismissCount, preferences.lastPromptDate);
    
    dispatch({ type: 'SET_STANDALONE', payload: isStandalone });
    dispatch({ type: 'SET_CAN_INSTALL', payload: !isStandalone && canShow });
  }, []);

  // Context value
  const contextValue = {
    ...state,
    requestInstallation,
    resetPermissions,
    dismissInstallPrompt,
    grantPermission,
    denyPermission,
    trackInstallEvent,
    checkInstallability
  };

  return (
    <OneClickInstallContext.Provider value={contextValue}>
      {children}
    </OneClickInstallContext.Provider>
  );
}

// Hook to use the context
export function useOneClickInstall() {
  const context = useContext(OneClickInstallContext);
  
  if (!context) {
    throw new Error('useOneClickInstall must be used within OneClickInstallProvider');
  }
  
  return context;
}

// Export context for testing
export { OneClickInstallContext };
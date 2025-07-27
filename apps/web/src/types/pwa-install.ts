/**
 * TypeScript interfaces for One-Click PWA Installation system
 */

// Installation state management
export type InstallationState = 'idle' | 'requesting-permission' | 'installing' | 'success' | 'error';
export type PermissionState = 'unknown' | 'granted' | 'denied' | 'dismissed';
export type DeviceType = 'android' | 'ios' | 'desktop' | 'unsupported';
export type InstallMethod = 'native' | 'manual' | 'unsupported';

// Core installation state interface
export interface OneClickInstallState {
  installationState: InstallationState;
  permissionState: PermissionState;
  deviceType: DeviceType;
  canInstall: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  error?: string;
  isStandalone: boolean;
}

// Installation actions interface
export interface OneClickInstallActions {
  requestInstallation: () => Promise<void>;
  resetPermissions: () => void;
  dismissInstallPrompt: () => void;
  grantPermission: (rememberChoice?: boolean) => void;
  denyPermission: (rememberChoice?: boolean) => void;
  trackInstallEvent: (event: string, data?: any) => void;
  checkInstallability: () => void;
}

// Installation preferences stored in localStorage
export interface InstallationPreferences {
  permissionGranted: boolean;
  lastPromptDate: string;
  dismissCount: number;
  autoInstallEnabled: boolean;
  deviceFingerprint: string;
  userId?: string;
  version: string; // For migration purposes
}

// Analytics event tracking
export interface InstallationEvent {
  eventType: 'prompt_shown' | 'button_clicked' | 'permission_granted' | 'permission_denied' | 
            'install_success' | 'install_failed' | 'install_dismissed';
  timestamp: string;
  deviceType: string;
  userAgent: string;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

// Device capabilities detection
export interface DeviceCapabilities {
  supportsBeforeInstallPrompt: boolean;
  supportsServiceWorker: boolean;
  supportsWebShare: boolean;
  isStandalone: boolean;
  platform: string;
  installMethod: InstallMethod;
  browserName: string;
  browserVersion: string;
}

// Installation error types
export enum InstallationError {
  PERMISSION_DENIED = 'permission_denied',
  BROWSER_NOT_SUPPORTED = 'browser_not_supported',
  ALREADY_INSTALLED = 'already_installed',
  NETWORK_ERROR = 'network_error',
  USER_CANCELLED = 'user_cancelled',
  UNKNOWN_ERROR = 'unknown_error'
}

// Component props interfaces
export interface InstallButtonProps {
  variant?: 'primary' | 'secondary' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  autoHide?: boolean;
  position?: 'fixed' | 'relative';
  className?: string;
  children?: React.ReactNode;
}

export interface PermissionDialogProps {
  isOpen: boolean;
  onGrant: () => void;
  onDeny: () => void;
  onDismiss: () => void;
  deviceType: DeviceType;
}

export interface InstallationProgressProps {
  isVisible: boolean;
  progress: number;
  message: string;
  onCancel?: () => void;
}

export interface InstallationSuccessProps {
  isVisible: boolean;
  onClose: () => void;
  deviceType: DeviceType;
}

// Storage keys constants
export const STORAGE_KEYS = {
  INSTALLATION_PREFERENCES: 'pwa_install_preferences',
  SESSION_STATE: 'pwa_install_session',
  ANALYTICS_QUEUE: 'pwa_install_analytics',
  DEVICE_CAPABILITIES: 'pwa_device_capabilities'
} as const;

// Default values
export const DEFAULT_PREFERENCES: InstallationPreferences = {
  permissionGranted: false,
  lastPromptDate: '',
  dismissCount: 0,
  autoInstallEnabled: true,
  deviceFingerprint: '',
  version: '1.0.0'
};

// Configuration constants
export const INSTALL_CONFIG = {
  MAX_DISMISS_COUNT: 3,
  DISMISS_COOLDOWN_DAYS: 7,
  ANALYTICS_BATCH_SIZE: 10,
  INSTALLATION_TIMEOUT: 30000, // 30 seconds
  PERMISSION_DIALOG_TIMEOUT: 60000, // 1 minute
} as const;
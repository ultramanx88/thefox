// Development configuration for Socket.IO
export const SOCKET_CONFIG = {
  // Use IP address for iOS Simulator
  url: 'http://192.168.0.2:3000',
  
  // iOS specific options
  options: {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    maxReconnectionAttempts: 5,
    withCredentials: false,
    // Enable debugging in development
    debug: __DEV__,
  }
};

// Environment-based configuration
export const getSocketConfig = () => {
  if (__DEV__) {
    return {
      url: 'http://192.168.0.2:3000',
      options: SOCKET_CONFIG.options
    };
  }
  
  // Production configuration
  return {
    url: 'https://your-production-domain.com',
    options: {
      ...SOCKET_CONFIG.options,
      debug: false,
    }
  };
};

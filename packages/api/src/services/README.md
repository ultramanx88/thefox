# Settings Manager

The `SettingsManager` provides a high-level interface for managing user settings with caching, validation, retry logic, and real-time synchronization.

## Features

- **CRUD Operations**: Create, read, update, and delete user settings
- **Caching**: Intelligent caching to reduce database calls
- **Validation**: Comprehensive validation using Zod schemas
- **Retry Logic**: Automatic retry with exponential backoff for transient errors
- **Real-time Sync**: Real-time listeners for settings changes
- **Batch Operations**: Efficient batch updates for multiple users
- **Error Handling**: Robust error handling with detailed error types
- **Mobile Appearance**: Special handling for mobile app appearance settings

## Basic Usage

```typescript
import { SettingsManager } from '@repo/api';

// Get the singleton instance
const settingsManager = SettingsManager.getInstance();

// Get user settings (creates defaults if none exist)
const settings = await settingsManager.getUserSettings('user123', 'shopper');

// Update settings
await settingsManager.updateUserSettings('user123', {
  profile: {
    displayName: 'John Doe',
    theme: 'dark'
  },
  notifications: {
    push: {
      enabled: true,
      orders: true
    }
  }
});

// Update a specific field
await settingsManager.updateSettingField('user123', 'profile.theme', 'light');

// Check if settings exist
const exists = await settingsManager.userSettingsExist('user123');

// Delete settings
await settingsManager.deleteUserSettings('user123');
```

## Real-time Listeners

```typescript
// Set up real-time listener
const unsubscribe = settingsManager.onSettingsChange('user123', (settings) => {
  if (settings) {
    console.log('Settings updated:', settings);
  } else {
    console.log('Settings deleted');
  }
});

// Clean up listener
unsubscribe();
```

## Batch Operations

```typescript
// Batch update multiple users
await settingsManager.batchUpdateSettings([
  {
    userId: 'user1',
    settings: { profile: { theme: 'dark' } },
    source: 'web'
  },
  {
    userId: 'user2',
    settings: { notifications: { push: { enabled: false } } },
    source: 'mobile'
  }
]);

// Get multiple users' settings
const userIds = ['user1', 'user2', 'user3'];
const settingsMap = await settingsManager.getMultipleUserSettings(userIds);

settingsMap.forEach((settings, userId) => {
  if (settings) {
    console.log(`Settings for ${userId}:`, settings);
  }
});
```

## Mobile Appearance Management

```typescript
// Get mobile appearance config
const appearanceConfig = await settingsManager.getMobileAppearanceConfig();

// Update mobile appearance
await settingsManager.updateMobileAppearanceConfig({
  splashScreen: {
    backgroundColor: '#FF0000',
    logoPosition: 'center',
    showLoadingIndicator: true
  },
  branding: {
    brandColors: {
      primary: '#3B82F6',
      secondary: '#64748B',
      accent: '#F59E0B'
    }
  }
});

// Listen for appearance changes
const unsubscribeAppearance = settingsManager.onMobileAppearanceChange((config) => {
  console.log('Appearance updated:', config);
});
```

## Error Handling

```typescript
import { SettingsErrorType } from '@repo/api';

try {
  await settingsManager.updateUserSettings('user123', invalidSettings);
} catch (error) {
  if (error.type === SettingsErrorType.VALIDATION_ERROR) {
    console.error('Validation failed:', error.message, error.field);
  } else if (error.type === SettingsErrorType.NETWORK_ERROR && error.retryable) {
    console.error('Network error, will retry automatically');
  } else {
    console.error('Unrecoverable error:', error.message);
  }
}
```

## Configuration

```typescript
// Configure retry behavior
settingsManager.setRetryConfig({
  maxAttempts: 5,
  baseDelay: 2000,
  maxDelay: 30000,
  backoffMultiplier: 2
});

// Get current retry config
const retryConfig = settingsManager.getRetryConfig();
```

## Cache Management

```typescript
// Clear all cache
settingsManager.clearCache();

// Clear specific user cache
settingsManager.clearUserCache('user123');

// Get cache statistics
const cacheSize = settingsManager.getCacheSize();
const listenerCount = settingsManager.getListenerCount();

// Get detailed statistics
const stats = settingsManager.getSettingsStats();
console.log('Role distribution:', stats.roleDistribution);
console.log('Theme distribution:', stats.themeDistribution);
```

## Health Monitoring

```typescript
// Check system health
const health = await settingsManager.healthCheck();

if (health.status === 'healthy') {
  console.log('Settings system is healthy');
} else {
  console.error('Settings system issues:', health.details);
}
```

## Performance Optimization

```typescript
// Preload settings for multiple users
const userIds = ['user1', 'user2', 'user3'];
await settingsManager.preloadUserSettings(userIds, 'shopper');

// Search cached settings
const darkThemeUsers = await settingsManager.searchUserSettings({
  theme: 'dark',
  limit: 10
});
```

## Validation

The SettingsManager uses Zod schemas for validation. Common validation rules:

- **Display Name**: 1-100 characters, non-empty
- **Language**: ISO language code format (e.g., 'en', 'th', 'en-US')
- **Time Format**: HH:mm format for quiet hours and business hours
- **Colors**: Hex color format (#RRGGBB)
- **Email**: Valid email format
- **Phone**: 10-15 digits

## Error Types

- `VALIDATION_ERROR`: Invalid data format or values
- `PERMISSION_DENIED`: User lacks permission for operation
- `NETWORK_ERROR`: Network connectivity issues (retryable)
- `SYNC_CONFLICT`: Concurrent modification conflict
- `STORAGE_ERROR`: Database operation failed (retryable)
- `IMAGE_PROCESSING_ERROR`: Image upload/processing failed

## Best Practices

1. **Always handle errors**: Wrap operations in try-catch blocks
2. **Use real-time listeners**: For UI that needs to stay in sync
3. **Batch operations**: When updating multiple users
4. **Preload settings**: For better performance in list views
5. **Clean up listeners**: Always call unsubscribe functions
6. **Monitor health**: Regularly check system health
7. **Cache management**: Clear cache when memory usage is high

## Integration with React

```typescript
// Custom hook for settings
function useUserSettings(userId: string, role: UserRole) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const settingsManager = SettingsManager.getInstance();
    
    const loadSettings = async () => {
      try {
        setLoading(true);
        const userSettings = await settingsManager.getUserSettings(userId, role);
        setSettings(userSettings);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    // Set up real-time listener
    const unsubscribe = settingsManager.onSettingsChange(userId, (updatedSettings) => {
      setSettings(updatedSettings);
    });

    return unsubscribe;
  }, [userId, role]);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    try {
      const settingsManager = SettingsManager.getInstance();
      await settingsManager.updateUserSettings(userId, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }, [userId]);

  return { settings, loading, error, updateSettings };
}
```
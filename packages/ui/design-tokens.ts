// Shared design tokens for consistent UI across web and mobile
export const DesignTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8'
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      500: '#6b7280',
      600: '#4b5563',
      900: '#111827'
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4
    }
  }
};

// Component style patterns
export const ComponentStyles = {
  button: {
    primary: {
      backgroundColor: DesignTokens.colors.primary[600],
      paddingVertical: DesignTokens.spacing.md,
      paddingHorizontal: DesignTokens.spacing.lg,
      borderRadius: DesignTokens.borderRadius.md,
      alignItems: 'center' as const
    },
    text: {
      color: '#ffffff',
      fontSize: DesignTokens.typography.sizes.base,
      fontWeight: DesignTokens.typography.weights.semibold
    }
  },
  
  card: {
    container: {
      backgroundColor: '#ffffff',
      borderRadius: DesignTokens.borderRadius.lg,
      padding: DesignTokens.spacing.lg,
      ...DesignTokens.shadows.sm
    }
  },
  
  input: {
    container: {
      borderWidth: 1,
      borderColor: DesignTokens.colors.gray[200],
      borderRadius: DesignTokens.borderRadius.md,
      paddingVertical: DesignTokens.spacing.md,
      paddingHorizontal: DesignTokens.spacing.md,
      fontSize: DesignTokens.typography.sizes.base
    }
  }
};
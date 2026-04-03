import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { DesignTokens, ComponentStyles } from './design-tokens';

// Shared Button Component
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false
}) => {
  const buttonStyle = [
    ComponentStyles.button.primary,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'outline' && styles.buttonOutline,
    size === 'sm' && styles.buttonSm,
    size === 'lg' && styles.buttonLg,
    disabled && styles.buttonDisabled
  ];

  const textStyle = [
    ComponentStyles.button.text,
    variant === 'secondary' && styles.textSecondary,
    variant === 'outline' && styles.textOutline,
    disabled && styles.textDisabled
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

// Shared Card Component
interface CardProps {
  children: React.ReactNode;
  style?: any;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return (
    <View style={[ComponentStyles.card.container, style]}>
      {children}
    </View>
  );
};

// Shared Rating Component
interface RatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export const Rating: React.FC<RatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  showNumber = true
}) => {
  const starSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  
  return (
    <View style={styles.ratingContainer}>
      <View style={styles.starsContainer}>
        {Array.from({ length: maxRating }, (_, index) => (
          <Text
            key={index}
            style={[
              styles.star,
              { fontSize: starSize },
              index < Math.floor(rating) ? styles.starFilled : styles.starEmpty
            ]}
          >
            ⭐
          </Text>
        ))}
      </View>
      {showNumber && (
        <Text style={styles.ratingText}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

// Shared Loading Component
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  color = DesignTokens.colors.primary[600]
}) => {
  return (
    <View style={styles.loadingContainer}>
      <View style={[
        styles.spinner,
        {
          width: size === 'sm' ? 20 : size === 'lg' ? 40 : 30,
          height: size === 'sm' ? 20 : size === 'lg' ? 40 : 30,
          borderColor: `${color}20`,
          borderTopColor: color
        }
      ]} />
    </View>
  );
};

const styles = StyleSheet.create({
  // Button variants
  buttonSecondary: {
    backgroundColor: DesignTokens.colors.gray[100],
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DesignTokens.colors.primary[600],
  },
  buttonSm: {
    paddingVertical: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.md,
  },
  buttonLg: {
    paddingVertical: DesignTokens.spacing.lg,
    paddingHorizontal: DesignTokens.spacing.xl,
  },
  buttonDisabled: {
    backgroundColor: DesignTokens.colors.gray[200],
    opacity: 0.6,
  },
  
  // Text variants
  textSecondary: {
    color: DesignTokens.colors.gray[600],
  },
  textOutline: {
    color: DesignTokens.colors.primary[600],
  },
  textDisabled: {
    color: DesignTokens.colors.gray[400],
  },
  
  // Rating styles
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    marginRight: 2,
  },
  starFilled: {
    color: '#fbbf24',
  },
  starEmpty: {
    color: DesignTokens.colors.gray[200],
  },
  ratingText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.gray[600],
    fontWeight: DesignTokens.typography.weights.medium,
  },
  
  // Loading styles
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
  },
  spinner: {
    borderWidth: 2,
    borderRadius: DesignTokens.borderRadius.full,
    // Animation would be handled differently on web vs mobile
  },
});
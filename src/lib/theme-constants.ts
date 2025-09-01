// DEPRECATED: This file is maintained for backward compatibility
// For new components, use the useThemeStyles hook instead
// This provides a dynamic theme system with multiple theme options

import { themes } from '@/components/ThemeProvider';
import { createGradients, createThemeColors, createBorders } from '@/lib/theme-utils';

// Default theme for backward compatibility
const defaultTheme = themes.default;

// Core theme colors - change these to switch your entire app theme
export const themeColors = createThemeColors(defaultTheme);

export const gradients = createGradients(defaultTheme);

export const borders = createBorders(defaultTheme);

export const glassMorphism = {
  // Glass-like backgrounds
  light: themeColors.overlay.light,
  medium: themeColors.overlay.medium, 
  dark: 'rgba(255,255,255,0.05)',
  
  // Interactive states
  hover: themeColors.overlay.strong,
  active: 'rgba(255,255,255,0.25)',
  disabled: 'rgba(255,255,255,0.03)',
} as const;

export const borderRadius = {
  small: 1,
  medium: 2,
  large: 3,
  xl: 4,
} as const;

export const shadows = {
  glass: '0px 4px 20px rgba(0,0,0,0.1)',
  elevated: '0px 8px 32px rgba(0,0,0,0.15)',
  floating: '0px 12px 40px rgba(0,0,0,0.2)',
} as const;

// Common component styles
export const cardStyles = {
  default: {
    background: gradients.glass,
    border: borders.default,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
  },
  elevated: {
    background: gradients.glass,
    border: borders.default,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
    boxShadow: shadows.glass,
  },
  surface: {
    background: gradients.surface,
    border: borders.default,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
  },
  header: {
    background: gradients.primary,
    borderBottom: borders.default,
  },
} as const;

export const buttonStyles = {
  glass: {
    bgcolor: glassMorphism.light,
    '&:hover': { bgcolor: glassMorphism.hover },
    '&:active': { bgcolor: glassMorphism.active },
    border: borders.default,
    borderRadius: borderRadius.medium,
    backdropFilter: 'blur(10px)',
  },
  gradient: {
    background: gradients.button,
    '&:hover': { background: gradients.buttonHover },
    borderRadius: borderRadius.medium,
    border: 'none',
  },
  primary: {
    background: gradients.primary,
    '&:hover': { background: gradients.primaryHover },
    borderRadius: borderRadius.medium,
    border: 'none',
    color: themeColors.text.primary,
  },
} as const;

export const menuStyles = {
  paper: {
    background: gradients.glass,
    border: borders.default,
    borderRadius: borderRadius.medium,
    backdropFilter: 'blur(20px)',
    boxShadow: shadows.elevated,
  },
  item: {
    '&:hover': {
      backgroundColor: glassMorphism.hover,
    },
  },
} as const;

// Text styles for consistent typography
export const textStyles = {
  primary: { color: themeColors.text.primary },
  secondary: { color: themeColors.text.secondary },
  muted: { color: themeColors.text.muted },
  accent: { color: themeColors.primary.main },
  error: { color: themeColors.accent.error },
  success: { color: themeColors.accent.success },
  warning: { color: themeColors.accent.warning },
} as const; 
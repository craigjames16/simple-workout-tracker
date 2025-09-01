// Theme utility functions to generate styles based on theme configuration
import { ThemeConfig } from '@/components/ThemeProvider';

// Generate gradients based on theme colors
export function createGradients(theme: ThemeConfig) {
  const primaryRgba = theme.primary.main.replace('rgb(', '').replace(')', '');
  const primaryDarkRgba = theme.primary.dark.replace('rgb(', '').replace(')', '');
  const surfaceDarkRgba = theme.surface.dark.replace('rgb(', '').replace(')', '');
  const surfaceMediumRgba = theme.surface.medium.replace('rgb(', '').replace(')', '');
  const successRgba = theme.accent.success.replace('rgb(', '').replace(')', '');
  const warningRgba = theme.accent.warning.replace('rgb(', '').replace(')', '');
  const errorRgba = theme.accent.error.replace('rgb(', '').replace(')', '');

  return {
    // Your signature gradient - easily changeable here
    primary: `linear-gradient(135deg, rgba(${primaryRgba}, 0.8) 0%, rgba(${primaryDarkRgba}, 0.8) 100%)`,
    primaryHover: `linear-gradient(135deg, rgba(${primaryRgba}, 0.9) 0%, rgba(${primaryDarkRgba}, 0.9) 100%)`,
    
    // Surface gradients
    surface: `linear-gradient(135deg, rgba(${surfaceDarkRgba}, 0.95) 0%, rgba(${surfaceMediumRgba}, 0.95) 100%)`,
    surfaceStrong: `linear-gradient(135deg, rgba(${surfaceDarkRgba}, 0.98) 0%, rgba(${surfaceMediumRgba}, 0.98) 100%)`,
    
    // Glass effect gradients
    glass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    glassHover: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
    
    // Button gradients
    button: `linear-gradient(135deg, ${theme.primary.main} 0%, ${theme.primary.dark} 100%)`,
    buttonHover: `linear-gradient(135deg, ${theme.primary.dark} 0%, rgb(29, 78, 216) 100%)`,
    
    // Accent gradients
    success: `linear-gradient(135deg, rgba(${successRgba}, 0.2) 0%, rgba(22, 163, 74, 0.3) 100%)`,
    warning: `linear-gradient(135deg, rgba(${warningRgba}, 0.2) 0%, rgba(217, 119, 6, 0.3) 100%)`,
    error: `linear-gradient(135deg, rgba(${errorRgba}, 0.2) 0%, rgba(220, 38, 38, 0.3) 100%)`,
  } as const;
}

// Generate theme colors object
export function createThemeColors(theme: ThemeConfig) {
  return {
    // Primary brand colors
    primary: theme.primary,
    // Secondary/surface colors
    surface: theme.surface,
    // Accent colors
    accent: theme.accent,
    // Text colors
    text: {
      primary: 'rgba(255, 255, 255, 0.95)',
      secondary: 'rgba(156, 163, 175, 0.9)',
      muted: 'rgba(156, 163, 175, 0.7)',
    },
    // Border and overlay colors
    overlay: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.15)',
      strong: 'rgba(255, 255, 255, 0.2)',
    },
  } as const;
}

// Generate borders based on theme
export function createBorders(theme: ThemeConfig) {
  const primaryRgba = theme.primary.main.replace('rgb(', '').replace(')', '');
  
  return {
    default: '1px solid rgba(255,255,255,0.1)',
    thick: '2px solid rgba(255,255,255,0.15)',
    accent: `1px solid rgba(${primaryRgba}, 0.3)`,
    dashed: '1px dashed rgba(255,255,255,0.2)',
  } as const;
}

// Static values that don't change with theme
export const glassMorphism = {
  light: 'rgba(255,255,255,0.1)',
  medium: 'rgba(255,255,255,0.15)', 
  dark: 'rgba(255,255,255,0.05)',
  hover: 'rgba(255,255,255,0.2)',
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

// Generate component styles based on theme
export function createComponentStyles(theme: ThemeConfig) {
  const gradients = createGradients(theme);
  const borders = createBorders(theme);
  const themeColors = createThemeColors(theme);

  return {
    cardStyles: {
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
    },
    buttonStyles: {
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
    },
    menuStyles: {
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
    },
    textStyles: {
      primary: { color: themeColors.text.primary },
      secondary: { color: themeColors.text.secondary },
      muted: { color: themeColors.text.muted },
      accent: { color: themeColors.primary.main },
      error: { color: themeColors.accent.error },
      success: { color: themeColors.accent.success },
      warning: { color: themeColors.accent.warning },
    },
  } as const;
}

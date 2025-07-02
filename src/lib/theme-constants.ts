// Standardized styling constants for consistent design across components

export const gradients = {
  // Primary gradients
  primary: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(156, 39, 176, 0.3) 100%)',
  secondary: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  button: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
  buttonHover: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
  
  // Accent gradients
  success: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(46, 125, 50, 0.3) 100%)',
  warning: 'linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(230, 81, 0, 0.3) 100%)',
  error: 'linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(198, 40, 40, 0.3) 100%)',
} as const;

export const glassMorphism = {
  // Glass-like backgrounds
  light: 'rgba(255,255,255,0.1)',
  medium: 'rgba(255,255,255,0.15)', 
  dark: 'rgba(255,255,255,0.05)',
  
  // Interactive states
  hover: 'rgba(255,255,255,0.2)',
  active: 'rgba(255,255,255,0.25)',
  disabled: 'rgba(255,255,255,0.03)',
} as const;

export const borders = {
  default: '1px solid rgba(255,255,255,0.1)',
  thick: '2px solid rgba(255,255,255,0.15)',
  accent: '1px solid rgba(25, 118, 210, 0.3)',
  dashed: '1px dashed rgba(255,255,255,0.2)',
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
    background: gradients.secondary,
    border: borders.default,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
  },
  elevated: {
    background: gradients.secondary,
    border: borders.default,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
    boxShadow: shadows.glass,
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
} as const;

export const menuStyles = {
  paper: {
    background: gradients.secondary,
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
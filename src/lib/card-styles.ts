import { SxProps, Theme } from '@mui/material';
import { gradients, themeColors, borders } from './theme-constants';

// Base card container styles
export const baseCardStyles: SxProps<Theme> = {
  borderRadius: 2,
  overflow: 'hidden',
  background: gradients.surface,
  backdropFilter: 'blur(20px)',
  border: borders.default,
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
};

// Header section styles (no background, no border)
export const cardHeaderStyles: SxProps<Theme> = {
  p: { xs: 2, sm: 3 }
};

// Content section styles
export const cardContentStyles: SxProps<Theme> = {
  p: { xs: 2, sm: 3 }
};

// Input field styles
export const inputFieldStyles: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    color: 'white',
    '&:hover': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&.Mui-focused': {
      borderColor: themeColors.primary.main,
      boxShadow: `0 0 0 3px rgba(${themeColors.primary.main.replace('rgb(', '').replace(')', '')}, 0.1)`
    },
    '& fieldset': {
      border: 'none'
    }
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: themeColors.primary.main
    }
  }
};

// Button styles
export const buttonStyles: SxProps<Theme> = {
  borderRadius: 2,
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: 'rgba(156, 163, 175, 0.8)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': { 
    background: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    transform: 'translateY(-1px)'
  }
};

// Tab styles
export const tabStyles: SxProps<Theme> = {
  minWidth: 'auto',
  px: 3,
  py: 1.5,
  borderRadius: 1,
  color: 'rgba(156, 163, 175, 0.9)',
  fontWeight: 500,
  fontSize: '0.875rem',
  textTransform: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.04)',
    color: 'rgba(255, 255, 255, 0.9)',
    transform: 'translateY(-1px)'
  },
  '&.Mui-selected': {
    background: gradients.glass,
    color: 'white',
    fontWeight: 600,
    border: borders.default,
    boxShadow: '0 4px 12px -4px rgba(0, 0, 0, 0.1)'
  }
};

// Chart bar styles with consistent border radius
export const chartBarStyles = {
  borderRadius: [4, 4, 0, 0]
};

// Typography styles for headers
export const headerTypographyStyles: SxProps<Theme> = {
  fontWeight: 700,
  color: 'white',
  fontSize: { xs: '1.125rem', sm: '1.25rem' }
};

export const mainHeaderTypographyStyles: SxProps<Theme> = {
  fontWeight: 700,
  color: 'white',
  fontSize: { xs: '1.5rem', sm: '2rem' }
}; 
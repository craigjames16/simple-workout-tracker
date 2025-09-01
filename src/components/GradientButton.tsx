import { Button, ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import { gradients, borders, themeColors } from '@/lib/theme-constants';

const GradientButton = styled(Button)<ButtonProps>(() => {
  // Extract RGB values from theme colors for alpha variants
  const primaryRgba = themeColors.primary.main.replace('rgb(', '').replace(')', '');
  
  return {
    // Modern glass-style look with theme colors
    background: gradients.button,
    backdropFilter: 'blur(10px)',
    color: themeColors.text.primary,
    border: `1px solid rgba(${primaryRgba}, 0.5)`,
    boxShadow: `0 4px 20px rgba(${primaryRgba}, 0.3), 0 0 40px rgba(${primaryRgba}, 0.1)`,
    transform: 'translateY(-1px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover:not(:disabled)': {
      background: gradients.buttonHover,
      border: `1px solid rgba(${primaryRgba}, 0.8)`,
      boxShadow: `0 6px 25px rgba(${primaryRgba}, 0.4), 0 0 50px rgba(${primaryRgba}, 0.15)`,
      transform: 'translateY(-2px)',
    },
    '&:active:not(:disabled)': {
      background: gradients.primary,
      border: borders.accent,
      transform: 'translateY(0px)',
    },
    '&:disabled': {
      background: gradients.glass,
      border: borders.default,
      boxShadow: 'none',
      transform: 'none',
      color: 'rgba(255, 255, 255, 0.5)',
    },
  };
});

export default GradientButton;
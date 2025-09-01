'use client';

import { useTheme } from '@/components/ThemeProvider';
import { 
  createGradients, 
  createThemeColors, 
  createBorders, 
  createComponentStyles,
  glassMorphism,
  borderRadius,
  shadows
} from '@/lib/theme-utils';

/**
 * Hook that provides all theme-related styles based on current theme
 * This is the main hook you should use in components for styling
 */
export function useThemeStyles() {
  const { currentTheme } = useTheme();

  const gradients = createGradients(currentTheme);
  const themeColors = createThemeColors(currentTheme);
  const borders = createBorders(currentTheme);
  const componentStyles = createComponentStyles(currentTheme);

  return {
    gradients,
    themeColors,
    borders,
    glassMorphism,
    borderRadius,
    shadows,
    ...componentStyles,
  };
}

# Centralized Theme System

Your app now has a powerful, centralized theme system that makes it easy to change colors and create new themes throughout your entire application.

## Quick Start

### 1. Setup Theme Provider
Wrap your app with the `ThemeProvider` to enable theme switching:

```tsx
import { ThemeProvider } from '@/components';

function App() {
  return (
    <ThemeProvider>
      {/* Your app content */}
    </ThemeProvider>
  );
}
```

### 2. Use Theme Styles in Components
Replace hardcoded colors with the `useThemeStyles` hook:

```tsx
import { useThemeStyles } from '@/hooks/useThemeStyles';

function MyComponent() {
  const { gradients, themeColors, buttonStyles } = useThemeStyles();
  
  return (
    <Box sx={{
      background: gradients.primary,  // Your signature gradient
      color: themeColors.text.primary,
      '&:hover': {
        background: gradients.primaryHover,
      }
    }}>
      {/* Component content */}
    </Box>
  );
}
```

### 3. Add Theme Selector
Include the theme selector component to let users switch themes:

```tsx
import { ThemeSelector } from '@/components';

function Navbar() {
  return (
    <Box>
      {/* Other navbar content */}
      <ThemeSelector />
    </Box>
  );
}
```

## Available Themes

- **Default Blue** - Your current blue theme
- **Purple Dream** - Rich purple gradients
- **Emerald Ocean** - Fresh emerald green
- **Sunset Orange** - Warm orange tones
- **Rose Gold** - Elegant rose colors

## Available Style Properties

### Gradients
```tsx
const { gradients } = useThemeStyles();

// Primary gradients (your main theme color)
gradients.primary        // Your signature gradient
gradients.primaryHover   // Hover state
gradients.button         // Solid button gradient
gradients.buttonHover    // Button hover state

// Surface gradients
gradients.surface        // Card backgrounds
gradients.surfaceStrong  // Dialog/modal backgrounds
gradients.glass          // Glass morphism effect
gradients.glassHover     // Glass hover state

// Accent gradients
gradients.success        // Success state
gradients.warning        // Warning state
gradients.error          // Error state
```

### Theme Colors
```tsx
const { themeColors } = useThemeStyles();

// Primary colors
themeColors.primary.main   // Main theme color
themeColors.primary.dark   // Darker variant
themeColors.primary.light  // Lighter variant

// Surface colors
themeColors.surface.dark   // Dark surface
themeColors.surface.medium // Medium surface
themeColors.surface.light  // Light surface

// Text colors
themeColors.text.primary   // Primary text
themeColors.text.secondary // Secondary text
themeColors.text.muted     // Muted text

// Accent colors
themeColors.accent.success // Green
themeColors.accent.warning // Orange/Yellow
themeColors.accent.error   // Red
```

### Component Styles
```tsx
const { buttonStyles, cardStyles, textStyles } = useThemeStyles();

// Pre-built button styles
sx={buttonStyles.primary}   // Primary button
sx={buttonStyles.glass}     // Glass morphism button
sx={buttonStyles.gradient}  // Gradient button

// Pre-built card styles
sx={cardStyles.default}     // Default card
sx={cardStyles.elevated}    // Elevated card with shadow
sx={cardStyles.surface}     // Surface card

// Pre-built text styles
sx={textStyles.primary}     // Primary text color
sx={textStyles.accent}      // Accent text color
sx={textStyles.error}       // Error text color
```

## Creating New Themes

To add a new theme, edit `/src/components/ThemeProvider.tsx`:

```tsx
export const themes: Record<string, ThemeConfig> = {
  // ... existing themes
  myCustomTheme: {
    name: 'My Custom Theme',
    primary: {
      main: 'rgb(255, 0, 128)',     // Hot pink
      dark: 'rgb(200, 0, 100)',     // Darker pink
      light: 'rgb(255, 100, 180)',  // Lighter pink
    },
    surface: {
      dark: 'rgb(15, 23, 42)',      // Keep surface colors consistent
      medium: 'rgb(30, 41, 59)',
      light: 'rgb(51, 65, 85)',
    },
    accent: {
      success: 'rgb(34, 197, 94)',  // Keep accent colors consistent
      warning: 'rgb(245, 158, 11)',
      error: 'rgb(239, 68, 68)',
    },
  },
};
```

## Migration Guide

### From Old System
If you have components using the old `theme-constants.ts`, they will continue to work but won't be theme-aware. To make them dynamic:

**Before:**
```tsx
import { gradients } from '@/lib/theme-constants';

// Static - won't change with theme
background: gradients.primary
```

**After:**
```tsx
import { useThemeStyles } from '@/hooks/useThemeStyles';

function MyComponent() {
  const { gradients } = useThemeStyles();
  
  // Dynamic - changes with theme
  return <Box sx={{ background: gradients.primary }} />;
}
```

## Benefits

1. **Easy Theme Changes** - Change your entire app's color scheme in one place
2. **User Choice** - Let users pick their preferred theme
3. **Consistent Design** - All components use the same color system
4. **Type Safety** - Full TypeScript support with autocomplete
5. **Performance** - Theme preferences are saved to localStorage
6. **Backward Compatible** - Existing components continue to work

## Best Practices

1. Always use `useThemeStyles()` for new components
2. Use semantic names (`gradients.primary` not specific colors)
3. Test your components with different themes
4. Keep surface and accent colors consistent across themes
5. Only change primary colors to create theme variations

Your signature gradient `linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.8) 100%)` is now available as `gradients.primary` and will automatically adapt to whatever theme the user selects!

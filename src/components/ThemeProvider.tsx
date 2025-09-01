'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define theme configurations
export interface ThemeConfig {
  name: string;
  primary: {
    main: string;
    dark: string;
    light: string;
  };
  surface: {
    dark: string;
    medium: string;
    light: string;
  };
  accent: {
    success: string;
    warning: string;
    error: string;
  };
}

// Predefined theme configurationszw
export const themes: Record<string, ThemeConfig> = {
  default: {
    name: 'Default Blue',
    primary: {
      main: 'rgb(59, 130, 246)',     // Blue-500
      dark: 'rgb(37, 99, 235)',      // Blue-600
      light: 'rgb(96, 165, 250)',    // Blue-400
    },
    surface: {
      dark: 'rgb(38, 38, 38)',       // Slate-900
      medium: 'rgb(45, 45, 45)',     // Slate-800
      light: 'rgb(51, 65, 85)',      // Slate-700
    },
    accent: {
      success: 'rgb(34, 197, 94)',   // Green-500
      warning: 'rgb(245, 158, 11)',  // Amber-500
      error: 'rgb(239, 68, 68)',     // Red-500
    },
  },
  purple: {
    name: 'Purple Dream',
    primary: {
      main: 'rgb(147, 51, 234)',     // Purple-600
      dark: 'rgb(126, 34, 206)',     // Purple-700
      light: 'rgb(168, 85, 247)',    // Purple-500
    },
    surface: {
      dark: 'rgb(15, 23, 42)',       // Slate-900
      medium: 'rgb(30, 41, 59)',     // Slate-800
      light: 'rgb(51, 65, 85)',      // Slate-700
    },
    accent: {
      success: 'rgb(34, 197, 94)',   // Green-500
      warning: 'rgb(245, 158, 11)',  // Amber-500
      error: 'rgb(239, 68, 68)',     // Red-500
    },
  },
  emerald: {
    name: 'Emerald Ocean',
    primary: {
      main: 'rgb(16, 185, 129)',     // Emerald-500
      dark: 'rgb(5, 150, 105)',      // Emerald-600
      light: 'rgb(52, 211, 153)',    // Emerald-400
    },
    surface: {
      dark: 'rgb(15, 23, 42)',       // Slate-900
      medium: 'rgb(30, 41, 59)',     // Slate-800
      light: 'rgb(51, 65, 85)',      // Slate-700
    },
    accent: {
      success: 'rgb(34, 197, 94)',   // Green-500
      warning: 'rgb(245, 158, 11)',  // Amber-500
      error: 'rgb(239, 68, 68)',     // Red-500
    },
  },
  orange: {
    name: 'Sunset Orange',
    primary: {
      main: 'rgb(249, 115, 22)',     // Orange-500
      dark: 'rgb(234, 88, 12)',      // Orange-600
      light: 'rgb(251, 146, 60)',    // Orange-400
    },
    surface: {
      dark: 'rgb(15, 23, 42)',       // Slate-900
      medium: 'rgb(30, 41, 59)',     // Slate-800
      light: 'rgb(51, 65, 85)',      // Slate-700
    },
    accent: {
      success: 'rgb(34, 197, 94)',   // Green-500
      warning: 'rgb(245, 158, 11)',  // Amber-500
      error: 'rgb(239, 68, 68)',     // Red-500
    },
  },
  rose: {
    name: 'Rose Gold',
    primary: {
      main: 'rgb(244, 63, 94)',      // Rose-500
      dark: 'rgb(225, 29, 72)',      // Rose-600
      light: 'rgb(251, 113, 133)',   // Rose-400
    },
    surface: {
      dark: 'rgb(15, 23, 42)',       // Slate-900
      medium: 'rgb(30, 41, 59)',     // Slate-800
      light: 'rgb(51, 65, 85)',      // Slate-700
    },
    accent: {
      success: 'rgb(34, 197, 94)',   // Green-500
      warning: 'rgb(245, 158, 11)',  // Amber-500
      error: 'rgb(239, 68, 68)',     // Red-500
    },
  },
};

interface ThemeContextType {
  currentTheme: ThemeConfig;
  themeName: string;
  setTheme: (themeName: string) => void;
  availableThemes: string[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState('default');
  const currentTheme = themes[themeName] || themes.default;

  const setTheme = (newThemeName: string) => {
    if (themes[newThemeName]) {
      setThemeName(newThemeName);
      // Store theme preference in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('workout-tracker-theme', newThemeName);
      }
    }
  };

  // Load theme from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('workout-tracker-theme');
      if (savedTheme && themes[savedTheme]) {
        setThemeName(savedTheme);
      }
    }
  }, []);

  const value: ThemeContextType = {
    currentTheme,
    themeName,
    setTheme,
    availableThemes: Object.keys(themes),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

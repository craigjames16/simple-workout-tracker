'use client';

import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ReactNode, useState } from 'react';
import { gradients, glassMorphism, borders, borderRadius, shadows, menuStyles, buttonStyles } from '@/lib/theme-constants';

export const trackGradient = gradients.button;

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1c5da6',
    },
    secondary: {
      main: '#3d3d3d',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body': {
          backgroundColor: '#121212',
          minHeight: '100vh',
          margin: 0,
          padding: 0,
        },
        '#__next': {
          minHeight: '100vh',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a !important',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          backgroundImage: gradients.secondary,
          border: borders.default,
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          ...menuStyles.paper,
        }
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          ...menuStyles.paper,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          ...menuStyles.item,
          borderRadius: borderRadius.small,
          margin: '2px 4px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          ...buttonStyles.gradient,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          ...buttonStyles.glass,
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: glassMorphism.light,
            borderRadius: borderRadius.medium,
            '& fieldset': {
              borderColor: 'rgba(255,255,255,0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255,255,255,0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'rgba(25, 118, 210, 0.5)',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255,255,255,0.7)',
          },
        },
      },
    },
  },
  typography: {
    button: {
      textTransform: 'none',
    },
  },
});

export default function ThemeRegistry({ children }: { children: ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({
      key: 'mui',
    });
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) {
      return null;
    }
    let styles = '';
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
} 
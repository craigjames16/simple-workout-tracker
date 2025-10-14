'use client';

import { Container, Box, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import ThemeRegistry from '@/components/ThemeRegistry';
import { NextAuthProvider } from '../provider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { ThemeProvider as CustomThemeProvider } from '@/components/ThemeProvider';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <NextAuthProvider>
        <CustomThemeProvider>
          <ThemeRegistry>
            <AuthLayoutContent>
              {children}
            </AuthLayoutContent>
          </ThemeRegistry>
        </CustomThemeProvider>
      </NextAuthProvider>
    </ErrorBoundary>
  );
}

function AuthLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { gradients, themeColors, textStyles } = useThemeStyles();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: themeColors.surface.dark,
        py: 4,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 80%, ${themeColors.primary.main}15 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${themeColors.primary.light}10 0%, transparent 50%), radial-gradient(circle at 40% 40%, ${themeColors.primary.dark}08 0%, transparent 50%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        {children}
        
        <Box
          sx={{
            textAlign: 'center',
            mt: 4,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              ...textStyles.muted,
            }}
          >
            © 2024 Workout Tracker. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container, Paper, Typography, Button, Box, Alert } from '@mui/material';
import { signIn } from 'next-auth/react';
import { ErrorOutline } from '@mui/icons-material';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { buttonStyles } from '@/lib/card-styles';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const { gradients, themeColors, textStyles, borders, borderRadius, shadows } = useThemeStyles();
  const error = searchParams?.get('error');

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account. Please sign in using your original provider.';
      case 'OAuthCallback':
        return 'There was an issue with the authentication provider. Please try again.';
      case 'OAuthCreateAccount':
        return 'Unable to create account. Please try again or contact support.';
      case 'EmailCreateAccount':
        return 'Unable to create account with this email. Please try again.';
      case 'Callback':
        return 'There was an issue with the authentication callback. Please try again.';
      case 'OAuthSignin':
        return 'There was an issue signing in with the provider. Please try again.';
      case 'EmailSignin':
        return 'There was an issue signing in with your email. Please check your credentials.';
      case 'CredentialsSignin':
        return 'Invalid email or password. Please try again.';
      case 'SessionRequired':
        return 'Please sign in to access this page.';
      default:
        return 'An error occurred during authentication. Please try again.';
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: borderRadius.large,
          background: themeColors.surface.medium,
          border: `1px solid ${themeColors.surface.light}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <ErrorOutline
            sx={{
              fontSize: 64,
              color: textStyles.error.color,
              mb: 2,
            }}
          />
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              ...textStyles.primary,
              fontWeight: 'bold', 
              mb: 1 
            }}
          >
            Authentication Error
          </Typography>
        </Box>

        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            background: gradients.error,
            border: borders.accent,
            color: textStyles.error.color,
          }}
        >
          {getErrorMessage(error || '')}
        </Alert>

        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            sx={{
              background: themeColors.primary.main,
              '&:hover': {
                background: themeColors.primary.dark,
              },
              mr: 2,
              py: 1.5,
              px: 4,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: borderRadius.medium,
              color: 'white',
              border: 'none',
            }}
          >
            Try Google Sign In
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            onClick={() => window.location.href = '/signin'}
            sx={{
              background: themeColors.surface.dark,
              border: `1px solid ${themeColors.surface.light}`,
              py: 1.5,
              px: 4,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: borderRadius.medium,
              color: textStyles.primary.color,
              '&:hover': {
                background: themeColors.surface.medium,
                borderColor: themeColors.primary.main,
                transform: 'translateY(-1px)',
              },
            }}
          >
            Try Email Sign In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}

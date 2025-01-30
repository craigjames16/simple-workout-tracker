'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container, Paper, Typography, Button } from '@mui/material';
import { signIn } from 'next-auth/react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account. Please sign in using your original provider.';
      default:
        return 'An error occurred during authentication. Please try again.';
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper 
        elevation={3} 
        sx={{ 
          mt: 8, 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}
      >
        <Typography 
          component="h1" 
          variant="h5" 
          color="error" 
          sx={{ mb: 3 }}
        >
          Authentication Error
        </Typography>

        <Typography sx={{ mb: 3, textAlign: 'center' }}>
          {getErrorMessage(error || '')}
        </Typography>

        <Button
          variant="contained"
          onClick={() => signIn('google', { callbackUrl: '/' })}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
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
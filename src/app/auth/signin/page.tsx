'use client';

import { signIn } from "next-auth/react"
import { Container, Paper, Button, Typography } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'

export default function SignIn() {
  const handleGoogleSignIn = async () => {
    await signIn('google', { 
      callbackUrl: '/',
      redirect: true
    })
  }

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
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Sign in to continue
        </Typography>

        <Button
          fullWidth
          variant="contained"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleSignIn}
          sx={{
            backgroundColor: '#fff',
            color: '#757575',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#f1f1f1',
            },
          }}
        >
          Sign in with Google
        </Button>
      </Paper>
    </Container>
  )
}
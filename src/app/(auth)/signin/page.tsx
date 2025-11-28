'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Divider,
  Alert,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Visibility,
  VisibilityOff,
  Email,
  Lock,
} from '@mui/icons-material';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { inputFieldStyles, buttonStyles } from '@/lib/card-styles';

export default function SignIn() {
  const router = useRouter();
  const { gradients, themeColors, textStyles, borders, borderRadius, shadows } = useThemeStyles();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/data');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      await signIn('google', {
        callbackUrl: '/data',
        redirect: true,
      });
    } catch (error) {
      setError('An error occurred with Google sign in. Please try again.');
      setIsLoading(false);
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
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              ...textStyles.primary,
              fontWeight: 'bold', 
              mb: 1 
            }}
          >
            Welcome Back
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              ...textStyles.secondary 
            }}
          >
            Sign in to your account to continue
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              background: gradients.error,
              border: borders.accent,
              color: textStyles.error.color,
            }}
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleEmailSignIn} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                background: themeColors.surface.dark,
                border: `1px solid ${themeColors.surface.light}`,
                borderRadius: borderRadius.medium,
                color: textStyles.primary.color,
                '&:hover': {
                  borderColor: themeColors.primary.main,
                },
                '&.Mui-focused': {
                  borderColor: themeColors.primary.main,
                  boxShadow: `0 0 0 3px ${themeColors.primary.main}20`
                },
                '& fieldset': {
                  border: 'none'
                }
              },
              '& .MuiInputLabel-root': {
                color: textStyles.secondary.color,
                '&.Mui-focused': {
                  color: themeColors.primary.main
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: textStyles.muted.color }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                background: themeColors.surface.dark,
                border: `1px solid ${themeColors.surface.light}`,
                borderRadius: borderRadius.medium,
                color: textStyles.primary.color,
                '&:hover': {
                  borderColor: themeColors.primary.main,
                },
                '&.Mui-focused': {
                  borderColor: themeColors.primary.main,
                  boxShadow: `0 0 0 3px ${themeColors.primary.main}20`
                },
                '& fieldset': {
                  border: 'none'
                }
              },
              '& .MuiInputLabel-root': {
                color: textStyles.secondary.color,
                '&.Mui-focused': {
                  color: themeColors.primary.main
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: textStyles.muted.color }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={isLoading}
                    sx={{ color: textStyles.muted.color }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{
              background: themeColors.primary.main,
              '&:hover': {
                background: themeColors.primary.dark,
              },
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: borderRadius.medium,
              color: 'white',
              border: 'none',
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </Box>

        <Divider sx={{ 
          my: 3,
          borderColor: themeColors.surface.light,
          '&::before, &::after': {
            borderColor: themeColors.surface.light,
          }
        }}>
          <Typography 
            variant="body2" 
            sx={{ 
              ...textStyles.muted,
              px: 2,
            }}
          >
            OR
          </Typography>
        </Divider>

        <Button
          fullWidth
          variant="outlined"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          sx={{
            background: themeColors.surface.dark,
            border: `1px solid ${themeColors.surface.light}`,
            py: 1.5,
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
          Continue with Google
        </Button>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              ...textStyles.secondary 
            }}
          >
            Don't have an account?{' '}
            <Link
              href="/signup"
              sx={{
                ...textStyles.accent,
                fontWeight: 'bold',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Sign up here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

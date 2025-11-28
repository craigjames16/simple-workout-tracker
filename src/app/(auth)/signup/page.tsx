'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
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
  FormControlLabel,
  Checkbox,
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

export default function SignUp() {
  const router = useRouter();
  const { gradients, themeColors, textStyles, borders, borderRadius, shadows } = useThemeStyles();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return false;
    }
    return true;
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // For now, we'll use the credentials provider
      // In a real app, you'd want to create a separate signup API route
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        isSignUp: true,
      });

      if (result?.error) {
        setError('An account with this email already exists');
      } else {
        router.push('/data');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError('');

    try {
      await signIn('google', {
        callbackUrl: '/data',
        redirect: true,
      });
    } catch (error) {
      setError('An error occurred with Google sign up. Please try again.');
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
            Create Account
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              ...textStyles.secondary 
            }}
          >
            Join us to start tracking your fitness journey
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

        <Box component="form" onSubmit={handleEmailSignUp} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
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
            value={formData.password}
            onChange={handleInputChange('password')}
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

          <TextField
            fullWidth
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
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
                  <Lock sx={{ color: textStyles.muted.color }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    disabled={isLoading}
                    sx={{ color: textStyles.muted.color }}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                disabled={isLoading}
                sx={{
                  color: textStyles.muted.color,
                  '&.Mui-checked': {
                    color: themeColors.primary.main,
                  },
                }}
              />
            }
            label={
              <Typography 
                variant="body2" 
                sx={{ 
                  ...textStyles.secondary 
                }}
              >
                I agree to the{' '}
                <Link 
                  href="/terms" 
                  target="_blank" 
                  rel="noopener"
                  sx={{
                    ...textStyles.accent,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link 
                  href="/privacy" 
                  target="_blank" 
                  rel="noopener"
                  sx={{
                    ...textStyles.accent,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Privacy Policy
                </Link>
              </Typography>
            }
            sx={{ mb: 3 }}
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
            {isLoading ? 'Creating Account...' : 'Create Account'}
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
          onClick={handleGoogleSignUp}
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
            Already have an account?{' '}
            <Link
              href="/signin"
              sx={{
                ...textStyles.accent,
                fontWeight: 'bold',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Sign in here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

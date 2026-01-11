'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Divider,
  Chip,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
} from '@mui/icons-material';
import { gradients, themeColors } from '@/lib/theme-constants';

interface AuthStatus {
  hasPassword: boolean;
  linkedProviders: string[];
}

export default function PasswordSecurityCard() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state for adding password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state for changing password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    fetchAuthStatus();
  }, []);

  const fetchAuthStatus = async () => {
    try {
      const response = await fetch('/api/user/auth-status');
      if (!response.ok) {
        throw new Error('Failed to fetch auth status');
      }
      const data = await response.json();
      setAuthStatus(data);
    } catch (error) {
      console.error('Error fetching auth status:', error);
      setError('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add password');
      }

      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
      await fetchAuthStatus(); // Refresh auth status
    } catch (error: any) {
      setError(error.message || 'Failed to add password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      setSubmitting(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      setError(error.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card
        sx={{
          background: gradients.surface,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <CardContent>
          <Typography sx={{ color: 'white' }}>Loading...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!authStatus) {
    return null;
  }

  return (
    <Card
      sx={{
        background: gradients.surface,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SecurityIcon sx={{ color: themeColors.primary, mr: 1 }} />
          <Typography variant="h6" sx={{ color: 'white' }}>
            Password & Security
          </Typography>
        </Box>
        <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Linked Providers */}
        {authStatus.linkedProviders.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}
            >
              Linked Accounts
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {authStatus.linkedProviders.map((provider) => (
                <Chip
                  key={provider}
                  label={provider.charAt(0).toUpperCase() + provider.slice(1)}
                  size="small"
                  sx={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    textTransform: 'capitalize',
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'rgba(239, 68, 68, 0.9)',
            }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 2,
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: 'rgba(34, 197, 94, 0.9)',
            }}
            onClose={() => setSuccess(false)}
          >
            {authStatus.hasPassword
              ? 'Password changed successfully'
              : 'Password added successfully'}
          </Alert>
        )}

        {!authStatus.hasPassword ? (
          // Add Password Form
          <Box component="form" onSubmit={handleAddPassword}>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}
            >
              Add a password to enable email/password sign-in
            </Typography>

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 2,
                  color: 'white',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-focused': {
                    borderColor: themeColors.primary.main,
                  },
                  '& fieldset': {
                    border: 'none',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: themeColors.primary.main,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={submitting}
                      sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={submitting}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 2,
                  color: 'white',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-focused': {
                    borderColor: themeColors.primary.main,
                  },
                  '& fieldset': {
                    border: 'none',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: themeColors.primary.main,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      disabled={submitting}
                      sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                },
              }}
            >
              {submitting ? 'Adding Password...' : 'Add Password'}
            </Button>
          </Box>
        ) : (
          // Change Password Form
          <Box component="form" onSubmit={handleChangePassword}>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}
            >
              Change your account password
            </Typography>

            <TextField
              fullWidth
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={submitting}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 2,
                  color: 'white',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-focused': {
                    borderColor: themeColors.primary.main,
                  },
                  '& fieldset': {
                    border: 'none',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: themeColors.primary.main,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                      disabled={submitting}
                      sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={submitting}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 2,
                  color: 'white',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-focused': {
                    borderColor: themeColors.primary.main,
                  },
                  '& fieldset': {
                    border: 'none',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: themeColors.primary.main,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                      disabled={submitting}
                      sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              type={showConfirmNewPassword ? 'text' : 'password'}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              disabled={submitting}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 2,
                  color: 'white',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-focused': {
                    borderColor: themeColors.primary.main,
                  },
                  '& fieldset': {
                    border: 'none',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: themeColors.primary.main,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      edge="end"
                      disabled={submitting}
                      sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                    >
                      {showConfirmNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                },
              }}
            >
              {submitting ? 'Changing Password...' : 'Change Password'}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}


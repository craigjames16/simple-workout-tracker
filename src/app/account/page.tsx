'use client';

import { useSession, signOut } from 'next-auth/react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Avatar, 
  Button, 
  Divider,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Email as EmailIcon, 
  Logout as LogoutIcon,
  Security as SecurityIcon,
  FitnessCenter as FitnessCenterIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { gradients, themeColors } from '@/lib/theme-constants';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/export/sets');
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workout-data-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4,
          background: gradients.surface,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            src={session.user.image || undefined}
            sx={{ 
              width: 80, 
              height: 80, 
              mr: 3,
              border: '3px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <PersonIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 600 }}>
              {session.user.name || 'User'}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
              Account Settings
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Profile Information */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
            background: gradients.surface,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ color: themeColors.primary, mr: 1 }} />
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    Profile Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 0.5 }}>
                    Display Name
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    {session.user.name || 'Not provided'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmailIcon sx={{ color: 'rgba(255, 255, 255, 0.6)', mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mr: 1 }}>
                    Email:
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    {session.user.email}
                  </Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Chip 
                    label="Google Account" 
                    color="primary" 
                    size="small"
                    sx={{ 
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Account Actions */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              background: gradients.surface,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SecurityIcon sx={{ color: themeColors.primary, mr: 1 }} />
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    Account Actions
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportData}
                  sx={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    mb: 2,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }
                  }}
                >
                  Export Workout Data
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<LogoutIcon />}
                  onClick={handleSignOut}
                  sx={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                    }
                  }}
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

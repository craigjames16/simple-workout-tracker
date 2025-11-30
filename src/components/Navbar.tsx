'use client';

import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material';
import Link from 'next/link';
import NextImage from 'next/image';
import HomeIcon from '@mui/icons-material/Home';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SportsGymnasticsIcon from '@mui/icons-material/SportsGymnastics';
import ListAltIcon from '@mui/icons-material/ListAlt';
import RepeatIcon from '@mui/icons-material/Repeat';
import TimelineIcon from '@mui/icons-material/Timeline';
import ChatIcon from '@mui/icons-material/Chat';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { gradients, themeColors } from '@/lib/theme-constants';

const navItems = [
  { text: 'Track', href: '/track', icon: <TimelineIcon />, highlight: true },
  { text: 'Data', href: '/data', icon: <HomeIcon /> },
  { text: 'Plan', href: '/plan', icon: <ListAltIcon /> },
  { text: 'Account', href: '/account', icon: <AccountCircleIcon /> },
];

 export default function Navbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const isTrackDetailPage = pathname.match(/^\/track\/\d+$/);

  // Get current bottom nav value based on pathname
  const getBottomNavValue = () => {
    if (pathname === '/track') return 0;
    if (pathname === '/data') return 1;
    if (pathname === '/plan') return 2;
    return -1;
  };

  const handleBottomNavChange = (_event: React.SyntheticEvent, newValue: number) => {
    const routes = ['/track', '/data', '/plan'];
    if (routes[newValue]) {
      router.push(routes[newValue]);
    }
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <AppBar 
        position="fixed"
        sx={{
          background: gradients.surface,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          top: 0,
          bottom: 'auto',
        }}
      >
        <Toolbar sx={{
          display: 'flex',
          minHeight: { xs: 48, sm: 64 },
          width: '100%',
          px: { xs: 1, md: 2 },
        }}>
          {isMobile ? (
            <>
              {/* Mobile top nav - Logo on left or Back button on track/[id] */}
              {isTrackDetailPage ? (
                <IconButton
                  onClick={() => router.back()}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    p: 1,
                    width: 40,
                    height: 40,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      transform: 'translateY(-1px)',
                      color: 'white'
                    },
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
              ) : (
                <Box 
                  component={Link}
                  href="/"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                    '&:hover': {
                      opacity: 0.8
                    }
                  }}
                >
                  <NextImage
                    src="/beaker_logo512.png"
                    alt="Data Gym Logo"
                    width={36}
                    height={36}
                    priority
                    unoptimized
                  />
                </Box>
              )}
              {isLoggedIn ? (
                <IconButton
                  color="inherit"
                  component={Link}
                  href="/account"
                  size="small"
                  sx={{
                    ml: 'auto',
                    borderRadius: 2,
                    p: 1,
                    width: 40,
                    height: 40,
                    background: pathname === '/account' 
                      ? gradients.glassHover
                      : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: pathname === '/account' 
                        ? gradients.glassHover
                        : 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      transform: 'translateY(-1px)',
                      color: 'white'
                    },
                    '&:focus': {
                      outline: 'none',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:focus-visible': {
                      outline: 'none',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    }
                  }}
                >
                  <AccountCircleIcon />
                </IconButton>
              ) : (
                <Box sx={{ ml: 'auto', display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box
                    component={Link}
                    href="/signin"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      transition: 'color 0.3s ease',
                      '&:hover': {
                        color: 'white',
                      }
                    }}
                  >
                    Login
                  </Box>
                  <Box
                    component={Link}
                    href="/signup"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      transition: 'color 0.3s ease',
                      '&:hover': {
                        color: 'white',
                      }
                    }}
                  >
                    Sign Up
                  </Box>
                </Box>
              )}
            </>
          ) : (
            <>
              {/* Desktop top nav - Logo and navigation items or Back button on track/[id] */}
              {isTrackDetailPage ? (
                <IconButton
                  onClick={() => router.back()}
                  size="medium"
                  sx={{
                    mr: 2,
                    borderRadius: 2,
                    p: 1.5,
                    width: 48,
                    height: 48,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      transform: 'translateY(-1px)',
                      color: 'white'
                    },
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
              ) : (
                <Box 
                  component={Link}
                  href="/"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                    mr: 4,
                    padding: 1.5,
                    '&:hover': {
                      opacity: 0.8
                    }
                  }}
                >
                  <NextImage
                    src="/beaker_logo512.png"
                    alt="Data Gym Logo"
                    width={50}
                    height={50}
                    priority
                    unoptimized
                    style={{
                      marginRight: '8px',
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: 'rgb(255, 255, 255)',
                      fontSize: '1.5rem',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    Data Gym
                  </Typography>
                </Box>
              )}
              {isLoggedIn ? (
                <>
                  <Box sx={{ 
                    display: 'flex', 
                    flex: 1, 
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 1,
                    mx: 'auto',
                    maxWidth: 'md',
                    width: '100%'
                  }}>
                    {navItems.filter(item => item.href !== '/account').map((item) => (
                      <Box
                        key={item.href}
                        component={Link}
                        href={item.href}
                        sx={{
                          mx: 1,
                          px: 3,
                          py: 2,
                          textDecoration: 'none',
                          fontWeight: 400,
                          color: 'white',
                          transition: 'color 0.3s ease',
                          '&:hover': {
                            color: '#3b82f6', // blue-500
                          }
                        }}
                      >
                        {item.text}
                      </Box>
                    ))}
                  </Box>
                  <IconButton
                    color="inherit"
                    component={Link}
                    href="/account"
                    size="medium"
                    sx={{
                      ml: 'auto',
                      borderRadius: 2,
                      p: 1.5,
                      width: 48,
                      height: 48,
                      background: pathname === '/account' 
                        ? gradients.glassHover
                        : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.9)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: pathname === '/account' 
                          ? gradients.glassHover
                          : 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        transform: 'translateY(-1px)',
                        color: 'white'
                      },
                      '&:focus': {
                        outline: 'none',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:focus-visible': {
                        outline: 'none',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      }
                    }}
                  >
                    <AccountCircleIcon />
                  </IconButton>
                </>
              ) : (
                <Box sx={{ ml: 'auto', display: 'flex', gap: 3, alignItems: 'center' }}>
                  <Box
                    component={Link}
                    href="/signin"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      textDecoration: 'none',
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      transition: 'color 0.3s ease',
                      '&:hover': {
                        color: 'white',
                      }
                    }}
                  >
                    Login
                  </Box>
                  <Box
                    component={Link}
                    href="/signup"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      textDecoration: 'none',
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      transition: 'color 0.3s ease',
                      '&:hover': {
                        color: 'white',
                      }
                    }}
                  >
                    Sign Up
                  </Box>
                </Box>
              )}
            </>
          )}
        </Toolbar>
      </AppBar>
      {/* Spacer for fixed AppBar - using div to avoid MUI Box wrapper */}
      <div style={{ minHeight: isMobile ? '0' : '80px' }} />

      {/* Bottom Navigation Bar (Mobile only) - Only show when logged in and not on track/[id] page */}
      {isMobile && isLoggedIn && !pathname.match(/^\/track\/\d+$/) && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: gradients.surface,
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 -25px 50px -12px rgba(0, 0, 0, 0.25)',
            zIndex: theme.zIndex.appBar,
          }}
          elevation={0}
        >
          <BottomNavigation
            value={getBottomNavValue()}
            onChange={handleBottomNavChange}
            showLabels
            sx={{
              background: 'transparent',
              height: 70,
              '& .MuiBottomNavigationAction-root': {
                color: 'rgba(255, 255, 255, 0.6)',
                minWidth: 0,
                padding: '6px 12px',
                '&.Mui-selected': {
                  color: '#3b82f6',
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.75rem',
                  },
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '1.5rem',
                  transition: 'font-size 0.3s ease',
                },
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.75rem',
                fontWeight: 500,
                marginTop: '4px',
                transition: 'all 0.3s ease',
                '&.Mui-selected': {
                  fontSize: '0.8rem',
                  fontWeight: 600,
                },
              },
            }}
          >
            <BottomNavigationAction
              label="Track"
              icon={<TimelineIcon />}
              sx={{
                '&.Mui-selected': {
                  color: '#3b82f6',
                },
              }}
            />
            <BottomNavigationAction
              label="Data"
              icon={<HomeIcon />}
              sx={{
                '&.Mui-selected': {
                  color: '#3b82f6',
                },
              }}
            />
            <BottomNavigationAction
              label="Plan"
              icon={<ListAltIcon />}
              sx={{
                '&.Mui-selected': {
                  color: '#3b82f6',
                },
              }}
            />
          </BottomNavigation>
        </Paper>
      )}
      {isMobile && isLoggedIn && !pathname.match(/^\/track\/\d+$/) && <Box sx={{ height: 70 }} />} {/* Spacer for fixed bottom nav on mobile */}
    </>
  );
} 
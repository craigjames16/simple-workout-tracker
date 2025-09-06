'use client';

import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
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
import { usePathname } from 'next/navigation';
import { gradients, themeColors } from '@/lib/theme-constants';
import { ResponsiveContainer } from './ResponsiveContainer';

const navItems = [
  { text: 'Track', href: '/track', icon: <TimelineIcon />, highlight: true },
  { text: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
  { text: 'Exercises', href: '/exercises', icon: <SportsGymnasticsIcon /> },
  { text: 'Plans', href: '/plans', icon: <ListAltIcon /> },
];

 export default function Navbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();

  return (
    <>
      <AppBar 
        position="fixed"
        sx={{
          background: gradients.surface,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
            <Box 
              component={Link}
              href="/"
              sx={{
                display: 'flex',
                position: 'absolute',
                alignItems: 'center',
                textDecoration: 'none',
                mr: { xs: 2, md: 4 },
                padding: 1.5,
                // top: 10,
                // left: 10,
                '&:hover': {
                  opacity: 0.8
                }
              }}
            >
              <NextImage
                src="/beaker_logo512.png"
                alt="Data Gym Logo"
                width={isMobile ? 50 : 50}
                height={isMobile ? 50 : 50}
                priority
                unoptimized
                style={{
                  marginRight: isMobile ? '4px' : '8px',
                }}
              />
              {isMobile ? null : (<Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: 'rgb(255, 255, 255)',
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}
              >
                Data Gym
              </Typography>)}
            </Box>
        <Toolbar sx={{
          minHeight: { xs: 56, sm: 64 },
          width: '100%',
          px: { xs: 1, md: 2 },
        }}>
          
          <ResponsiveContainer 
            maxWidth="md"
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            {/* Logo and App Name - Always left aligned */}
   

            {isMobile ? (
              <>
                {/* Mobile view - icons only across the top */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    flex: 1,
                    p: 2
                  }}
                >
                  {navItems.map((item) => (
                    <IconButton
                      key={item.href}
                      color="inherit"
                      component={Link}
                      href={item.href}
                      size="small"
                      sx={{
                        borderRadius: 2,
                        p: 1,
                        minWidth: 40,
                        width: 50,
                        height: 50,
                        mr: 4,
                        background: pathname === item.href 
                          ? gradients.glassHover
                          : item.highlight
                            ? gradients.glass
                            : 'rgba(255, 255, 255, 0.05)',
                        border: pathname === item.href 
                          ? '1px solid rgba(59, 130, 246, 0.3)'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.9)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          background: pathname === item.href 
                            ? gradients.glassHover
                            : 'rgba(255, 255, 255, 0.1)',
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          transform: 'translateY(-1px)',
                          color: 'white'
                        }
                      }}
                    >
                      {item.icon}
                    </IconButton>
                  ))}
                </Box>
              </>
            ) : (
              <>
                {/* Desktop view - buttons with icons and text */}
                <Box sx={{ 
                  display: 'flex', 
                  flex: 1, 
                  justifyContent: 'center',
                  p: 1,
                  mx: 'auto'
                }}>
                  {navItems.map((item) => (
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
              </>
            )}
          </ResponsiveContainer>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* Spacer for fixed AppBar */}
    </>
  );
} 
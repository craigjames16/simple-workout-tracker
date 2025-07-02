'use client';

import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import HomeIcon from '@mui/icons-material/Home';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SportsGymnasticsIcon from '@mui/icons-material/SportsGymnastics';
import ListAltIcon from '@mui/icons-material/ListAlt';
import RepeatIcon from '@mui/icons-material/Repeat';
import TimelineIcon from '@mui/icons-material/Timeline';
import ChatIcon from '@mui/icons-material/Chat';
import { usePathname } from 'next/navigation';

const navItems = [
  { text: 'Track', href: '/track', icon: <TimelineIcon />, highlight: true },
  { text: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
  { text: 'Exercises', href: '/exercises', icon: <SportsGymnasticsIcon /> },
  { text: 'Plans', href: '/plans', icon: <ListAltIcon /> },
  { text: 'Chat', href: '/chat', icon: <ChatIcon /> },
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
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <Toolbar sx={{
          minHeight: { xs: 56, sm: 64 },
          width: '100%',
          maxWidth: (theme) => theme.breakpoints.values.lg,
          mx: 'auto',
          px: { xs: 1, md: 2 },
        }}>
          {isMobile ? (
            <>
              {/* Mobile view - icons only across the top */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-around', 
                  alignItems: 'center',
                  width: '100%',
                  px: 1
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
                      width: 40,
                      height: 40,
                      background: pathname === item.href 
                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)'
                        : item.highlight
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.06) 100%)'
                          : 'rgba(255, 255, 255, 0.05)',
                      border: pathname === item.href 
                        ? '1px solid rgba(59, 130, 246, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.9)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: pathname === item.href 
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.12) 100%)'
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
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  color="inherit"
                  component={Link}
                  href={item.href}
                  startIcon={item.icon}
                  sx={{
                    mx: 1,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    background: pathname === item.href 
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)'
                      : item.highlight
                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.06) 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                    border: pathname === item.href 
                      ? '1px solid rgba(59, 130, 246, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: pathname === item.href 
                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.12) 100%)'
                        : 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      transform: 'translateY(-1px)',
                      color: 'white'
                    }
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </>
          )}
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* Spacer for fixed AppBar */}
    </>
  );
} 
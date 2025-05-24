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
import { gradients, glassMorphism, borders, borderRadius } from '@/lib/theme-constants';

const navItems = [
  { text: 'Track', href: '/track', icon: <TimelineIcon />, highlight: true },
  { text: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
  { text: 'Exercises', href: '/exercises', icon: <SportsGymnasticsIcon /> },
  { text: 'Workouts', href: '/workouts', icon: <FitnessCenterIcon /> },
  { text: 'Plans', href: '/plans', icon: <ListAltIcon /> },
  { text: 'Mesocycles', href: '/mesocycles', icon: <RepeatIcon /> },
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
          background: gradients.secondary,
          border: borders.default,
          backdropFilter: 'blur(20px)',
          boxShadow: '0px 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
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
                      borderRadius: borderRadius.medium,
                      p: 1,
                      minWidth: 40,
                      transition: 'all 0.2s ease-in-out',
                      ...(pathname === item.href && {
                        background: glassMorphism.medium,
                        border: borders.accent,
                      }),
                      ...(item.highlight && {
                        background: gradients.button,
                        '&:hover': {
                          background: gradients.buttonHover,
                          transform: 'translateY(-1px)',
                        },
                      }),
                      ...(!item.highlight && {
                        background: glassMorphism.light,
                        '&:hover': {
                          background: glassMorphism.hover,
                          transform: 'translateY(-1px)',
                        },
                      }),
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
                    px: 2,
                    py: 1,
                    borderRadius: borderRadius.medium,
                    fontWeight: 600,
                    textTransform: 'none',
                    transition: 'all 0.2s ease-in-out',
                    ...(pathname === item.href && {
                      background: glassMorphism.medium,
                      border: borders.accent,
                    }),
                    ...(item.highlight && {
                      background: gradients.button,
                      '&:hover': {
                        background: gradients.buttonHover,
                        transform: 'translateY(-1px)',
                      },
                    }),
                    ...(!item.highlight && {
                      background: glassMorphism.light,
                      '&:hover': {
                        background: glassMorphism.hover,
                        transform: 'translateY(-1px)',
                      },
                    }),
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
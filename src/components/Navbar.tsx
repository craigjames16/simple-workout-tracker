'use client';

import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SportsGymnasticsIcon from '@mui/icons-material/SportsGymnastics';
import ListAltIcon from '@mui/icons-material/ListAlt';
import RepeatIcon from '@mui/icons-material/Repeat';
import TimelineIcon from '@mui/icons-material/Timeline';
import ChatIcon from '@mui/icons-material/Chat';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

const navItems = [
  { text: 'Track', href: '/track', icon: <TimelineIcon />, highlight: true },
  { text: 'Home', href: '/', icon: <HomeIcon /> },
  { text: 'Exercises', href: '/exercises', icon: <SportsGymnasticsIcon /> },
  { text: 'Workouts', href: '/workouts', icon: <FitnessCenterIcon /> },
  { text: 'Plans', href: '/plans', icon: <ListAltIcon /> },
  { text: 'Mesocycles', href: '/mesocycles', icon: <RepeatIcon /> },
  { text: 'Chat', href: '/chat', icon: <ChatIcon /> },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const pathname = usePathname();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <List>
      {navItems.map((item) => (
        <ListItem
          key={item.href}
          component="a"
          href={item.href}
          onClick={handleDrawerToggle}
          sx={{
            color: 'inherit',
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            },
            ...(item.highlight && {
              background: 'linear-gradient(45deg, #2196F3 30%, #1565C0 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #0D47A1 90%)',
              },
              color: 'white',
            }),
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItem>
      ))}
    </List>
  );

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          {isMobile ? (
            <>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <Box sx={{ flexGrow: 1 }} />
              <Box 
                component="img"
                src="/logo.gif"
                sx={{ 
                  height: 40,
                  display: 'block'
                }}
                alt="Logo"
              />
              <Box sx={{ flexGrow: 1 }} />
            </>
          ) : (
            <>
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  color="inherit"
                  component={Link}
                  href={item.href}
                  startIcon={item.icon}
                  sx={{
                    mx: 1,
                    ...(pathname === item.href && {
                      backgroundColor: 'primary.dark',
                    }),
                    ...(item.highlight && {
                      background: 'linear-gradient(45deg, #2196F3 30%, #1565C0 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1976D2 30%, #0D47A1 90%)',
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

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
} 
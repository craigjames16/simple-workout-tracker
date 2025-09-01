'use client';

import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Chip,
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import CheckIcon from '@mui/icons-material/Check';
import { useTheme, themes } from './ThemeProvider';
import { useThemeStyles } from '@/hooks/useThemeStyles';

export function ThemeSelector() {
  const { themeName, setTheme, availableThemes } = useTheme();
  const { gradients, borders, glassMorphism, borderRadius, shadows } = useThemeStyles();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeSelect = (newTheme: string) => {
    setTheme(newTheme);
    handleClose();
  };

  // Generate preview gradient for each theme
  const getThemePreview = (themeKey: string) => {
    const theme = themes[themeKey];
    const primaryRgba = theme.primary.main.replace('rgb(', '').replace(')', '');
    const primaryDarkRgba = theme.primary.dark.replace('rgb(', '').replace(')', '');
    return `linear-gradient(135deg, rgba(${primaryRgba}, 0.8) 0%, rgba(${primaryDarkRgba}, 0.8) 100%)`;
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          background: glassMorphism.light,
          border: borders.default,
          borderRadius: borderRadius.medium,
          backdropFilter: 'blur(10px)',
          '&:hover': {
            background: glassMorphism.hover,
          },
          '&:active': {
            background: glassMorphism.active,
          },
        }}
      >
        <PaletteIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            background: gradients.glass,
            border: borders.default,
            borderRadius: borderRadius.medium,
            backdropFilter: 'blur(20px)',
            boxShadow: shadows.elevated,
            minWidth: 280,
            p: 1,
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, opacity: 0.8 }}>
          Choose Theme
        </Typography>
        
        {availableThemes.map((themeKey) => (
          <MenuItem
            key={themeKey}
            onClick={() => handleThemeSelect(themeKey)}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&:hover': {
                backgroundColor: glassMorphism.hover,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: getThemePreview(themeKey),
                  mr: 2,
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  flexShrink: 0,
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {themes[themeKey].name}
                </Typography>
              </Box>
              {themeName === themeKey && (
                <CheckIcon sx={{ color: 'rgba(34, 197, 94, 0.8)', ml: 1 }} />
              )}
            </Box>
          </MenuItem>
        ))}

        <Box sx={{ mt: 1, px: 2, py: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            Your theme preference is saved automatically
          </Typography>
        </Box>
      </Menu>
    </>
  );
}

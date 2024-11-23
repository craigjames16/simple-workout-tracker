'use client';

import { Fab, Zoom, useScrollTrigger, Box } from '@mui/material';
import { ReactNode } from 'react';

interface FloatingActionButtonProps {
  icon: ReactNode;
  onClick: () => void;
  position?: 'right' | 'left';
  show?: boolean;
}

export default function FloatingActionButton({
  icon,
  onClick,
  position = 'right',
  show = true,
}: FloatingActionButtonProps) {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  return (
    <Box
      role="presentation"
      sx={{
        position: 'fixed',
        bottom: { xs: 16, sm: 24 },
        [position]: { xs: 16, sm: 24 },
        zIndex: 1500,
      }}
    >
      <Fab
        color="primary"
        aria-label="add"
        onClick={onClick}
        sx={{
          boxShadow: 3,
          '&:hover': {
            transform: 'scale(1.1)',
          },
          transition: 'transform 0.2s',
        }}
      >
        {icon}
      </Fab>
    </Box>
  );
} 
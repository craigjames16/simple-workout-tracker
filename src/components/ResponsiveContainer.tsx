'use client';

import { Container, ContainerProps } from '@mui/material';

interface ResponsiveContainerProps extends ContainerProps {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

export const ResponsiveContainer = ({ 
  sx, 
  maxWidth = 'sm',  // Changed from 'sm' to 'lg' as default
  ...props 
}: ResponsiveContainerProps) => {

  return (
    <Container
      disableGutters
      maxWidth={maxWidth}
      sx={{
        ...sx,
        mt: { xs: 0, sm: 0, md: 0 },
        px: { xs: 0, sm: 0 },
      }}
      {...props}
    /
    >
  );
};
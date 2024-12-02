'use client';

import { Container, ContainerProps } from '@mui/material';

export const ResponsiveContainer = ({ sx, ...props }: ContainerProps) => {

  return (
    <Container
      disableGutters
      sx={{
        ...sx,
        mt: { xs: 0, sm: 2, md: 4 },
        px: { xs: 0, sm: 2 },
      }}
      {...props}
    />
  );
};
import React from 'react';
import { Box, Typography, SxProps, Theme } from '@mui/material';
import { baseCardStyles, cardHeaderStyles, cardContentStyles, headerTypographyStyles } from '@/lib/card-styles';

interface StyledCardProps {
  children: React.ReactNode;
  title?: string;
  headerContent?: React.ReactNode;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  elevation?: number;
}

export default function StyledCard({ 
  children, 
  title, 
  headerContent, 
  sx, 
  contentSx,
  elevation = 0 
}: StyledCardProps) {
  return (
    <Box
      sx={{
        ...baseCardStyles,
        mb: 3,
        ...(sx as object)
      }}
    >
      {(title || headerContent) && (
        <Box sx={cardHeaderStyles}>
          {title && (
            <Typography variant="h6" sx={headerTypographyStyles}>
              {title}
            </Typography>
          )}
          {headerContent}
        </Box>
      )}
      
      <Box 
        sx={{
          ...cardContentStyles,
          ...(contentSx as object)
        }}
      >
        {children}
      </Box>
    </Box>
  );
} 
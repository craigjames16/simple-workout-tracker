import React from 'react';
import { Box, Typography, IconButton } from '@/components';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { format } from 'date-fns';
import type { WorkoutInstanceWithRelations } from '@/types/prisma';

interface WorkoutHeaderProps {
  workoutInstance: WorkoutInstanceWithRelations;
  completedSets: number;
  totalSets: number;
  onHistoryClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMenuClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function WorkoutHeader({
  workoutInstance,
  completedSets,
  totalSets,
  onHistoryClick,
  onMenuClick
}: WorkoutHeaderProps) {
  return (
    <Box sx={{
      position: 'sticky',
      top: { xs: 72, sm: 80 },
      zIndex: 1000,
      mx: { xs: 1, sm: 2 },
      mb: 2,
    }}>
      <Box sx={{
        borderRadius: 2,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header with blue gradient background */}
        <Box sx={{
          p: { xs: 2, sm: 3 },
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  color: 'white',
                  mb: 0.5
                }}
              >
                {workoutInstance.planInstanceDays?.[0] ? (
                  `Week ${workoutInstance.planInstanceDays[0].planInstance.iterationNumber} • Day ${workoutInstance.planInstanceDays[0].planDay.dayNumber}`
                ) : (
                  workoutInstance.workout.name
                )}
              </Typography>
              
              {workoutInstance.planInstanceDays?.[0]?.planInstance?.mesocycle && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    component="a"
                    href={`/mesocycles/${workoutInstance.planInstanceDays[0].planInstance.mesocycle.id}`}
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      color: 'rgba(156, 163, 175, 0.8)',
                      fontWeight: 500,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {workoutInstance.planInstanceDays[0].planInstance.mesocycle.name} • RIR: {workoutInstance.planInstanceDays[0].planInstance.rir}
                  </Typography>
                  
                  {/* Progress bar */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Box sx={{ 
                      flex: 1, 
                      height: 6, 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ 
                        height: '100%', 
                        width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%`,
                        bgcolor: 'success.main',
                        transition: 'width 0.3s ease'
                      }} />
                    </Box>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        minWidth: 'fit-content',
                        color: 'rgba(156, 163, 175, 0.8)',
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}
                    >
                      {completedSets}/{totalSets} sets
                    </Typography>
                  </Box>
                  
                  {workoutInstance.completedAt && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'success.main', 
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    >
                      ✓ Completed: {format(new Date(workoutInstance.completedAt), 'MMM d, yyyy')}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {workoutInstance.planInstanceDays?.[0]?.planInstance.mesocycle && (
                <IconButton
                  onClick={onHistoryClick}
                  size="large"
                  sx={{ 
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(156, 163, 175, 0.8)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <CalendarMonthIcon />
                </IconButton>
              )}
              <IconButton
                onClick={onMenuClick}
                size="large"
                sx={{ 
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(156, 163, 175, 0.8)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { 
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 
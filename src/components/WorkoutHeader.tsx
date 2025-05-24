import React from 'react';
import { Box, Typography, IconButton } from '@/components';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { format } from 'date-fns';
import { trackGradient } from '@/components/ThemeRegistry';
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
      top: { xs: 56, sm: 64 },
      background: trackGradient,
      zIndex: 1000,
      borderBottom: 1,
      borderColor: 'divider',
      px: 2,
      py: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
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
                color="text.secondary"
                component="a"
                href={`/mesocycles/${workoutInstance.planInstanceDays[0].planInstance.mesocycle.id}`}
                sx={{
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
                  borderRadius: 3,
                  overflow: 'hidden'
                }}>
                  <Box sx={{ 
                    height: '100%', 
                    width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%`,
                    bgcolor: 'success.main',
                    transition: 'width 0.3s ease'
                  }} />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 'fit-content' }}>
                  {completedSets}/{totalSets} sets
                </Typography>
              </Box>
              
              {workoutInstance.completedAt && (
                <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
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
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <CalendarMonthIcon />
            </IconButton>
          )}
          <IconButton
            onClick={onMenuClick}
            size="large"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
} 
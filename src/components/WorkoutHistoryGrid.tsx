import React from 'react';
import { Box, Typography } from '@/components';
import { WorkoutHistoryView } from '@/types/workout-tracking';
import type { WorkoutInstanceWithRelations } from '@/types/prisma';
import { gradients, glassMorphism, borders, borderRadius, shadows } from '@/lib/theme-constants';

interface WorkoutHistoryGridProps {
  workoutHistory: WorkoutHistoryView[];
  currentWorkoutId: string;
  workoutInstance: WorkoutInstanceWithRelations | null;
}

export default function WorkoutHistoryGrid({
  workoutHistory,
  currentWorkoutId,
  workoutInstance
}: WorkoutHistoryGridProps) {
  const handleWorkoutClick = async (workout: any) => {
    if (workout?.workoutInstanceId && workout.workoutInstanceId !== parseInt(currentWorkoutId)) {
      // Navigate to existing workout
      window.location.href = `/track/${workout.workoutInstanceId}`;
    } else if (workout && !workout.workoutInstanceId) {
      try {
        if (workout.isRestDay) {
          // Complete rest day using planInstanceDayId
          const response = await fetch(`/api/plan-instances/${workoutInstance?.planInstanceDays?.[0]?.planInstance?.id}/days/${workout.planInstanceDayId}/complete-rest`, {
            method: 'POST',
          });

          if (!response.ok) {
            throw new Error('Failed to complete rest day');
          }

          // Refresh the page to show updated status
          window.location.reload();
        } else {
          // Start new workout using planInstanceDayId
          const response = await fetch(`/api/plan-instances/${workoutInstance?.planInstanceDays?.[0]?.planInstance?.id}/days/${workout.planInstanceDayId}/start`, {
            method: 'POST',
          });

          if (!response.ok) {
            throw new Error('Failed to start workout');
          }

          const data = await response.json();
          // Navigate to new workout
          window.location.href = `/track/${data.id}`;
        }
      } catch (error) {
        console.error('Error:', error);
        // You might want to show an error message to the user here
      }
    }
  };

  return (
    <Box sx={{ 
      p: 3, 
      width: '100%',
      background: gradients.secondary,
      border: borders.default,
      borderRadius: borderRadius.large,
      backdropFilter: 'blur(20px)',
      boxShadow: shadows.elevated,
    }}>
      <Box sx={{
        p: 2,
        mb: 3,
        background: gradients.primary,
        borderRadius: borderRadius.medium,
        border: borders.default,
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            textAlign: 'center',
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          📅 Workout History
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            textAlign: 'center', 
            mt: 0.5,
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 500
          }}
        >
          Track your progress across weeks
        </Typography>
      </Box>

      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: `repeat(${workoutHistory.length}, 70px)`,
        gap: 2,
        justifyContent: 'center'
      }}>
        {/* Header row with iteration numbers */}
        {workoutHistory.map((iteration) => (
          <Box 
            key={`header-${iteration.iterationNumber}`}
            sx={{ 
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              p: 1,
              borderRadius: borderRadius.small,
              background: iteration.iterationNumber === workoutInstance?.planInstanceDays?.[0]?.planInstance?.iterationNumber
                ? gradients.primary
                : glassMorphism.light,
              border: borders.default,
              color: iteration.iterationNumber === workoutInstance?.planInstanceDays?.[0]?.planInstance?.iterationNumber
                ? 'white'
                : 'rgba(255,255,255,0.95)',
              textShadow: iteration.iterationNumber === workoutInstance?.planInstanceDays?.[0]?.planInstance?.iterationNumber
                ? '0 1px 2px rgba(0,0,0,0.3)'
                : '0 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            Week {iteration.iterationNumber} 
          </Box>
        ))}

        {/* Generate grid cells for each day */}
        {Array.from({ length: Math.max(...workoutHistory.map(i => 
          Math.max(...i.workouts.map(w => w.dayNumber))
        )) }).map((_, dayIndex) => (
          workoutHistory.map((iteration) => {
            const workout = iteration.workouts.find(w => w.dayNumber === dayIndex + 1);
            const isCurrentWorkout = workout?.workoutInstanceId === parseInt(currentWorkoutId);
            const isCompleted = workout?.completedAt || workout?.isCompleted;
            
            return (
              <Box
                key={`${iteration.iterationNumber}-${dayIndex + 1}`}
                sx={{
                  width: 70,
                  height: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: borderRadius.medium,
                  cursor: workout ? 'pointer' : 'default',
                  border: borders.default,
                  background: isCurrentWorkout
                    ? gradients.primary
                    : workout?.isRestDay
                      ? isCompleted
                        ? gradients.success
                        : gradients.warning
                      : isCompleted
                        ? gradients.success
                        : workout
                          ? glassMorphism.light
                          : glassMorphism.disabled,
                  backdropFilter: 'blur(10px)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': workout ? {
                    background: isCurrentWorkout
                      ? gradients.primary
                      : glassMorphism.hover,
                    transform: 'translateY(-2px)',
                    boxShadow: shadows.glass,
                  } : {}
                }}
                onClick={() => handleWorkoutClick(workout)}
              >
                {workout ? (
                  <>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.8 }}>
                      {workout.isRestDay ? 'Rest' : `Day ${dayIndex + 1}`}
                    </Typography>
                    {isCompleted && (
                      <Typography sx={{ fontSize: '1rem' }}>
                        {workout.isRestDay ? '😴' : '✅'}
                      </Typography>
                    )}
                  </>
                ) : null}
              </Box>
            );
          })
        ))}
      </Box>
    </Box>
  );
} 
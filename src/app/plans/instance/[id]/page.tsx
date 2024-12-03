'use client';

import { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  LinearProgress,
  Divider,
  ResponsiveContainer
} from '@/components';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import Link from 'next/link';
import LaunchIcon from '@mui/icons-material/Launch';
import type { PlanInstanceWithCompletion } from '@/types/prisma';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';

export default function PlanInstanceDetail({ params }: { params: { id: string } }) {
  const [planInstance, setPlanInstance] = useState<PlanInstanceWithCompletion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlanInstance = async () => {
      try {
        const response = await fetch(`/api/plan-instances/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch plan instance');
        }
        const data = await response.json() as PlanInstanceWithCompletion;
        setPlanInstance(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanInstance();
  }, [params.id]);

  const calculateProgress = () => {
    if (!planInstance) return 0;
    const completedDays = planInstance.days.filter(day => 
      day.planDay.isRestDay ? day.isComplete : day.workoutInstance?.completedAt != null
    ).length;
    return (completedDays / planInstance.days.length) * 100;
  };

  const handleCompleteRestDay = async (dayId: number) => {
    try {
      const response = await fetch(
        `/api/plan-instances/${params.id}/days/${dayId}/complete-rest`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to complete rest day');
      }

      // Refresh the page data
      const updatedPlanInstance = await fetch(`/api/plan-instances/${params.id}`);
      const data = await updatedPlanInstance.json();
      setPlanInstance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleStartWorkout = async (dayId: number) => {
    try {
      // Create the workout instance
      const response = await fetch(
        `/api/plan-instances/${params.id}/days/${dayId}/start`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to start workout');
      }

      const workoutInstance = await response.json();

      // Redirect to the track page with the new workout instance
      window.location.href = `/track/${workoutInstance.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getStatusIcon = (day: any) => {
    if (day.planDay.isRestDay && !day.isComplete) {
      return <PlayCircleOutlineIcon color="action" />;
    } else if (!day.planDay.isRestDay && !day.workoutInstance) {
      return <PlayCircleOutlineIcon color="action" />;
    } else if (!day.planDay.isRestDay && !day.workoutInstance?.completedAt) {
      return <PlayCircleIcon color="primary" />;
    } else {
      return <CheckCircleIcon color="success" />;
    }
  };

  if (loading) {
    return (
      <ResponsiveContainer maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </ResponsiveContainer>
    );
  }

  if (error || !planInstance) {
    return (
      <ResponsiveContainer maxWidth="md" sx={{ mt: 4 }}>
        <Typography color="error">{error || 'Plan instance not found'}</Typography>
      </ResponsiveContainer>
    );
  }

  const progress = calculateProgress();

  return (
    <ResponsiveContainer>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5">
            {planInstance.plan.name}
          </Typography>

          {planInstance.mesocycle && (
            <Box sx={{ mb: 2 }}>
              <Box 
                component={Link}
                href={`/mesocycles/${planInstance.mesocycle.id}`}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                <Typography variant="subtitle1" sx={{ mr: 1 }}>
                  {planInstance.mesocycle.name}
                </Typography>
                <LaunchIcon fontSize="small" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Iteration {planInstance.iterationNumber} of {planInstance.mesocycle.iterations}
              </Typography>
              {planInstance.rir !== undefined && (
                <Typography variant="body2" color="text.secondary">
                  Target RIR: {planInstance.rir}
                </Typography>
              )}
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress: {Math.round(progress)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {planInstance.days.filter(day => 
                  day.planDay.isRestDay ? day.isComplete : day.workoutInstance?.completedAt != null
                ).length} / {planInstance.days.length} days completed
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 8,
                borderRadius: 4,
                backgroundColor: 'grey.300',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                }
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              Started: {new Date(planInstance.startedAt).toLocaleDateString()}
            </Typography>
            {planInstance.completedAt && (
              <Typography variant="body2" color="text.secondary">
                Completed: {new Date(planInstance.completedAt).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {planInstance.days
            .sort((a, b) => a.planDay.dayNumber - b.planDay.dayNumber)
            .map((day) => {
              const isComplete = day.planDay.isRestDay ? day.isComplete : day.workoutInstance?.completedAt;
              const isInProgress = !isComplete && day.workoutInstance && !day.workoutInstance.completedAt;
              
              let href = '';
              let onClick = undefined;
              
              if (day.planDay.isRestDay && !day.isComplete) {
                onClick = () => handleCompleteRestDay(day.id);
              } else if (!day.planDay.isRestDay &&!day.workoutInstance) {
                onClick = () => handleStartWorkout(day.id);
              } else if (!day.planDay.isRestDay && !day.workoutInstance?.completedAt) {
                href = `/track/${day.workoutInstance?.id}`;
              }

              return (
                <Card
                  key={day.id}
                  component={href ? Link : 'div'}
                  href={href}
                  onClick={onClick}
                  sx={{ 
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { sm: 'center' },
                    p: 2,
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s',
                    ...(href || onClick ? {
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3,
                        backgroundColor: 'action.hover'
                      }
                    } : {})
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    flex: 1,
                    gap: 2,
                  }}>
                    {getStatusIcon(day)}
                    <Box>
                      <Typography variant="h6" sx={{ mb: 0.5 }}>
                        Day {day.planDay.dayNumber}
                      </Typography>
                      {day.planDay.isRestDay ? (
                        <Typography color="text.secondary">
                          Rest Day
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FitnessCenterIcon sx={{ fontSize: '1rem' }} />
                          <Typography color="text.secondary">
                            {day.planDay.workout?.name}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  {href && (
                    <Typography 
                      variant="body2" 
                      color="primary"
                      sx={{ 
                        mt: { xs: 2, sm: 0 },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      {day.planDay.isRestDay ? 'Complete Rest Day' : 
                        isInProgress ? 'Continue Workout' : 'Start Workout'} →
                    </Typography>
                  )}
                </Card>
              );
            })}
        </Box>

        {planInstance.status === 'COMPLETE' && (
          <Alert severity="success" sx={{ mt: 3 }}>
            Plan completed! Great job!
          </Alert>
        )}
      </Paper>
    </ResponsiveContainer>
  );
} 
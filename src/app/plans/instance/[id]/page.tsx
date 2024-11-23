'use client';

import { useEffect, useState } from 'react';
import {
  Container,
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
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import Link from 'next/link';
import LaunchIcon from '@mui/icons-material/Launch';
import type { PlanInstanceWithCompletion } from '@/types/prisma';

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

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !planInstance) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error">{error || 'Plan instance not found'}</Typography>
      </Container>
    );
  }

  const progress = calculateProgress();

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
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
                  Part of Mesocycle: {planInstance.mesocycle.name}
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

        <Grid container spacing={2}>
          {planInstance.days
            .sort((a, b) => a.planDay.dayNumber - b.planDay.dayNumber)
            .map((day) => (
            <Grid item xs={12} sm={6} md={4} key={day.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Day {day.planDay.dayNumber}
                    </Typography>
                    {(day.isComplete || day.workoutInstance?.completedAt) && (
                      <CheckCircleIcon color="success" />
                    )}
                  </Box>

                  {day.planDay.isRestDay ? (
                    <>
                      <Typography color="text.secondary" gutterBottom>
                        Rest Day
                      </Typography>
                      <Box sx={{ flex: 1 }} />
                      {!day.isComplete && (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<CheckCircleIcon />}
                          fullWidth
                          sx={{ mt: 2 }}
                          onClick={() => handleCompleteRestDay(day.id)}
                        >
                          Complete Rest Day
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <FitnessCenterIcon sx={{ mr: 1 }} />
                        <Typography color="text.secondary">
                          {day.planDay.workout?.name}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }} />
                      {!day.workoutInstance && (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<PlayArrowIcon />}
                          fullWidth
                          sx={{ mt: 2 }}
                          onClick={() => handleStartWorkout(day.id)}
                        >
                          Start Workout
                        </Button>
                      )}
                      {day.workoutInstance && !day.workoutInstance.completedAt && (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<ArrowForwardIcon />}
                          fullWidth
                          sx={{ mt: 2 }}
                          component={Link}
                          href={`/track/${day.workoutInstance.id}`}
                        >
                          Continue Workout
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {planInstance.status === 'COMPLETE' && (
          <Alert severity="success" sx={{ mt: 3 }}>
            Plan completed! Great job!
          </Alert>
        )}
      </Paper>
    </Container>
  );
} 
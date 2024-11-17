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
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';

interface Exercise {
  id: number;
  name: string;
}

interface WorkoutExercise {
  exercise: Exercise;
}

interface Workout {
  id: number;
  name: string;
  exercises: WorkoutExercise[];
}

interface WorkoutInstance {
  id: number;
  completedAt: string | null;
}

interface PlanDay {
  id: number;
  dayNumber: number;
  isRestDay: boolean;
  workout: Workout | null;
}

interface PlanInstanceDay {
  id: number;
  planDay: PlanDay;
  workoutInstance: WorkoutInstance | null;
  isComplete: boolean;
}

interface PlanInstance {
  id: number;
  plan: {
    name: string;
  };
  status: string | null;
  startedAt: string;
  completedAt: string | null;
  days: PlanInstanceDay[];
}

export default function PlanInstanceDetail({ params }: { params: { id: string } }) {
  const [planInstance, setPlanInstance] = useState<PlanInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlanInstance();
  }, []);

  const fetchPlanInstance = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/plan-instances/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch plan instance');
      }

      const data = await response.json();
      setPlanInstance(data);
    } catch (error) {
      console.error('Error fetching plan instance:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch plan instance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartWorkout = async (dayId: number) => {
    try {
      const response = await fetch(`/api/plan-instances/${params.id}/days/${dayId}/start-workout`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start workout');
      }

      const data = await response.json();
      window.location.href = `/track/${data.workoutInstance.id}`;
    } catch (error) {
      console.error('Error starting workout:', error);
      setError(error instanceof Error ? error.message : 'Failed to start workout');
    }
  };

  const handleCompleteRestDay = async (dayId: number) => {
    try {
      const response = await fetch(`/api/plan-instances/${params.id}/days/${dayId}/complete-rest`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to complete rest day');
      }

      // Refresh the plan instance data
      fetchPlanInstance();
    } catch (error) {
      console.error('Error completing rest day:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete rest day');
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Paper sx={{ p: 3, mt: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Paper>
      </Container>
    );
  }

  if (!planInstance) {
    return (
      <Container maxWidth="lg">
        <Paper sx={{ p: 3, mt: 3 }}>
          <Alert severity="error">Plan instance not found</Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="h4" gutterBottom>
          {planInstance.plan.name}
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Started: {new Date(planInstance.startedAt).toLocaleDateString()}
        </Typography>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {planInstance.days.map((day) => (
            <Grid item xs={12} sm={6} md={4} key={day.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Day {day.planDay.dayNumber}
                  </Typography>
                  
                  {day.planDay.isRestDay ? (
                    <>
                      <Typography color="text.secondary" gutterBottom>
                        Rest Day
                      </Typography>
                      {!day.isComplete && planInstance.status === 'IN_PROGRESS' && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleCompleteRestDay(day.id)}
                          sx={{ mt: 1 }}
                        >
                          Complete Rest Day
                        </Button>
                      )}
                      {day.isComplete && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <CheckCircleIcon color="success" />
                          <Typography variant="body2" color="success.main">
                            Completed
                          </Typography>
                        </Box>
                      )}
                    </>
                  ) : (
                    <>
                      <Typography color="text.secondary" gutterBottom>
                        {day.planDay.workout?.name}
                      </Typography>
                      {!day.isComplete && planInstance.status === 'IN_PROGRESS' && (
                        day.workoutInstance && !day.workoutInstance.completedAt ? (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ArrowForwardIcon />}
                            component={Link}
                            href={`/track/${day.workoutInstance.id}`}
                            sx={{ mt: 1 }}
                          >
                            Go To Workout
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => handleStartWorkout(day.id)}
                            sx={{ mt: 1 }}
                          >
                            Start Workout
                          </Button>
                        )
                      )}
                      {day.workoutInstance?.completedAt && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <CheckCircleIcon color="success" />
                          <Typography variant="body2" color="success.main">
                            Completed
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
} 
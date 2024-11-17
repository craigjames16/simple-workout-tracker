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
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
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

interface PlanDay {
  id: number;
  dayNumber: number;
  isRestDay: boolean;
  workout: Workout | null;
}

interface PlanInstance {
  id: number;
  status: string | null;
  startedAt: string;
  completedAt: string | null;
  days: PlanInstanceDay[];
}

interface Plan {
  id: number;
  name: string;
  days: PlanDay[];
  createdAt: string;
  instances: PlanInstance[];
}

export default function PlanDetail({ params }: { params: { id: string } }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlanAndInstances();
  }, []);

  const fetchPlanAndInstances = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/plans/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch plan data');
      }

      const data = await response.json();
      setPlan(data);
    } catch (error) {
      console.error('Error fetching plan data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch plan data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartPlan = async () => {
    try {
      const response = await fetch('/api/plan-instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: params.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to start plan');
      }

      const data = await response.json();
      window.location.href = `/plans/instance/${data.id}`;
    } catch (error) {
      console.error('Error starting plan:', error);
      setError(error instanceof Error ? error.message : 'Failed to start plan');
    }
  };

  const getActivePlanInstance = (plan: Plan): PlanInstance | undefined => {
    return plan.instances?.find(instance => instance.status === 'IN_PROGRESS');
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

  if (!plan) {
    return (
      <Container maxWidth="lg">
        <Paper sx={{ p: 3, mt: 3 }}>
          <Alert severity="error">Plan not found</Alert>
        </Paper>
      </Container>
    );
  }

  const activePlanInstance = getActivePlanInstance(plan);

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">{plan.name}</Typography>
          {activePlanInstance ? (
            <Button
              variant="contained"
              color="primary"
              component={Link}
              href={`/plans/instance/${activePlanInstance.id}`}
              startIcon={<PlayArrowIcon />}
            >
              Continue Plan
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartPlan}
              startIcon={<AddIcon />}
            >
              Start Plan
            </Button>
          )}
        </Box>

        <Grid container spacing={2}>
          {plan.days.map((day) => (
            <Grid item xs={12} sm={6} md={4} key={day.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Day {day.dayNumber}
                  </Typography>
                  
                  {day.isRestDay ? (
                    <Typography color="text.secondary">Rest Day</Typography>
                  ) : (
                    <>
                      <Typography color="text.secondary" gutterBottom>
                        {day.workout?.name}
                      </Typography>
                      {day.workout && (
                        <Typography variant="body2" color="text.secondary">
                          {day.workout.exercises.length} exercises
                        </Typography>
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
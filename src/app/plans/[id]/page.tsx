'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
} from '@mui/material';
import Link from 'next/link';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';

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

interface WorkoutInstance {
  id: number;
  completedAt: string | null;
}

interface PlanInstanceDay {
  id: number;
  planDay: PlanDay;
  workoutInstance: WorkoutInstance | null;
  isComplete: boolean;
}

interface PlanInstance {
  id: number;
  status: string | null;
  startedAt: string;
  completedAt: string | null;
  days: PlanInstanceDay[];
  iterationNumber?: number;
  rir?: number;
  mesocycle?: {
    id: number;
    name: string;
  };
}

interface Plan {
  id: number;
  name: string;
  days: PlanDay[];
  instances: PlanInstance[];
}

export default function PlanDetail({ params }: { params: { id: string } }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const response = await fetch(`/api/plans/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch plan');
        }
        const data = await response.json();
        setPlan(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [params.id]);

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !plan) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error">{error || 'Plan not found'}</Typography>
      </Container>
    );
  }

  return (
    <ResponsiveContainer maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            {plan.name}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            href={`/plans/instance/${plan.id}`}
            disabled={plan.instances.some(i => i.status === 'IN_PROGRESS')}
          >
            Start Plan
          </Button>
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
    </ResponsiveContainer>
  );
} 
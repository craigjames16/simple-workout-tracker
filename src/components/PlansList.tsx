'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
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
}

interface Plan {
  id: number;
  name: string;
  days: PlanDay[];
  createdAt: string;
  instances: PlanInstance[];
}

export default function PlansList() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/plans', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }

      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch plans');
    } finally {
      setIsLoading(false);
    }
  };

  const getActivePlanInstance = (plan: Plan): PlanInstance | undefined => {
    console.log("GET ACTIVE PLAN INSTANCE")
    return plan.instances?.find(instance => instance.status === 'IN_PROGRESS');
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Paper sx={{ p: 3, mt: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Paper sx={{ p: 3, mt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Workout Plans</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            href="/plans/create"
          >
            Create New Plan
          </Button>
        </Box>

        <Grid container spacing={3}>
          {plans.map((plan) => {
            console.log(plan.instances, plan)
            const activePlanInstance = plan.instances ? getActivePlanInstance(plan) : undefined;
            
            return (
              <Grid item xs={12} md={6} lg={4} key={plan.id}>
                <Card>
                  <CardHeader
                    title={plan.name}
                    subheader={`Created: ${new Date(plan.createdAt).toLocaleDateString()}`}
                    action={
                      activePlanInstance ? (
                        <Button
                          variant="contained"
                          color="primary"
                          component={Link}
                          href={`/plans/instance/${activePlanInstance.id}`}
                          startIcon={<PlayArrowIcon />}
                        >
                          Continue Plan
                        </Button>
                      ) : null
                    }
                  />
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {plan.days.length} Days
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <List dense>
                      {plan.days.map((day) => (
                        <ListItem key={day.id}>
                          <ListItemText
                            primary={`Day ${day.dayNumber}: ${day.isRestDay ? 'Rest Day' : day.workout?.name}`}
                            secondary={
                              !day.isRestDay && day.workout && (
                                <Typography variant="body2" color="text.secondary">
                                  {day.workout.exercises.length} exercises
                                </Typography>
                              )
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {plans.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No workout plans created yet.
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
} 
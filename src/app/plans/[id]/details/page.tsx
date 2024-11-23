'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

interface Exercise {
  exercise: {
    name: string;
  };
}

interface Workout {
  name: string;
  exercises: Exercise[];
}

interface PlanDay {
  id: number;
  dayNumber: number;
  isRestDay: boolean;
  workout: Workout | null;
}

interface Plan {
  id: number;
  name: string;
  days: PlanDay[];
  createdAt: string;
}

export default function PlanDetails({ params }: { params: { id: string } }) {
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
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {plan.name}
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Typography color="text.secondary" gutterBottom>
            Created: {new Date(plan.createdAt).toLocaleDateString()}
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            Total Days: {plan.days.length}
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            Workout Days: {plan.days.filter(day => !day.isRestDay).length}
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            Rest Days: {plan.days.filter(day => day.isRestDay).length}
          </Typography>
        </Box>

        <Typography variant="h5" gutterBottom>
          Training Schedule
        </Typography>

        <Grid container spacing={2}>
          {plan.days
            .sort((a, b) => a.dayNumber - b.dayNumber)
            .map((day) => (
              <Grid item xs={12} sm={6} md={4} key={day.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Day {day.dayNumber}
                    </Typography>
                    
                    {day.isRestDay ? (
                      <Typography color="text.secondary">
                        Rest Day
                      </Typography>
                    ) : day.workout ? (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <FitnessCenterIcon sx={{ mr: 1 }} />
                          <Typography variant="subtitle1">
                            {day.workout.name}
                          </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <List dense disablePadding>
                          {day.workout.exercises.map((ex, index) => (
                            <ListItem key={index} disableGutters>
                              <ListItemText 
                                primary={ex.exercise.name}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  color: 'text.secondary'
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    ) : (
                      <Typography color="error">
                        No workout assigned
                      </Typography>
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
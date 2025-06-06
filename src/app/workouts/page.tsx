'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Chip,
  Box,
  Divider,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ResponsiveContainer } from '@/components';

interface WorkoutInstance {
  id: number;
  workoutExercises: Array<{
    exercise: {
      name: string;
    };
  }>;
  workout: {
    name: string;
  };
  startedAt: string;
  completedAt: string | null;
  exerciseSets: Array<{
    exercise: {
      name: string;
    };
    reps: number;
    weight: number;
  }>;
  planInstanceDay: Array<{
    planInstance: {
      plan: {
        name: string;
      };
      mesocycle?: {
        name: string;
        id: number;
      };
      iterationNumber?: number;
      rir?: number;
    };
  }>;
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<WorkoutInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const response = await fetch('/api/workout-instances');
        if (!response.ok) {
          throw new Error('Failed to fetch workouts');
        }
        const data = await response.json();
        setWorkouts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch workouts');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  const handleWorkoutClick = (workoutId: number) => {
    router.push(`/track/${workoutId}`);
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <ResponsiveContainer>
      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5">Workout History</Typography>
        </Box>
        
        <List sx={{ p: 0 }}>
          {workouts.map((workout, index) => (
            <Box key={workout.id}>
              <ListItem
                onClick={() => handleWorkoutClick(workout.id)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FitnessCenterIcon color="action" />
                      <Typography variant="subtitle1">
                        {workout.workout.name}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" component="span">
                        {workout.completedAt && format(new Date(workout.completedAt), 'MMM d, yyyy h:mm a')}
                      </Typography>
                      {workout.planInstanceDay?.[0]?.planInstance && (
                        <Typography variant="body2" color="text.secondary" component="div">
                          Plan: {workout.planInstanceDay[0].planInstance.plan.name}
                          {workout.planInstanceDay[0].planInstance.mesocycle && 
                            ` (${workout.planInstanceDay[0].planInstance.mesocycle.name})`}
                        </Typography>
                      )}
                      <Typography component="div" variant="body2" color="text.secondary">
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {workout.exerciseSets.length > 0 && (
                            <Chip
                              size="small"
                              label={`${workout.exerciseSets.length} sets`}
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          {workout.completedAt ? (
                            <Chip
                              size="small"
                              icon={<CheckCircleIcon />}
                              label="Completed"
                              color="success"
                              variant="outlined"
                            />
                          ) : (
                            <Chip
                              size="small"
                              label="In Progress"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleWorkoutClick(workout.id)}>
                    <ArrowForwardIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              {index < workouts.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Paper>
    </ResponsiveContainer>
  );
} 
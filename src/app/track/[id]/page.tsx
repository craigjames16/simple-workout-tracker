'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  Alert,
  CircularProgress,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';

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
  startedAt: string;
  completedAt: string | null;
  workout: Workout;
}

interface ExerciseSet {
  id?: number;
  weight: string;
  reps: string;
}

interface ExerciseTracking {
  exerciseId: number;
  sets: ExerciseSet[];
  isCompleted?: boolean;
}

export default function TrackWorkout({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [workoutInstance, setWorkoutInstance] = useState<WorkoutInstance | null>(null);
  const [exerciseTrackings, setExerciseTrackings] = useState<ExerciseTracking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWorkoutInstance();
  }, []);

  useEffect(() => {
    if (workoutInstance) {
      // Initialize exercise trackings with existing sets or 3 empty sets
      const initialTrackings = workoutInstance.workout.exercises.map(ex => {
        const existingSets = workoutInstance.sets
          .filter(set => set.exerciseId === ex.exercise.id)
          .sort((a, b) => a.setNumber - b.setNumber)
          .map(set => ({
            id: set.id,
            weight: set.weight.toString(),
            reps: set.reps.toString()
          }));

        return {
          exerciseId: ex.exercise.id,
          sets: existingSets.length > 0 ? existingSets : Array(3).fill({ weight: '', reps: '' }),
          isCompleted: existingSets.length > 0
        };
      });
      setExerciseTrackings(initialTrackings);
    }
  }, [workoutInstance]);

  const fetchWorkoutInstance = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/workout-instances/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch workout instance');
      }

      setWorkoutInstance(data);
    } catch (error) {
      console.error('Error fetching workout instance:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch workout instance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetUpdate = (exerciseId: number, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setExerciseTrackings(prev => prev.map(tracking => {
      if (tracking.exerciseId === exerciseId) {
        const newSets = [...tracking.sets];
        newSets[setIndex] = {
          ...newSets[setIndex],
          [field]: value
        };
        return { ...tracking, sets: newSets };
      }
      return tracking;
    }));
  };

  const handleAddSet = (exerciseId: number) => {
    setExerciseTrackings(prev => prev.map(tracking => {
      if (tracking.exerciseId === exerciseId) {
        return {
          ...tracking,
          sets: [...tracking.sets, { weight: '', reps: '' }]
        };
      }
      return tracking;
    }));
  };

  const handleRemoveSet = (exerciseId: number, setIndex: number) => {
    setExerciseTrackings(prev => prev.map(tracking => {
      if (tracking.exerciseId === exerciseId) {
        const newSets = tracking.sets.filter((_, index) => index !== setIndex);
        return { ...tracking, sets: newSets };
      }
      return tracking;
    }));
  };

  const handleCompleteExercise = async (exerciseId: number) => {
    const tracking = exerciseTrackings.find(t => t.exerciseId === exerciseId);
    if (!tracking) return;

    try {
      const response = await fetch(`/api/workout-instances/${params.id}/sets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId,
          sets: tracking.sets.filter(set => set.weight && set.reps)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save exercise sets');
      }

      // Mark exercise as completed
      setExerciseTrackings(prev => prev.map(t => 
        t.exerciseId === exerciseId ? { ...t, isCompleted: true } : t
      ));
    } catch (error) {
      console.error('Error saving exercise sets:', error);
      setError(error instanceof Error ? error.message : 'Failed to save exercise sets');
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      const response = await fetch(`/api/workout-instances/${params.id}/complete`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to complete workout');
      }

      // Redirect to plans page after completion
      router.push('/plans');
    } catch (error) {
      console.error('Error completing workout:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete workout');
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

  if (!workoutInstance) {
    return (
      <Container maxWidth="lg">
        <Paper sx={{ p: 3, mt: 3 }}>
          <Alert severity="error">Workout not found</Alert>
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
          {workoutInstance.workout.name}
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Started: {new Date(workoutInstance.startedAt).toLocaleString()}
        </Typography>

        <List>
          {workoutInstance.workout.exercises.map((exerciseItem) => {
            const tracking = exerciseTrackings.find(t => t.exerciseId === exerciseItem.exercise.id);
            if (!tracking) return null;

            return (
              <ListItem
                key={exerciseItem.exercise.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: 2,
                  py: 2,
                }}
              >
                <Card variant="outlined" sx={{ width: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        {exerciseItem.exercise.name}
                      </Typography>
                      <Button
                        variant="contained"
                        color={tracking.isCompleted ? "success" : "primary"}
                        onClick={() => handleCompleteExercise(exerciseItem.exercise.id)}
                        disabled={tracking.isCompleted}
                      >
                        {tracking.isCompleted ? "Completed" : "Complete Exercise"}
                      </Button>
                    </Box>
                    
                    {tracking.sets.map((set, setIndex) => (
                      <Grid container spacing={2} key={setIndex} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={1}>
                          <Typography variant="body1" sx={{ mt: 1 }}>
                            Set {setIndex + 1}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Weight (kg)"
                            type="number"
                            size="small"
                            value={set.weight}
                            onChange={(e) => handleSetUpdate(exerciseItem.exercise.id, setIndex, 'weight', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Reps"
                            type="number"
                            size="small"
                            value={set.reps}
                            onChange={(e) => handleSetUpdate(exerciseItem.exercise.id, setIndex, 'reps', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <IconButton 
                            color="error" 
                            onClick={() => handleRemoveSet(exerciseItem.exercise.id, setIndex)}
                            disabled={tracking.sets.length <= 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    ))}
                    
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => handleAddSet(exerciseItem.exercise.id)}
                      sx={{ mt: 1 }}
                    >
                      Add Set
                    </Button>
                  </CardContent>
                </Card>
              </ListItem>
            );
          })}
        </List>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleCompleteWorkout}
            disabled={!exerciseTrackings.every(t => t.isCompleted)}
          >
            Complete Workout
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  Box,
  IconButton,
  Grid,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { WorkoutInstanceWithRelations } from '@/types/prisma';

interface ExerciseTracking {
  exerciseId: number;
  exerciseName: string;
  sets: Array<{
    reps: number;
    weight: number;
  }>;
  isCompleted: boolean;
}

interface ExerciseSet {
  exerciseId: number;
  reps: number;
  weight: number;
  setNumber: number;
}

interface WorkoutExercise {
  exercise: {
    id: number;
    name: string;
  };
}

export default function TrackWorkout({ params }: { params: { id: string } }) {
  const [workoutInstance, setWorkoutInstance] = useState<WorkoutInstanceWithRelations | null>(null);
  const [exerciseTrackings, setExerciseTrackings] = useState<ExerciseTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const response = await fetch(`/api/workout-instances/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch workout');
        }
        const data = await response.json() as WorkoutInstanceWithRelations;
        setWorkoutInstance(data);

        // Initialize exercise trackings with existing sets or 3 empty sets
        const initialTrackings = data.workout.exercises.map((ex: WorkoutExercise) => {
          const existingSets = data.sets
            .filter((set: ExerciseSet) => set.exerciseId === ex.exercise.id)
            .sort((a: ExerciseSet, b: ExerciseSet) => a.setNumber - b.setNumber)
            .map((set: ExerciseSet) => ({
              reps: set.reps,
              weight: set.weight,
            }));

          return {
            exerciseId: ex.exercise.id,
            exerciseName: ex.exercise.name,
            sets: existingSets.length > 0 ? existingSets : Array(3).fill({ reps: 0, weight: 0 }),
            isCompleted: existingSets.length > 0,
          };
        });

        setExerciseTrackings(initialTrackings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [params.id]);

  const handleUpdateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setExerciseTrackings(prev => {
      const updated = [...prev];
      updated[exerciseIndex] = {
        ...updated[exerciseIndex],
        sets: updated[exerciseIndex].sets.map((set, idx) =>
          idx === setIndex ? { ...set, [field]: value } : set
        ),
      };
      return updated;
    });
  };

  const handleAddSet = (exerciseIndex: number) => {
    setExerciseTrackings(prev => {
      const updated = [...prev];
      updated[exerciseIndex].sets.push({ reps: 0, weight: 0 });
      return updated;
    });
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setExerciseTrackings(prev => {
      const updated = [...prev];
      updated[exerciseIndex].sets.splice(setIndex, 1);
      return updated;
    });
  };

  const handleCompleteWorkout = async () => {
    try {
      // First save all the sets
      for (const tracking of exerciseTrackings) {
        await fetch(`/api/workout-instances/${params.id}/sets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            exerciseId: tracking.exerciseId,
            sets: tracking.sets,
          }),
        });
      }

      // Then complete the workout
      const response = await fetch(`/api/workout-instances/${params.id}/complete`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to complete workout');
      }

      // Redirect or show success message
      window.location.href = '/plans';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete workout');
    }
  };

  const handleCompleteExercise = (exerciseIndex: number) => {
    setExerciseTrackings(prev => {
      const updated = [...prev];
      updated[exerciseIndex] = {
        ...updated[exerciseIndex],
        isCompleted: true
      };
      return updated;
    });
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !workoutInstance) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error">{error || 'Workout not found'}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {workoutInstance.workout.name}
        </Typography>

        <List>
          {exerciseTrackings.map((exercise, exerciseIndex) => (
            <ListItem
              key={exercise.exerciseId}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                mb: 2,
              }}
            >
              <Box sx={{ width: '100%', mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">{exercise.exerciseName}</Typography>
                  {!exercise.isCompleted && exercise.sets.length > 0 && (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleCompleteExercise(exerciseIndex)}
                    >
                      Complete Exercise
                    </Button>
                  )}
                  {exercise.isCompleted && (
                    <Typography color="success.main">✓ Completed</Typography>
                  )}
                </Box>
                
                {exercise.sets.map((set, setIndex) => (
                  <Grid container spacing={2} key={setIndex} sx={{ mt: 1 }}>
                    <Grid item xs={4}>
                      <TextField
                        label="Reps"
                        type="number"
                        value={set.reps}
                        onChange={(e) => handleUpdateSet(
                          exerciseIndex,
                          setIndex,
                          'reps',
                          parseInt(e.target.value)
                        )}
                        size="small"
                        disabled={exercise.isCompleted}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="Weight (kg)"
                        type="number"
                        value={set.weight}
                        onChange={(e) => handleUpdateSet(
                          exerciseIndex,
                          setIndex,
                          'weight',
                          parseInt(e.target.value)
                        )}
                        size="small"
                        disabled={exercise.isCompleted}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <IconButton
                        onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                        color="error"
                        disabled={exercise.isCompleted}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}

                <Button
                  startIcon={<AddIcon />}
                  onClick={() => handleAddSet(exerciseIndex)}
                  sx={{ mt: 1 }}
                  disabled={exercise.isCompleted}
                >
                  Add Set
                </Button>
              </Box>
            </ListItem>
          ))}
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
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
  InputAdornment,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { WorkoutInstanceWithRelations } from '@/types/prisma';

interface ExerciseTracking {
  exerciseId: number;
  exerciseName: string;
  lastCompletedSets: {
    [setNumber: number]: {
      weight: number;
      reps: number;
    };
  };
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
    const fetchWorkoutInstance = async () => {
      try {
        const response = await fetch(`/api/workout-instances/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch workout');
        }
        const data = await response.json();
        setWorkoutInstance(data);

        // Initialize exercise trackings with last completed set data and 3 default sets
        const initialTrackings = data.workout.exercises.map((ex: any) => ({
          exerciseId: ex.exercise.id,
          exerciseName: ex.exercise.name,
          lastCompletedSets: ex.exercise.sets.reduce((acc: any, set: any) => {
            acc[set.setNumber] = {
              weight: set.weight,
              reps: set.reps
            };
            return acc;
          }, {}),
          sets: Array(3).fill({ reps: 0, weight: 0 }), // Initialize with 3 empty sets
          isCompleted: false,
        }));
        setExerciseTrackings(initialTrackings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch workout');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutInstance();
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
      updated[exerciseIndex] = {
        ...updated[exerciseIndex],
        sets: [...updated[exerciseIndex].sets, { reps: 0, weight: 0 }]
      };
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

      const data = await response.json();

      // If this workout is part of a plan instance, redirect there
      if (workoutInstance?.planInstanceDay?.[0]?.planInstance) {
        window.location.href = `/plans/instance/${workoutInstance.planInstanceDay[0].planInstance.id}`;
      } else if (workoutInstance?.planInstanceDay?.[0]?.planInstance?.mesocycle) {
        // If it's part of a mesocycle, redirect to the mesocycle page
        window.location.href = `/mesocycles/${workoutInstance.planInstanceDay[0].planInstance.mesocycle.id}`;
      } else {
        // Otherwise, redirect to plans page
        window.location.href = '/plans';
      }
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
        
        {workoutInstance.planInstanceDay?.[0]?.planInstance?.rir !== undefined && (
          <Box sx={{ mb: 2 }}>
            <Typography color="text.secondary" gutterBottom>
              Target RIR (Reps In Reserve): {workoutInstance.planInstanceDay[0].planInstance.rir}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Leave this many reps in reserve for each set
            </Typography>
          </Box>
        )}

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
                
                {exercise.sets.map((set, setIndex) => {
                  const lastSet = exercise.lastCompletedSets?.[setIndex + 1];
                  const placeholderWeight = lastSet?.weight || '0';
                  const placeholderReps = lastSet?.reps || '0';

                  return (
                    <Grid container spacing={2} key={setIndex} sx={{ mt: 1 }}>
                      <Grid item xs={4}>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          placeholder={`${placeholderWeight}`}
                          value={set.weight || ''}
                          onChange={(e) => handleUpdateSet(
                            exerciseIndex,
                            setIndex,
                            'weight',
                            parseFloat(e.target.value)
                          )}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          placeholder={`${placeholderReps}`}
                          value={set.reps || ''}
                          onChange={(e) => handleUpdateSet(
                            exerciseIndex,
                            setIndex,
                            'reps',
                            parseInt(e.target.value)
                          )}
                        />
                      </Grid>
                      <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  );
                })}

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
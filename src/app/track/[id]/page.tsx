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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { WorkoutInstanceWithRelations } from '@/types/prisma';
import Checkbox from '@mui/material/Checkbox';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import FilterListIcon from '@mui/icons-material/FilterList';
import { ExerciseCategory } from '@prisma/client';

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
  completedSetIndexes: Set<number>;
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

interface ExerciseWithCategory {
  id: number;
  name: string;
  category: ExerciseCategory;
}

export default function TrackWorkout({ params }: { params: { id: string } }) {
  const [workoutInstance, setWorkoutInstance] = useState<WorkoutInstanceWithRelations | null>(null);
  const [exerciseTrackings, setExerciseTrackings] = useState<ExerciseTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableExercises, setAvailableExercises] = useState<ExerciseWithCategory[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'ALL'>('ALL');
  const [workoutMenuAnchorEl, setWorkoutMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeSet, setActiveSet] = useState<{ exerciseIndex: number; setIndex: number } | null>(null);

  useEffect(() => {
    const fetchWorkoutInstance = async () => {
      try {
        const response = await fetch(`/api/workout-instances/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch workout');
        }
        const data = await response.json();
        setWorkoutInstance(data);

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
          sets: Array(3).fill({ reps: 0, weight: 0 }),
          completedSetIndexes: new Set<number>(),
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

  useEffect(() => {
    const fetchAvailableExercises = async () => {
      try {
        const response = await fetch('/api/exercises');
        if (!response.ok) {
          throw new Error('Failed to fetch exercises');
        }
        const data = await response.json();
        // Transform the categorized exercises into a flat array with category information
        const exercises = Object.entries(data).flatMap(([category, exercises]: [string, any[]]) =>
          exercises.map(exercise => ({
            ...exercise,
            category: category as ExerciseCategory
          }))
        );
        setAvailableExercises(exercises);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch exercises');
      }
    };

    fetchAvailableExercises();
  }, []);

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
      updated[exerciseIndex] = {
        ...updated[exerciseIndex],
        sets: updated[exerciseIndex].sets.filter((_, idx) => idx !== setIndex)
      };
      return updated;
    });
  };

  const handleSetCompletion = async (exerciseIndex: number, setIndex: number, completed: boolean) => {
    try {
      const tracking = exerciseTrackings[exerciseIndex];
      const set = tracking.sets[setIndex];
      const lastSet = tracking.lastCompletedSets?.[setIndex + 1];
      
      // If completing the set, use current values or fall back to placeholder values
      const weightToUse = set.weight || lastSet?.weight || 0;
      const repsToUse = set.reps || lastSet?.reps || 0;

      // Update local state
      setExerciseTrackings(prev => {
        const updated = [...prev];
        const newCompletedSetIndexes = new Set(updated[exerciseIndex].completedSetIndexes);
        
        if (completed) {
          newCompletedSetIndexes.add(setIndex);
          // Update the set with the values we're using
          updated[exerciseIndex].sets[setIndex] = {
            weight: weightToUse,
            reps: repsToUse
          };
        } else {
          newCompletedSetIndexes.delete(setIndex);
        }

        updated[exerciseIndex] = {
          ...updated[exerciseIndex],
          completedSetIndexes: newCompletedSetIndexes,
          isCompleted: newCompletedSetIndexes.size === updated[exerciseIndex].sets.length
        };
        return updated;
      });

      // If the set was completed, save it to the backend
      if (completed) {
        await fetch(`/api/workout-instances/${params.id}/sets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            exerciseId: tracking.exerciseId,
            sets: [{
              weight: weightToUse,
              reps: repsToUse,
              setNumber: setIndex + 1
            }],
          }),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update set completion');
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

  const handleAddExercise = async () => {
    try {
      const response = await fetch(`/api/workout-instances/${params.id}/exercises`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId: parseInt(selectedExercise),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add exercise');
      }

      const data = await response.json();
      setWorkoutInstance(data);
      setSelectedExercise('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add exercise');
    }
  };

  const handleRemoveExercise = async (exerciseId: number) => {
    try {
      const response = await fetch(`/api/workout-instances/${params.id}/exercises`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove exercise');
      }

      const data = await response.json();
      setWorkoutInstance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove exercise');
    }
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    exerciseIndex: number,
    setIndex: number
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveSet({ exerciseIndex, setIndex });
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveSet(null);
  };

  const handleDeleteSet = () => {
    if (activeSet) {
      handleRemoveSet(activeSet.exerciseIndex, activeSet.setIndex);
    }
    handleMenuClose();
  };

  const handleWorkoutMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setWorkoutMenuAnchorEl(event.currentTarget);
  };

  const handleWorkoutMenuClose = () => {
    setWorkoutMenuAnchorEl(null);
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            {workoutInstance.workout.name}
          </Typography>
          <IconButton onClick={handleWorkoutMenuOpen}>
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Menu
          anchorEl={workoutMenuAnchorEl}
          open={Boolean(workoutMenuAnchorEl)}
          onClose={handleWorkoutMenuClose}
        >
          <Box sx={{ p: 2, minWidth: 300 }}>
            <Typography variant="subtitle1" gutterBottom>
              Add Exercise
            </Typography>
            
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value as ExerciseCategory | 'ALL')}
              >
                <MenuItem value="ALL">All Categories</MenuItem>
                {Object.values(ExerciseCategory).map((category) => (
                  <MenuItem key={category} value={category}>
                    {category.charAt(0) + category.slice(1).toLowerCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Exercise</InputLabel>
              <Select
                value={selectedExercise}
                label="Exercise"
                onChange={(e) => setSelectedExercise(e.target.value)}
              >
                {availableExercises
                  .filter(exercise => selectedCategory === 'ALL' || exercise.category === selectedCategory)
                  .map((exercise) => (
                    <MenuItem key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={() => {
                handleAddExercise();
                handleWorkoutMenuClose();
              }}
              disabled={!selectedExercise}
              fullWidth
            >
              Add Exercise
            </Button>
          </Box>
        </Menu>

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
                  <Box>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveExercise(exercise.exerciseId)}
                      disabled={exercise.isCompleted}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Grid container spacing={2} sx={{ mb: 1 }}>
                  <Grid item xs={1}>
                    {/* Empty space for menu icon */}
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Weight
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Reps
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Complete
                    </Typography>
                  </Grid>
                </Grid>
                
                {exercise.sets.map((set, setIndex) => {
                  const lastSet = exercise.lastCompletedSets?.[setIndex + 1];
                  const placeholderWeight = lastSet?.weight || '0';
                  const placeholderReps = lastSet?.reps || '0';
                  const isSetCompleted = exercise.completedSetIndexes.has(setIndex);

                  return (
                    <Grid container spacing={2} key={setIndex} sx={{ mt: 1 }}>
                      <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, exerciseIndex, setIndex)}
                          disabled={isSetCompleted}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          inputMode="numeric"
                          placeholder={`${placeholderWeight}`}
                          value={set.weight || ''}
                          onChange={(e) => handleUpdateSet(
                            exerciseIndex,
                            setIndex,
                            'weight',
                            parseFloat(e.target.value)
                          )}
                          disabled={isSetCompleted}
                          sx={{
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                              '-webkit-appearance': 'none',
                              margin: 0,
                            },
                            '& input[type=number]': {
                              '-moz-appearance': 'textfield',
                            },
                            '& .Mui-disabled': {
                              WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                              color: 'rgba(0, 0, 0, 0.87)',
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          inputMode="numeric"
                          placeholder={`${placeholderReps}`}
                          value={set.reps || ''}
                          onChange={(e) => handleUpdateSet(
                            exerciseIndex,
                            setIndex,
                            'reps',
                            parseInt(e.target.value)
                          )}
                          disabled={isSetCompleted}
                          sx={{
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                              '-webkit-appearance': 'none',
                              margin: 0,
                            },
                            '& input[type=number]': {
                              '-moz-appearance': 'textfield',
                            },
                            '& .Mui-disabled': {
                              WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                              color: 'rgba(0, 0, 0, 0.87)',
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={3} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Checkbox
                          checked={isSetCompleted}
                          onChange={(e) => handleSetCompletion(exerciseIndex, setIndex, e.target.checked)}
                          disabled={exercise.isCompleted}
                        />
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

        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem 
            onClick={handleDeleteSet}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Delete Set
          </MenuItem>
        </Menu>

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
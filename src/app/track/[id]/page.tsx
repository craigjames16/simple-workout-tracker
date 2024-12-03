'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@/components';
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
  sets: Array<{
    reps: number;
    weight: number;
    lastSet: {
      reps: number;
      weight: number;
    } | null;
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

interface ExerciseResponse {
  [category: string]: Array<{
    id: number;
    name: string;
    category: ExerciseCategory;
  }>;
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
  const [exerciseMenuAnchorEl, setExerciseMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeExercise, setActiveExercise] = useState<number | null>(null);

  useEffect(() => {
    const fetchWorkoutInstance = async () => {
      try {
        const response = await fetch(`/api/workout-instances/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch workout');
        }
        const data = await response.json();
        setWorkoutInstance(data);
        
        const initialTrackings = data.workout.exercises.map((ex: any) => {
          // Get completed sets for this exercise
          const completedSets = data.sets?.filter((set: any) => set.exerciseId === ex.exercise.id) || [];
          
          return {
            exerciseId: ex.exercise.id,
            exerciseName: ex.exercise.name,
            sets: Array.from({ length: ex.lastSets.length || 3 }, (_, index) => {
              // Find completed set with matching setNumber
              const completedSet = completedSets.find((set: any) => set.setNumber === index + 1);
              // Find the set with matching setNumber (index + 1) from last workout
              const matchingLastSet = ex.lastSets?.find((lastSet: any) => lastSet.setNumber === index + 1);
              
              return completedSet ? {
                reps: completedSet.reps,
                weight: completedSet.weight,
                lastSet: matchingLastSet || null
              } : {
                reps: 0,
                weight: 0,
                lastSet: matchingLastSet || null
              };
            }),
            completedSetIndexes: new Set<number>(
              completedSets.map((set: any) => set.setNumber - 1)
            ),
            isCompleted: false,
          };
        });
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
        const data = await response.json() as ExerciseResponse;
        // Transform the categorized exercises into a flat array with category information
        const exercises = Object.entries(data).flatMap(([category, exerciseList]) =>
          exerciseList.map(exercise => ({
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
          field === 'weight' 
            ? (idx >= setIndex ? { ...set, weight: value } : set)
            : (idx === setIndex ? { ...set, reps: value } : set)
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
        sets: [...updated[exerciseIndex].sets, { reps: 0, weight: 0, lastSet: null }]
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
      
      // Use lastSet values or current values, falling back to placeholders if neither exists
      const weightToUse = set.weight || (set.lastSet?.weight ?? 0);
      const repsToUse = set.reps || (set.lastSet?.reps ?? 0);

      // Update local state
      setExerciseTrackings(prev => {
        const updated = [...prev];
        const newCompletedSetIndexes = new Set(updated[exerciseIndex].completedSetIndexes);
        
        if (completed) {
          newCompletedSetIndexes.add(setIndex);
          // Update the set with the values we're using
          updated[exerciseIndex].sets[setIndex] = {
            weight: weightToUse,
            reps: repsToUse,
            lastSet: {
              reps: repsToUse,
              weight: weightToUse
            }
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

      // Find the newly added exercise from the response
      const newExercise = data.workout.exercises.find(
        (ex: WorkoutExercise) => ex.exercise.id === parseInt(selectedExercise)
      );

      if (newExercise) {
        // Add the new exercise to exerciseTrackings
        setExerciseTrackings(prev => [...prev, {
          exerciseId: newExercise.exercise.id,
          exerciseName: newExercise.exercise.name,
          sets: Array.from({ length: 3 }, () => ({
            reps: 0,
            weight: 0,
            lastSet: null
          })),
          completedSetIndexes: new Set<number>(),
          isCompleted: false,
        }]);
      }

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

  const handleExerciseMenuOpen = (event: React.MouseEvent<HTMLElement>, exerciseIndex: number) => {
    setExerciseMenuAnchorEl(event.currentTarget);
    setActiveExercise(exerciseIndex);
  };

  const handleExerciseMenuClose = () => {
    setExerciseMenuAnchorEl(null);
    setActiveExercise(null);
  };

  const handleDeleteSet = () => {
    if (activeSet) {
      handleRemoveSet(activeSet.exerciseIndex, activeSet.setIndex);
    }
    handleMenuClose();
  };

  const handleWorkoutMenuClose = () => {
    setWorkoutMenuAnchorEl(null);
  };

  if (loading) {
    return (
      <ResponsiveContainer maxWidth="md" disableGutters sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </ResponsiveContainer>
    );
  }

  if (error || !workoutInstance) {
    return (
      <ResponsiveContainer maxWidth="md" disableGutters sx={{ mt: 4 }}>
        <Typography color="error">{error || 'Workout not found'}</Typography>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="sm" disableGutters>
      <Paper sx={{ p: { xs: 2, sm: 3 }, position: 'relative' }}>
        <Box sx={{
          position: 'sticky',
          top: {
            xs: 56,  // Mobile height
            sm: 64   // Desktop height
          },
          opacity: 1,
          backgroundColor: 'background.paper',
          zIndex: 1,
          paddingY: 2,
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
          <Typography variant="h5" gutterBottom>
                {workoutInstance.planInstanceDay?.[0] ? (
                  `Iteration ${workoutInstance.planInstanceDay[0].planInstance.iterationNumber}` + ` Day ${workoutInstance.planInstanceDay[0].planDay.dayNumber}`
                ) : (
                  workoutInstance.workout.name
                )}
              </Typography>
              {workoutInstance.planInstanceDay?.[0]?.planInstance?.mesocycle && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: -1, gap: 1 }}>
                  <Typography variant="subtitle1" color="text.secondary">
                    {`${workoutInstance.planInstanceDay[0].planInstance.mesocycle.name} -`}
                  </Typography>
                  {workoutInstance.planInstanceDay?.[0]?.planInstance?.rir !== undefined && (
                    <Typography color="text.secondary">
                      RIR: {workoutInstance.planInstanceDay[0].planInstance.rir}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
            <IconButton
              onClick={(event) => setWorkoutMenuAnchorEl(event.currentTarget)}
              size="large"
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
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
              disabled={!selectedExercise || !workoutInstance.completedAt}
              fullWidth
            >
              Add Exercise
            </Button>
          </Box>
        </Menu>

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
                      onClick={(event) => handleExerciseMenuOpen(event, exerciseIndex)}
                      disabled={exercise.isCompleted || !!workoutInstance.completedAt}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Grid container spacing={1} sx={{ mb: 1, maxWidth: 'sm', mx: 'auto' }}>
                  <Grid item xs={1} sm={1.5}>
                    {/* Empty space for menu icon*/ }
                  </Grid>
                  <Grid item xs={3} sm={2.5}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Weight
                    </Typography>
                  </Grid>
                  <Grid item xs={3} sm={2.5}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Reps
                    </Typography>
                  </Grid>
                  <Grid item xs={4} sm={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Complete
                    </Typography>
                  </Grid>
                </Grid>
                
                {exercise.sets.map((set, setIndex) => {
                  const isSetCompleted = exercise.completedSetIndexes.has(setIndex);

                  return (
                    <Grid container spacing={1} key={setIndex} sx={{ mt: 0.5, maxWidth: 'sm', mx: 'auto' }}>
                      <Grid item xs={1} sm={1.5} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, exerciseIndex, setIndex)}
                          disabled={isSetCompleted || !!workoutInstance.completedAt}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Grid>
                      <Grid item xs={3} sm={2.5}>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          inputMode="numeric"
                          value={set.weight || ''}
                          placeholder={set.lastSet ? String(set.lastSet.weight) : "0"}
                          onChange={(e) => handleUpdateSet(
                            exerciseIndex,
                            setIndex,
                            'weight',
                            parseFloat(e.target.value)
                          )}
                          disabled={isSetCompleted || !!workoutInstance.completedAt}
                          sx={{
                            maxWidth: '100px',
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
                      <Grid item xs={3} sm={2.5}>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          inputMode="numeric"
                          value={set.reps || ''}
                          placeholder={set.lastSet ? String(set.lastSet.reps) : "0"}
                          onChange={(e) => handleUpdateSet(
                            exerciseIndex,
                            setIndex,
                            'reps',
                            parseInt(e.target.value)
                          )}
                          disabled={isSetCompleted || !!workoutInstance.completedAt}
                          sx={{
                            maxWidth: '100px',
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
                      <Grid item xs={4} sm={3} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Checkbox
                          checked={isSetCompleted}
                          onChange={(e) => handleSetCompletion(exerciseIndex, setIndex, e.target.checked)}
                          disabled={exercise.isCompleted || !!workoutInstance.completedAt}
                        />
                      </Grid>
                    </Grid>
                  );
                })}

                <Button
                  startIcon={<AddIcon />}
                  onClick={() => handleAddSet(exerciseIndex)}
                  sx={{ mt: 1 }}
                  disabled={exercise.isCompleted || !!workoutInstance.completedAt}
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

        <Menu
          anchorEl={exerciseMenuAnchorEl}
          open={Boolean(exerciseMenuAnchorEl)}
          onClose={handleExerciseMenuClose}
        >
          <MenuItem 
            onClick={() => {
              if (activeExercise !== null) {
                handleRemoveExercise(exerciseTrackings[activeExercise].exerciseId);
                handleExerciseMenuClose();
              }
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Delete Exercise
          </MenuItem>
        </Menu>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleCompleteWorkout}
            disabled={!exerciseTrackings.every(t => t.isCompleted) || !!workoutInstance.completedAt}
          >
            Complete Workout
          </Button>
        </Box>
      </Paper>
    </ResponsiveContainer>
  );
} 
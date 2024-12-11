'use client';

import { useEffect, useState, useCallback } from 'react';
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
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import { ExerciseCategory } from '@prisma/client';
import { AnimatedCheckbox } from '@/components/AnimatedCheckbox';
import { motion, animate as animateDOM } from "framer-motion";
import confetti from 'canvas-confetti';
import { createRoot } from 'react-dom/client';

interface ExerciseTracking {
  exerciseId: number;
  exerciseName: string;
  order: number;
  sets: Array<{
    id?: number;
    reps: number;
    weight: number;
    completed?: boolean;
    lastSet: {
      reps: number;
      weight: number;
    } | null;
  }>;
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

const ParticleEffect = () => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '40%',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: ['#FFD700', '#4CAF50', '#2196F3'][i % 3],
          }}
          initial={{ scale: 0 }}
          animate={{
            y: [-20, -150 - Math.random() * 150],
            x: [0, (Math.random() - 0.5) * 200],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 1 + Math.random(),
            ease: "easeOut",
            times: [0, 0.2, 1],
            delay: Math.random() * 0.2,
          }}
        />
      ))}
    </div>
  );
};

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

        // Get completed sets for this exercise
        const completedSetsMap = data.sets?.reduce((acc: Record<number, any[]>, set: any) => {
          if (!acc[set.exerciseId]) {
            acc[set.exerciseId] = [];
          }
          acc[set.exerciseId].push({
            id: set.id,
            reps: set.reps,
            weight: set.weight,
            setNumber: set.setNumber
          });
          return acc;
        }, {}) || {};
        console.log(completedSetsMap);
        // Get the last completed set for each exercise
        
        
        const initialTrackings = data.workout.exercises.map((ex: any) => {   
          let sets;

          if (data.completedAt) {
            // Just used the completed sets for a completed workout
            sets = completedSetsMap[ex.exercise.id];
          } else {
            // Generate sets for incomplete workout from last workout
            sets = Array.from({ length: ex.lastSets.length || 3 }, (_, index) => {
              // Find completed set with matching setNumber
              const completedSets = completedSetsMap[ex.exercise.id] || [];
              const completedSet = completedSets.find((set: any) => {
                if (set.setNumber === index + 1) {
                  return true;
                }
            });

            // Find the set with matching setNumber (index + 1) from last workout
            const matchingLastSet = ex.lastSets?.find((lastSet: any) => lastSet.setNumber === index + 1);

            return completedSet ? {
              id: completedSet.id,
              reps: completedSet.reps,
              weight: completedSet.weight,
              lastSet: matchingLastSet || null,
              completed: true
            } : {
              reps: 0,
              weight: 0,
              lastSet: matchingLastSet || null
            };
          })
        }

          return {
            exerciseId: ex.exercise.id,
            exerciseName: ex.exercise.name,
            sets,
            order: ex.order
          };
        });

        setExerciseTrackings(initialTrackings.sort((a: { order: number }, b: { order: number }) => a.order - b.order));
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

  const handleUpdateSet = (set: any,exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setExerciseTrackings(prev => {
      const updated = [...prev];
      updated[exerciseIndex] = {
        ...updated[exerciseIndex],
        sets: updated[exerciseIndex].sets.map((set, idx) =>
          field === 'weight' && !set.completed // Might not be needed since when do you adjust the weight of a set above an already completed set
            ? (idx >= setIndex ? { ...set, weight: value } : set)
            : (idx === setIndex ? { ...set, reps: value } : set)
        ),
      };
      return updated;
    });
  };

  const handleAddSet = (exerciseIndex: number, workout: any) => {
    setExerciseTrackings(prev => {
      const newExerciseTracking = [...prev];
      // get current Exercise Tracker
      const exerciseTracker = newExerciseTracking[exerciseIndex];
      // Get last sets for current exercise
      const lastSets = workout.exercises.find((ex: any) => ex.exerciseId === exerciseTracker.exerciseId).lastSets;
      // Find the set with matching setNumber (index + 1) from last sets
      const matchingLastSet = lastSets.find((lastSet: any) => lastSet.setNumber === exerciseTracker.sets.length + 1);

      newExerciseTracking[exerciseIndex] = {
        ...newExerciseTracking[exerciseIndex],
        sets: [...newExerciseTracking[exerciseIndex].sets, { reps: 0, weight: 0, lastSet: matchingLastSet || null }]
      };

      return newExerciseTracking;
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
      
      if (!completed) {
        // Delete the set if it exists
        const setId = set.id;
        console.log('Attempting to delete set with ID:', setId);
        
        if (setId) {
          const response = await fetch(`/api/workout-instances/${params.id}/sets`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              setIds: [setId],
            }),
          });

          const result = await response.json();
          console.log('Delete response:', result);

          if (!response.ok) {
            throw new Error(`Failed to delete set: ${result.error}`);
          }

          // Update local state to remove completion and ID
          setExerciseTrackings(prev => {
            const prevExercises = [...prev];
            const updatedSet = { 
              ...prevExercises[exerciseIndex].sets[setIndex],
              id: undefined,
              completed: false
            };
            prevExercises[exerciseIndex].sets[setIndex] = updatedSet;
            return prevExercises;
          });
        } else {
          console.log('No set ID found for deletion');
        }
      }

      // Use lastSet values or current values, falling back to placeholders if neither exists
      const weightToUse = set.weight || (set.lastSet?.weight ?? 0);
      const repsToUse = set.reps || (set.lastSet?.reps ?? 0);

      if (completed) {
        // Create new set
        const response = await fetch(`/api/workout-instances/${params.id}/sets`, {
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

        const data = await response.json();
        const newSetId = data[0].id;

        // Update local state with the new set ID
        setExerciseTrackings(prev => {
          const prevExercises = [...prev];
          const updatedSet = { 
            ...prevExercises[exerciseIndex].sets[setIndex],
            id: newSetId,
            completed: true
          };
          prevExercises[exerciseIndex].sets[setIndex] = updatedSet;
          return prevExercises;
        });
      }

      // Add success animation and confetti (only for completion)
      if (completed) {
        const element = document.getElementById(`set-${tracking.exerciseId}-${setIndex}`);
        if (element) {
          animateDOM(element, { 
            scale: [1, 1.1, 1], 
            backgroundColor: ['#fff', '#4ade80', '#fff']
          }, { duration: 0.5 });
        }

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    } catch (err) {
      console.error('Error in handleSetCompletion:', err);
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

      // Add both confetti and our custom animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Show particle effect
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      root.render(<ParticleEffect />);

      // Clean up and redirect after animation
      setTimeout(() => {
        root.unmount();
        container.remove();
        
        if (workoutInstance?.planInstanceDay?.[0]?.planInstance) {
          window.location.href = `/plans/instance/${workoutInstance.planInstanceDay[0].planInstance.id}`;
        } else if (workoutInstance?.planInstanceDay?.[0]?.planInstance?.mesocycle) {
          window.location.href = `/mesocycles/${workoutInstance.planInstanceDay[0].planInstance.mesocycle.id}`;
        } else {
          window.location.href = '/plans';
        }
      }, 2000);

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
          order: newExercise.order,
          sets: Array.from({ length: newExercise.lastSets.length || 3 }, (_, index) => {
            // Find the set with matching setNumber (index + 1) from last workout
            const matchingLastSet = newExercise.lastSets?.find((lastSet: any) => lastSet.setNumber === index + 1);
            
            return {
              reps: 0,
              weight: 0,
              lastSet: matchingLastSet || null,
              completed: false
            };
          })
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
    <ResponsiveContainer maxWidth="xs" disableGutters>
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
                      disabled={!!workoutInstance.completedAt}
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
                  const isSetCompleted = set.completed || false;

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
                            set,
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
                            set,
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
                        <AnimatedCheckbox
                          checked={isSetCompleted || !!workoutInstance.completedAt}
                          onChange={() => handleSetCompletion(exerciseIndex, setIndex, !isSetCompleted)}
                          disabled={!!workoutInstance.completedAt}
                        />
                      </Grid>
                    </Grid>
                  );
                })}

                <Button
                  startIcon={<AddIcon />}
                  onClick={() => handleAddSet(exerciseIndex, workoutInstance.workout)}
                  sx={{ mt: 1 }}
                  disabled={!!workoutInstance.completedAt}
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
            disabled={!exerciseTrackings.every(tracking => 
              tracking.sets.every(set => set.completed === true)
            ) || !!workoutInstance.completedAt}
          >
            Complete Workout
          </Button>
        </Box>
      </Paper>
    </ResponsiveContainer>
  );
} 
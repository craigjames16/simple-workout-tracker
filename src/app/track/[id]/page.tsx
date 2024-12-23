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
  DialogActions,
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
import GradientButton from '@/components/GradientButton';
import { trackGradient } from '@/components/ThemeRegistry';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { format } from 'date-fns';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import Drawer from '@mui/material/Drawer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer as RechartsContainer } from 'recharts';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';

interface ExerciseTracking {
  exerciseId: number;
  exerciseName: string;
  order: number;
  sets: Array<{
    id?: number;
    reps: number;
    weight: number;
    completed?: boolean;
    skipped?: boolean;
    adjustment?: boolean;
    lastSet: {
      reps: number;
      weight: number;
    } | null;
  }>;
  history: Array<{
    workoutInstanceId: number;
    volume: number;
    completedAt: Date;
    sets: Array<{
      weight: number;
      reps: number;
      setNumber: number;
    }>;
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
  workoutInstances: Array<{
    workoutInstanceId: number;
    volume: number;
    completedAt: Date;
    sets: Array<{
      weight: number;
      reps: number;
      setNumber: number;
    }>;
  }>;
}

interface ExerciseResponse {
  [category: string]: Array<{
    id: number;
    name: string;
    category: ExerciseCategory;
    workoutInstances: Array<{
      workoutInstanceId: number;
      volume: number;
      completedAt: Date;
      sets: Array<{
        weight: number;
        reps: number;
        setNumber: number;
      }>;
    }>;
  }>;
}

interface WorkoutHistoryView {
  iterationNumber: number;
  workouts: Array<{
    dayNumber: number;
    planInstanceDayId: number;
    workoutInstanceId: number;
    completedAt: Date | null;
    isRestDay: boolean;
    isCompleted: boolean;
    name: string;
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

const ExerciseHistoryChart = ({ history }: { history: any[] }) => {
  const chartData = history.map(instance => ({
    date: new Date(instance.completedAt).toLocaleDateString(),
    volume: instance.volume,
  }));

  return (
    <Box sx={{ width: '100%', height: 250 }}>
      <RechartsContainer>
        <LineChart 
          data={chartData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: 'transparent' }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="volume" 
            stroke="#8884d8" 
            dot={false} 
          />
        </LineChart>
      </RechartsContainer>
    </Box>
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
  const [historyDialog, setHistoryDialog] = useState<{
    open: boolean;
    exercise: ExerciseTracking;
  }>({
    open: false,
    exercise: {
      exerciseId: 0,
      exerciseName: '',
      order: 0,
      sets: [],
      history: []
    }
  });
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryView[]>([]);
  const [historyAnchorEl, setHistoryAnchorEl] = useState<null | HTMLElement>(null);
  const [historyTabValue, setHistoryTabValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch both resources in parallel
        const [workoutResponse, exercisesResponse] = await Promise.all([
          fetch(`/api/workout-instances/${params.id}`),
          fetch('/api/exercises')
        ]);

        if (!workoutResponse.ok) throw new Error('Failed to fetch workout');
        if (!exercisesResponse.ok) throw new Error('Failed to fetch exercises');

        const workoutData = await workoutResponse.json();
        const exercisesData = await exercisesResponse.json() as ExerciseResponse;

        // Transform exercises data
        const exercises = Object.entries(exercisesData).flatMap(([category, exerciseList]) =>
          exerciseList.map(exercise => ({
            ...exercise,
            category: category as ExerciseCategory,
          }))
        );
        setAvailableExercises(exercises);

        // Process workout data
        setWorkoutInstance(workoutData);

        // Get completed sets map
        const completedSetsMap = workoutData.exerciseSets?.reduce((acc: Record<number, any[]>, set: any) => {
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
        
        // Initialize exercise trackings
        const initialTrackings = workoutData.workoutExercises.map((workoutExercise: any) => {   
          let sets;

          if (workoutData.completedAt) {
            sets = completedSetsMap[workoutExercise.exercise.id];
          } else {
            sets = Array.from({ length: workoutExercise.lastSets.length || 3 }, (_, index) => {
              const completedSets = completedSetsMap[workoutExercise.exercise.id] || [];
              const completedSet = completedSets.find((set: any) => set.setNumber === index + 1);
              const matchingLastSet = workoutExercise.lastSets?.find((lastSet: any) => lastSet.setNumber === index + 1);

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
            });
          }

          if (workoutExercise.exercise.adjustments) {
            workoutExercise.exercise.adjustments.forEach((adjustment: any) => {
              if (adjustment.action === 'addSets') {
                sets.push({
                  reps: workoutExercise.lastSets[workoutExercise.lastSets.length - 1].reps,
                  weight: workoutExercise.lastSets[workoutExercise.lastSets.length - 1].weight,
                  setNumber: sets.length + 1,
                  adjustment: true
                })
              }
            });
          }

          return {
            exerciseId: workoutExercise.exercise.id,
            exerciseName: workoutExercise.exercise.name,
            sets,
            adjustments: workoutExercise.exercise.adjustments,
            order: workoutExercise.order,
            history: exercises.find((exercise: any) => exercise.id === workoutExercise.exercise.id)?.workoutInstances || []
          };
        });

        setExerciseTrackings(initialTrackings.sort((a: ExerciseTracking, b: ExerciseTracking) => a.order - b.order));

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]); // Only depends on params.id now

  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      if (workoutInstance?.planInstanceDays?.[0]?.planInstance?.mesocycle?.id) {
        try {
          const response = await fetch(`/api/mesocycles/${workoutInstance.planInstanceDays[0].planInstance.mesocycle.id}`);
          if (!response.ok) throw new Error('Failed to fetch workout history');
          const mesocycle = await response.json();

          // Transform the mesocycle data into the WorkoutHistoryView format
          const historyView: WorkoutHistoryView[] = mesocycle.instances.map((instance: any) => ({
            iterationNumber: instance.iterationNumber,
            workouts: instance.days.map((day: any) => ({
              dayNumber: day.planDay.dayNumber,
              planInstanceDayId: day.id,
              workoutInstanceId: day.workoutInstance?.id,
              completedAt: day.workoutInstance?.completedAt,
              isRestDay: day.planDay.isRestDay,
              isCompleted: day.isComplete,
              name: day.planDay.name || `Day ${day.planDay.dayNumber}`
            }))
          }));

          setWorkoutHistory(historyView);
        } catch (error) {
          console.error('Error fetching workout history:', error);
        }
      }
    };

    fetchWorkoutHistory();
  }, [workoutInstance]);

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
        
        // First check for mesocycle
        if (workoutInstance?.planInstanceDays?.[0]?.planInstance?.mesocycle?.id) {
          window.location.href = `/mesocycles/${workoutInstance.planInstanceDays[0].planInstance.mesocycle.id}`;
        }
        // If no mesocycle, check for plan instance
        else if (workoutInstance?.planInstanceDays?.[0]?.planInstance?.id) {
          window.location.href = `/plans/instance/${workoutInstance.planInstanceDays[0].planInstance.id}`;
        }
        // Fallback to plans page
        else {
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
          history: availableExercises.find((exercise: any) => exercise.id === newExercise.exercise.id)?.workoutInstances || [],
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
      
      // Remove the exercise from exerciseTrackings
      setExerciseTrackings(prev => 
        prev.filter(tracking => tracking.exerciseId !== exerciseId)
      );
      
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

  const handleReorderExercise = async (exerciseId: number, direction: 'up' | 'down') => {
    try {
      // Get the workoutId from the workoutInstance
      const workoutId = workoutInstance?.workout.id;

      if (!workoutId) {
        throw new Error('Workout ID not found');
      }
      
      const response = await fetch(`/api/workout-instances/${params.id}/exercises/reorder/${workoutId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId,
          direction,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder exercise');
      }

      // Update local state to reflect the new order
      setExerciseTrackings(prev => {
        const exercises = [...prev];
        const currentIndex = exercises.findIndex(ex => ex.exerciseId === exerciseId);
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex >= 0 && targetIndex < exercises.length) {
          // Swap the exercises
          [exercises[currentIndex], exercises[targetIndex]] = [exercises[targetIndex], exercises[currentIndex]];
          // Update their order properties
          exercises[currentIndex].order = currentIndex;
          exercises[targetIndex].order = targetIndex;
        }

        return exercises;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder exercise');
    }
  };

  const handleShowHistory = (exercise: ExerciseTracking) => {
    if (exercise) {
      setHistoryDialog({
        exercise: {...exercise},
        open: true
      });
    } 
  };

  const handleSkipSet = (exerciseIndex: number, setIndex: number) => {
    setExerciseTrackings(prev => {
      const prevExercises = [...prev];
      const updatedSet = { 
        ...prevExercises[exerciseIndex].sets[setIndex],
        completed: true,
        skipped: true
      };
      prevExercises[exerciseIndex].sets[setIndex] = updatedSet;
      return prevExercises;
    });
    handleMenuClose();
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
      <Paper sx={{ 
        p: { xs: 0, sm: 0 }, 
        position: 'relative' 
      }}>
        <Box sx={{
          position: 'sticky',
          pl: 2,
          top: {
            xs: 56,
            sm: 64
          },
          opacity: 1,
          background: trackGradient,
          zIndex: 1,
          paddingY: 1,
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {workoutInstance.planInstanceDays?.[0] ? (
                  `Week ${workoutInstance.planInstanceDays[0].planInstance.iterationNumber}` + ` Day ${workoutInstance.planInstanceDays[0].planDay.dayNumber}`
                ) : (
                  workoutInstance.workout.name
                )}
              </Typography>
              {workoutInstance.planInstanceDays?.[0]?.planInstance?.mesocycle && (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  mt: -1, 
                  gap: 0.5 
                }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography 
                      variant="subtitle1" 
                      color="text.secondary"
                      component="a"
                      href={`/mesocycles/${workoutInstance.planInstanceDays[0].planInstance.mesocycle.id}`}
                      sx={{
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                          cursor: 'pointer'
                        }
                      }}
                    >
                      {`${workoutInstance.planInstanceDays[0].planInstance.mesocycle.name} - RIR: ${workoutInstance.planInstanceDays[0].planInstance.rir}`}
                    </Typography>
                  </Box>
                  {workoutInstance.completedAt && (
                    <Typography color="text.secondary">
                      Completed: {format(new Date(workoutInstance.completedAt), 'MMM d, yyyy')}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
            <Box>
              {workoutInstance.planInstanceDays?.[0]?.planInstance.mesocycle && (
                <IconButton
                  onClick={(event) => setHistoryAnchorEl(event.currentTarget)}
                  size="large"
                >
                  <CalendarMonthIcon />
                </IconButton>
              )}
              <IconButton
                onClick={(event) => setWorkoutMenuAnchorEl(event.currentTarget)}
                size="large"
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
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

            <GradientButton
              variant="contained"
              onClick={() => {
                handleAddExercise();
                handleWorkoutMenuClose();
              }}
              disabled={!selectedExercise || !!workoutInstance.completedAt}
              fullWidth
            >
              Add Exercise
            </GradientButton>
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
                borderBottom: '5px solid rgba(0, 0, 0, 0.12)',
                pb: 2,
              }}
            >
              <Box sx={{ width: '100%', mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">{exercise.exerciseName}</Typography>
                  <Box>
                    <IconButton
                      onClick={() => handleShowHistory(exercise)}
                      size="small"
                    >
                      <InfoOutlinedIcon />
                    </IconButton>
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

                {Array.isArray(exercise.sets) && exercise.sets.map((set, setIndex) => {
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
                            backgroundColor: set.adjustment ? 'rgba(156, 39, 176, 0.1)' : 'inherit',
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: set.adjustment ? 'rgba(156, 39, 176, 0.5)' : 'rgba(255, 255, 255, 0.23)',
                              },
                              '&:hover fieldset': {
                                borderColor: set.adjustment ? 'rgba(156, 39, 176, 0.7)' : 'rgba(255, 255, 255, 0.23)',
                              },
                            },
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
                          inputProps={{
                            inputMode: 'decimal',
                            pattern: '[0-9]*\\.?[0-9]*'
                          }}
                        />
                      </Grid>
                      <Grid item xs={3} sm={2.5}>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
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
                            backgroundColor: set.adjustment ? 'rgba(156, 39, 176, 0.1)' : 'inherit',
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: set.adjustment ? 'rgba(156, 39, 176, 0.5)' : 'rgba(255, 255, 255, 0.23)',
                              },
                              '&:hover fieldset': {
                                borderColor: set.adjustment ? 'rgba(156, 39, 176, 0.7)' : 'rgba(255, 255, 255, 0.23)',
                              },
                            },
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
                          inputProps={{
                            inputMode: 'numeric',
                            pattern: '[0-9]*'
                          }}
                        />
                      </Grid>
                      <Grid item xs={4} sm={3} sx={{ display: 'flex', alignItems: 'center' }}>
                        <AnimatedCheckbox
                          checked={isSetCompleted || !!workoutInstance.completedAt}
                          onChange={() => handleSetCompletion(exerciseIndex, setIndex, !isSetCompleted)}
                          disabled={!!workoutInstance.completedAt}
                        />
                        {set.adjustment && (
                          <Chip
                            label="From PT"
                            size="small"
                            sx={{
                              ml: 1,
                              height: '20px',
                              backgroundColor: 'rgba(156, 39, 176, 0.1)',
                              color: 'rgb(156, 39, 176)',
                              border: '1px solid rgba(156, 39, 176, 0.3)',
                              '& .MuiChip-label': {
                                px: 1,
                                fontSize: '0.625rem',
                                fontWeight: 500
                              }
                            }}
                          />
                        )}
                      </Grid>
                    </Grid>
                  );
                })}
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
            onClick={() => activeSet && handleSkipSet(activeSet.exerciseIndex, activeSet.setIndex)}
          >
            <Typography color="text.secondary">Skip Set</Typography>
          </MenuItem>
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
                handleReorderExercise(exerciseTrackings[activeExercise].exerciseId, 'up');
                handleExerciseMenuClose();
              }
            }}
            disabled={activeExercise === 0 || !!workoutInstance.completedAt}
          >
            <ArrowUpward sx={{ mr: 1 }} fontSize="small" />
            Move Up
          </MenuItem>
          <MenuItem 
            onClick={() => {
              if (activeExercise !== null) {
                handleReorderExercise(exerciseTrackings[activeExercise].exerciseId, 'down');
                handleExerciseMenuClose();
              }
            }}
            disabled={activeExercise === exerciseTrackings.length - 1 || !!workoutInstance.completedAt}
          >
            <ArrowDownward sx={{ mr: 1 }} fontSize="small" />
            Move Down
          </MenuItem>
          <MenuItem 
            onClick={() => {
              if (activeExercise !== null) {
                handleAddSet(activeExercise, workoutInstance.workout);
                handleExerciseMenuClose();
              }
            }}
            disabled={!!workoutInstance.completedAt}
          >
            <AddIcon sx={{ mr: 1 }} fontSize="small" />
            Add Set
          </MenuItem>
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
          <GradientButton
            variant="contained"
            fullWidth
            sx={{ p: 4, m: 1 }}
            onClick={handleCompleteWorkout}
            disabled={
              !exerciseTrackings.every((tracking) =>
                tracking.sets?.every((set) => set.completed === true || set.skipped === true)
              ) || !!workoutInstance.completedAt
            }
          >
            Complete Workout
          </GradientButton>
        </Box>

        <Dialog 
          open={historyDialog.open} 
          onClose={() => setHistoryDialog(prev => ({ ...prev, open: false }))}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{historyDialog.exercise.exerciseName} History</DialogTitle>
          <DialogContent>
            <Tabs 
              value={historyTabValue} 
              onChange={(_, newValue) => setHistoryTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label="Sets" />
              <Tab label="Volume" />
            </Tabs>

            {historyTabValue === 0 ? (
              // Sets History Tab
              <>
                {historyDialog.exercise.history?.sort((a, b) => 
                  new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
                ).map((instance, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {format(new Date(instance.completedAt), 'MMM d, yyyy')}
                    </Typography>
                    <Grid container spacing={2} sx={{ pl: 2 }}>
                      {instance.sets
                        .sort((a, b) => a.setNumber - b.setNumber)
                        .map((set, setIndex) => (
                          <Grid item xs={12} key={setIndex}>
                            <Typography variant="body2">
                              Set {set.setNumber}: {set.weight}lbs × {set.reps} reps
                            </Typography>
                          </Grid>
                        ))}
                    </Grid>
                  </Box>
                ))}

                {historyDialog.exercise.history?.length === 0 && (
                  <Typography color="text.secondary">
                    No previous history found for this exercise.
                  </Typography>
                )}
              </>
            ) : (
              // Volume History Tab
              <ExerciseHistoryChart history={historyDialog.exercise.history || []} />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHistoryDialog(prev => ({ ...prev, open: false }))}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Menu
          anchorEl={historyAnchorEl}
          open={Boolean(historyAnchorEl)}
          onClose={() => setHistoryAnchorEl(null)}
          PaperProps={{
            sx: {
              maxHeight: '80vh',
              width: '100vw',
              left: '0px !important',
              right: '0px !important',
              maxWidth: '100% !important',
              position: 'fixed',
              top: { xs: '132px !important', sm: '156px !important' }
            }
          }}
          transformOrigin={{ horizontal: 'center', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
        >
          <Box sx={{ p: 2, width: '100%' }}>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: `repeat(${workoutHistory.length}, 60px)`,
              gap: 2,
              justifyContent: 'center'
            }}>
              {/* Header row with iteration numbers */}
              {workoutHistory.map((iteration) => (
                <Box 
                  key={`header-${iteration.iterationNumber}`}
                  sx={{ 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    color: iteration.iterationNumber === workoutInstance?.planInstanceDays?.[0]?.planInstance?.iterationNumber
                      ? 'primary.main'
                      : 'text.secondary'
                  }}
                >
                  Week {iteration.iterationNumber} 
                </Box>
              ))}

              {/* Generate grid cells for each day */}
              {Array.from({ length: Math.max(...workoutHistory.map(i => 
                Math.max(...i.workouts.map(w => w.dayNumber))
              )) }).map((_, dayIndex) => (
                workoutHistory.map((iteration) => {
                  const workout = iteration.workouts.find(w => w.dayNumber === dayIndex + 1);
                  return (
                    <Box
                      key={`${iteration.iterationNumber}-${dayIndex + 1}`}
                      sx={{
                        width: 60,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1,
                        cursor: workout ? 'pointer' : 'default',
                        backgroundColor: workout?.workoutInstanceId === parseInt(params.id)
                          ? 'primary.main'
                          : workout?.isRestDay
                            ? workout.isCompleted
                              ? 'success.dark'
                              : 'warning.dark'
                            : workout?.completedAt
                              ? 'success.dark'
                              : workout
                                ? 'action.hover'
                                : 'action.disabledBackground',
                        color: workout?.workoutInstanceId === parseInt(params.id)
                          ? 'primary.contrastText'
                          : 'text.primary',
                        fontSize: '0.875rem',
                        '&:hover': workout ? {
                          backgroundColor: workout.workoutInstanceId === parseInt(params.id)
                            ? 'primary.dark'
                            : 'action.selected'
                        } : {}
                      }}
                      onClick={async () => {
                        if (workout?.workoutInstanceId && workout.workoutInstanceId !== parseInt(params.id)) {
                          // Navigate to existing workout
                          window.location.href = `/track/${workout.workoutInstanceId}`;
                        } else if (workout && !workout.workoutInstanceId) {
                          try {
                            if (workout.isRestDay) {
                              // Complete rest day using planInstanceDayId
                              const response = await fetch(`/api/plan-instances/${workoutInstance?.planInstanceDays?.[0]?.planInstance?.id}/days/${workout.planInstanceDayId}/complete-rest`, {
                                method: 'POST',
                              });

                              if (!response.ok) {
                                throw new Error('Failed to complete rest day');
                              }

                              // Refresh the page to show updated status
                              window.location.reload();
                            } else {
                              // Start new workout using planInstanceDayId
                              const response = await fetch(`/api/plan-instances/${workoutInstance?.planInstanceDays?.[0]?.planInstance?.id}/days/${workout.planInstanceDayId}/start`, {
                                method: 'POST',
                              });

                              if (!response.ok) {
                                throw new Error('Failed to start workout');
                              }

                              const data = await response.json();
                              // Navigate to new workout
                              window.location.href = `/track/${data.id}`;
                            }
                          } catch (error) {
                            console.error('Error:', error);
                            // You might want to show an error message to the user here
                          }
                        }
                      }}
                    >
                      {workout ? (workout.isRestDay ? 'R' : `Day ${dayIndex + 1}`) : ''}
                    </Box>
                  );
                })
              ))}
            </Box>
          </Box>
        </Menu>
      </Paper>
    </ResponsiveContainer>
  );
} 
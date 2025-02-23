'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import {
  ResponsiveContainer,
  Paper,
  Typography,
  TextField,
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
import GradientButton from '@/components/GradientButton';
import { trackGradient } from '@/components/ThemeRegistry';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { format } from 'date-fns';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer as RechartsContainer } from 'recharts';
import Chip from '@mui/material/Chip';
import ExerciseHistoryModal from '@/components/ExerciseHistoryModal';


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
  mesocycleHistory: Array<{
    completedAt: Date;
    mesocycleId: number;
    sets: Array<{
      weight: number;
      reps: number;
      setNumber: number;
    }>;
    volume: number;
    workoutInstanceId: number;
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
    mesocycleId: number;
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
      mesocycleId: number;
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

export default function TrackWorkout({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params) as { id: string };
  const workoutId = unwrappedParams.id;

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
      history: [],
      mesocycleHistory: []
    }
  });
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryView[]>([]);
  const [historyAnchorEl, setHistoryAnchorEl] = useState<null | HTMLElement>(null);

  // Create refs for animation targets
  const setRefs = useRef<{ [key: string]: React.RefObject<HTMLElement> }>({});
  const particleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [workoutResponse, exercisesResponse] = await Promise.all([
          fetch(`/api/workout-instances/${workoutId}`),
          fetch('/api/exercises')
        ]);

        if (!workoutResponse.ok) throw new Error('Failed to fetch workout');
        if (!exercisesResponse.ok) throw new Error('Failed to fetch exercises');

        const workoutData = await workoutResponse.json();
        const exercisesData = await exercisesResponse.json() as ExerciseResponse;

        const exercises = Object.entries(exercisesData).flatMap(([category, exerciseList]) =>
          exerciseList.map(exercise => ({
            ...exercise,
            category: category as ExerciseCategory,
          }))
        );
        setAvailableExercises(exercises);

        setWorkoutInstance(workoutData);

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
        
        const initialTrackings = workoutData.workoutExercises.map((workoutExercise: any) => {   
          let sets;

          if (workoutData.completedAt) {
            sets = completedSetsMap[workoutExercise.exercise.id];
          } else {
            const numSets = workoutExercise.lastSets?.length || 3;
            sets = Array.from({ length: numSets }, (_, index) => {
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
                const lastSet = workoutExercise.lastSets?.[workoutExercise.lastSets.length - 1] || { reps: 0, weight: 0 };
                sets.push({
                  reps: lastSet.reps,
                  weight: lastSet.weight,
                  setNumber: sets.length + 1,
                  adjustment: true
                });
              }
            });
          }

          const currentExercise = exercises.find((exercise: any) => exercise.id === workoutExercise.exercise.id);
          const currentMesocycleWorkoutInstances = currentExercise?.workoutInstances.filter((instance: any) => instance.mesocycleId === workoutData?.mesocycleId && instance.workoutInstanceId != workoutData?.id)

          return {
            exerciseId: workoutExercise.exercise.id,
            exerciseName: workoutExercise.exercise.name,
            sets,
            adjustments: workoutExercise.exercise.adjustments,
            order: workoutExercise.order,
            history: exercises.find((exercise: any) => exercise.id === workoutExercise.exercise.id)?.workoutInstances || [],
            mesocycleHistory: currentMesocycleWorkoutInstances?.sort((a: any, b: any) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()) || []
          };
        });
        console.log(initialTrackings);
        setExerciseTrackings(initialTrackings.sort((a: ExerciseTracking, b: ExerciseTracking) => a.order - b.order));

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workoutId]);

  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      if (workoutInstance?.planInstanceDays?.[0]?.planInstance?.mesocycle?.id) {
        try {
          const response = await fetch(`/api/mesocycles/${workoutInstance.planInstanceDays[0].planInstance.mesocycle.id}`);
          if (!response.ok) throw new Error('Failed to fetch workout history');
          const mesocycle = await response.json();

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

  const handleAddSet = (exerciseIndex: number) => {
    setExerciseTrackings(prev => {
      const newExerciseTracking = [...prev];
      const exerciseTracker = newExerciseTracking[exerciseIndex];
      
      const workoutExercise = workoutInstance?.workoutExercises?.find(
        (ex: any) => ex.exercise.id === exerciseTracker.exerciseId
      ) as { 
        exercise: { id: number }; 
        lastSets?: Array<{ 
          setNumber: number;
          reps: number;
          weight: number;
        }> 
      } | undefined;
      
      const matchingLastSet = workoutExercise?.lastSets?.find(
        (lastSet: any) => lastSet.setNumber === exerciseTracker.sets.length + 1
      );

      newExerciseTracking[exerciseIndex] = {
        ...newExerciseTracking[exerciseIndex],
        sets: [...newExerciseTracking[exerciseIndex].sets, {
          reps: 0,
          weight: 0,
          lastSet: matchingLastSet || null
        }]
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
        const setId = set.id;
        
        if (setId) {
          const response = await fetch(`/api/workout-instances/${workoutId}/sets`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              setIds: [setId],
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(`Failed to delete set: ${result.error}`);
          }

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

      const weightToUse = set.weight || (set.lastSet?.weight ?? 0);
      const repsToUse = set.reps || (set.lastSet?.reps ?? 0);

      if (completed) {
        const response = await fetch(`/api/workout-instances/${workoutId}/sets`, {
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

        setExerciseTrackings(prev => {
          const prevExercises = [...prev];
          const updatedSet = { 
            ...prevExercises[exerciseIndex].sets[setIndex],
            id: newSetId,
            completed: true,
            weight: weightToUse,
            reps: repsToUse
          };
          prevExercises[exerciseIndex].sets[setIndex] = updatedSet;
          return prevExercises;
        });
      }

      const refKey = `set-${tracking.exerciseId}-${setIndex}`;
      const elementRef = setRefs.current[refKey];
      if (elementRef?.current) {
        animateDOM(elementRef.current, { 
          scale: [1, 1.1, 1]
        }, { duration: 0.5 });
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (err) {
      console.error('Error in handleSetCompletion:', err);
      setError(err instanceof Error ? err.message : 'Failed to update set completion');
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      const response = await fetch(`/api/workout-instances/${workoutId}/complete`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to complete workout');
      }

      const workoutData = await response.json();
      
      // Only update the completedAt property
      setWorkoutInstance(prev => prev ? {
        ...prev,
        completedAt: workoutData.completedAt
      } : null);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Scroll to the top of the page
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      const volumeDifferences = document.querySelectorAll('.volume-difference');
      volumeDifferences.forEach((difference: any) => {
        difference.style.opacity = '1';
        difference.style.visibility = 'visible';
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete workout');
    }
  };

  const handleAddExercise = async () => {
    try {
      const response = await fetch(`/api/workout-instances/${workoutId}/exercises`, {
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

      const newExercise = data.workout.exercises.find(
        (ex: WorkoutExercise) => ex.exercise.id === parseInt(selectedExercise)
      );

      if (newExercise) {
        const currentExercise = availableExercises.find((exercise: any) => exercise.id === newExercise.exercise.id);
        const currentMesocycleWorkoutInstances = currentExercise?.workoutInstances.filter((instance: any) => instance.mesocycleId === data?.mesocycleId && instance.workoutInstanceId != data?.id);

        // Map the currentMesocycleWorkoutInstances to match the expected structure
        const mesocycleHistory = currentMesocycleWorkoutInstances?.map(instance => ({
          completedAt: instance.completedAt,
          mesocycleId: instance.mesocycleId,
          sets: instance.sets.map(set => ({
            weight: set.weight,
            reps: set.reps,
            setNumber: set.setNumber
          })) || [],
          volume: instance.volume,
          workoutInstanceId: instance.workoutInstanceId
        })) || [];

        setExerciseTrackings(prev => [...prev, {
          exerciseId: newExercise.exercise.id,
          exerciseName: newExercise.exercise.name,
          order: newExercise.order,
          mesocycleHistory: mesocycleHistory,
          history: currentExercise?.workoutInstances.sort((a: any, b: any) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()) || [],
          sets: Array.from({ length: newExercise.lastSets.length || 3 }, (_, index) => {
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
      const response = await fetch(`/api/workout-instances/${workoutId}/exercises`, {
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
      
      setWorkoutInstance(prevWorkoutInstance => {
        if (!prevWorkoutInstance) return null;
        
        return {
          ...prevWorkoutInstance,
          workoutExercises: prevWorkoutInstance.workoutExercises.filter(
            (ex: any) => ex.exercise.id !== exerciseId
          )
        };
      });
      
      setExerciseTrackings(prev => 
        prev.filter(tracking => tracking.exerciseId !== exerciseId)
      );
      
      handleExerciseMenuClose();
      
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
      const workoutId = workoutInstance?.workout.id;

      if (!workoutId) {
        throw new Error('Workout ID not found');
      }
      
      const response = await fetch(`/api/workout-instances/${workoutId}/exercises/reorder/${workoutId}`, {
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

      setExerciseTrackings(prev => {
        const exercises = [...prev];
        const currentIndex = exercises.findIndex(ex => ex.exerciseId === exerciseId);
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex >= 0 && targetIndex < exercises.length) {
          [exercises[currentIndex], exercises[targetIndex]] = [exercises[targetIndex], exercises[currentIndex]];
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
        exercise: { ...exercise },
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

  const calculateVolumeDifference = (exercise: ExerciseTracking) => {
    console.log('calculateVolumeDifference', exercise);
    const currentVolume = exercise.sets?.reduce((acc, set) => acc + set.weight * set.reps, 0);
    const previousVolume = exercise.mesocycleHistory[0].volume;
    const percentage = ((currentVolume - previousVolume) / previousVolume) * 100;
    if (percentage > 0) {
      return <Typography className="volume-difference" variant="subtitle2" color="success">+{percentage.toFixed(0)}%</Typography>;
    }
    else if (percentage < 0) {
      return <Typography className="volume-difference" variant="subtitle2" color="error">{percentage.toFixed(0)}%</Typography>;
    }
    else {
      return <Typography className="volume-difference" variant="subtitle2" color="text.secondary">0%</Typography>;
    }
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
      <div ref={particleContainerRef} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none' }} />
      
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">{exercise.exerciseName}</Typography>
                    {workoutInstance.completedAt && exercise.mesocycleHistory.length > 0 && (
                      calculateVolumeDifference(exercise)
                    )}
                  </Box>
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
                              WebkitAppearance: 'none',
                              margin: 0,
                            },
                            '& input[type=number]': {
                              MozAppearance: 'textfield',
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
                              WebkitAppearance: 'none',
                              margin: 0,
                            },
                            '& input[type=number]': {
                              MozAppearance: 'textfield',
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
                      <Grid item xs={4} sm={3} sx={{ display: 'flex', alignItems: 'center' }}
                        ref={(element) => {
                          const refKey = `set-${exercise.exerciseId}-${setIndex}`;
                          if (!setRefs.current[refKey]) {
                            setRefs.current[refKey] = { current: null };
                          }
                          setRefs.current[refKey] = { current: element };
                        }}
                      >
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
                handleAddSet(activeExercise);
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
        <ExerciseHistoryModal
          open={historyDialog.open}
          onClose={() => setHistoryDialog(prev => ({ ...prev, open: false }))}
          exerciseName={historyDialog.exercise.exerciseName}
          history={historyDialog.exercise.history || []}
        />

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
                        backgroundColor: workout?.workoutInstanceId === parseInt(workoutId)
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
                        color: workout?.workoutInstanceId === parseInt(workoutId)
                          ? 'primary.contrastText'
                          : 'text.primary',
                        fontSize: '0.875rem',
                        '&:hover': workout ? {
                          backgroundColor: workout.workoutInstanceId === parseInt(workoutId)
                            ? 'primary.dark'
                            : 'action.selected'
                        } : {}
                      }}
                      onClick={async () => {
                        if (workout?.workoutInstanceId && workout.workoutInstanceId !== parseInt(workoutId)) {
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
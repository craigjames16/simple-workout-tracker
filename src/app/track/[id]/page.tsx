'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import {
  ResponsiveContainer,
  Box,
  CircularProgress,
  Typography,
  List,
  ListItem,
  MenuItem,
} from '@/components';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { WorkoutInstanceWithRelations } from '@/types/prisma';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import { ExerciseCategory } from '@prisma/client';
import { animate as animateDOM } from "framer-motion";
import confetti from 'canvas-confetti';
import GradientButton from '@/components/GradientButton';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ExerciseHistoryModal from '@/components/ExerciseHistoryModal';
import { gradients, borders } from '@/lib/theme-constants';

// Import new components
import WorkoutHeader from '@/components/WorkoutHeader';
import ExerciseCard from '@/components/ExerciseCard';
import WorkoutHistoryGrid from '@/components/WorkoutHistoryGrid';
import AddExerciseMenu from '@/components/AddExerciseMenu';

// Import types
import {
  ExerciseTracking,
  WorkoutExercise,
  ExerciseWithCategory,
  ExerciseResponse,
  WorkoutHistoryView
} from '@/types/workout-tracking';

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

  const handleUpdateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setExerciseTrackings(prev => {
      const updated = [...prev];
      updated[exerciseIndex] = {
        ...updated[exerciseIndex],
        sets: updated[exerciseIndex].sets.map((set, idx) =>
          field === 'weight' && !set.completed
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
      
      setWorkoutInstance(prev => prev ? {
        ...prev,
        completedAt: workoutData.completedAt
      } : null);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
      
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

      const newExercise = data.workoutExercises.find(
        (ex: WorkoutExercise) => ex.exercise.id === parseInt(selectedExercise)
      );

      if (newExercise) {
        const currentExercise = availableExercises.find((exercise: any) => exercise.id === newExercise.exercise.id);
        const currentMesocycleWorkoutInstances = currentExercise?.workoutInstances.filter((instance: any) => instance.mesocycleId === data?.mesocycleId && instance.workoutInstanceId != data?.id);

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
      const workoutInstanceId = workoutId;

      if (!workoutInstanceId) {
        throw new Error('Workout instance ID not found');
      }
      
      const response = await fetch(`/api/workout-instances/${workoutInstanceId}/exercises/reorder/${workoutInstanceId}`, {
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

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        px: 2
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading your workout...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error || !workoutInstance) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        px: 2
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Oops! Something went wrong
          </Typography>
          <Typography color="text.secondary">
            {error || 'Workout not found'}
          </Typography>
        </Box>
      </Box>
    );
  }

  const completedSets = exerciseTrackings.reduce((total, exercise) => 
    total + (exercise.sets || []).filter(set => set.completed).length, 0
  );
  const totalSets = exerciseTrackings.reduce((total, exercise) => 
    total + (exercise.sets || []).length, 0
  );

  return (
    <ResponsiveContainer 
      maxWidth="sm" 
      disableGutters
      sx={{ 
        minHeight: '100vh', 
        pb: 10,
        overflow: 'visible'
      }}
    >
      <div ref={particleContainerRef} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none' }} />
      
      {/* Sticky Header */}
      <WorkoutHeader
        workoutInstance={workoutInstance}
        completedSets={completedSets}
        totalSets={totalSets}
        onHistoryClick={(event) => setHistoryAnchorEl(event.currentTarget)}
        onMenuClick={(event) => setWorkoutMenuAnchorEl(event.currentTarget)}
      />

      {/* Exercise List */}
      <Box sx={{ px: { xs: 1, sm: 2 }, py: 2 }}>
        {exerciseTrackings.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            background: gradients.glass,
            borderRadius: 1,
            border: '1px dashed rgba(255,255,255,0.2)'
          }}>
            <Typography variant="h6" gutterBottom>
              Ready to get started? 💪
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Add your first exercise to begin tracking your workout
            </Typography>
            <GradientButton
              variant="contained"
              onClick={(event) => setWorkoutMenuAnchorEl(event.currentTarget)}
              startIcon={<AddIcon />}
              size="large"
            >
              Add Exercise
            </GradientButton>
          </Box>
        ) : (
          exerciseTrackings.map((exercise, exerciseIndex) => (
            <ExerciseCard
              key={exercise.exerciseId}
              exercise={exercise}
              exerciseIndex={exerciseIndex}
              isWorkoutCompleted={!!workoutInstance.completedAt}
              onUpdateSet={handleUpdateSet}
              onSetCompletion={handleSetCompletion}
              onShowHistory={handleShowHistory}
              onExerciseMenuOpen={handleExerciseMenuOpen}
              onSetMenuOpen={handleMenuOpen}
            />
          ))
        )}
      </Box>

      {/* Complete Workout Button */}
      {exerciseTrackings.length > 0 && (
        <Box sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          p: 2, 
          zIndex: 1000
        }}>
          <Box sx={{
            borderRadius: 2,
            overflow: 'hidden',
            background: gradients.surface,
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <Box sx={{
              p: { xs: 2, sm: 3 },
              background: gradients.glass,
                              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <GradientButton
                variant="contained"
                fullWidth
                size="large"
                onClick={handleCompleteWorkout}
                disabled={
                  !exerciseTrackings.every((tracking) =>
                    tracking.sets?.every((set) => set.completed === true || set.skipped === true)
                  ) || !!workoutInstance.completedAt
                }
                sx={{ 
                  py: 2,
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                {workoutInstance.completedAt ? (
                  <>Completed</>
                ) : (
                  <>
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                      Complete Workout ({completedSets}/{totalSets} sets)
                    </Box>
                    <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                      Complete ({completedSets}/{totalSets})
                    </Box>
                  </>
                )}
              </GradientButton>
            </Box>
          </Box>
        </Box>
      )}

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

      <Menu
        anchorEl={workoutMenuAnchorEl}
        open={Boolean(workoutMenuAnchorEl)}
        onClose={handleWorkoutMenuClose}
      
      >
        <AddExerciseMenu
          availableExercises={availableExercises}
          selectedCategory={selectedCategory}
          selectedExercise={selectedExercise}
          isWorkoutCompleted={!!workoutInstance.completedAt}
          onCategoryChange={setSelectedCategory}
          onExerciseChange={setSelectedExercise}
          onAddExercise={handleAddExercise}
          onClose={handleWorkoutMenuClose}
        />
      </Menu>

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
            position: 'fixed',
            top: { xs: '132px !important', sm: '156px !important' },
          }
        }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
      >
        <WorkoutHistoryGrid
          workoutHistory={workoutHistory}
          currentWorkoutId={workoutId}
          workoutInstance={workoutInstance}
        />
      </Menu>
    </ResponsiveContainer>
  );
} 
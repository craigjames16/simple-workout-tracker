'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardHeader,
  CardContent,
  IconButton,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  ListSubheader,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { ExerciseCategory } from '@prisma/client';
import { ResponsiveContainer } from './ResponsiveContainer';
import { gradients, themeColors, textStyles } from '@/lib/theme-constants';
import GradientButton from './GradientButton';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HotelIcon from '@mui/icons-material/Hotel';
import WorkoutDayCard from './WorkoutDayCard';

interface Exercise {
  id: number;
  name: string;
  category: ExerciseCategory;
}

interface ExerciseResponse {
  [category: string]: Exercise[];
}

interface WorkoutDay {
  id: string;
  name: string;
  isRestDay: boolean;
  workoutExercises: Exercise[];
  dayNumber: number;
}

interface ExercisesByCategory {
  [category: string]: Exercise[];
}

interface Props {
  initialPlan?: {
    id: number;
    name: string;
    days: Array<{
      id: number;
      dayNumber: number;
      isRestDay: boolean;
      workout?: {
        workoutExercises: Array<{
          exercise: Exercise;
        }>;
      };
    }>;
  };
  mode?: 'create' | 'edit';
}

export default function CreatePlan({ initialPlan, mode = 'create' }: Props) {
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>(() => {
    if (initialPlan) {
      return initialPlan.days
        .map((day) => ({
          id: `day-${day.dayNumber}`,
          name: `Day ${day.dayNumber}`,
          isRestDay: day.isRestDay,
          workoutExercises: day.workout?.workoutExercises.map(e => e.exercise) || [],
          dayNumber: day.dayNumber,
        }))
        .sort((a, b) => a.dayNumber - b.dayNumber);
    }
    return [];
  });
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [planName, setPlanName] = useState(initialPlan?.name || '');
  const [selectedCategories, setSelectedCategories] = useState<Record<string, string>>({});
  const [openNewExerciseDialog, setOpenNewExerciseDialog] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    category: '' as ExerciseCategory
  });
  const [creatingExerciseForDayIndex, setCreatingExerciseForDayIndex] = useState<number | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // dnd-kit sensors for pointer and keyboard sorting
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/exercises');
        if (!response.ok) {
          throw new Error('Failed to fetch exercises');
        }
        const data = await response.json() as ExerciseResponse;
        
        const allExercises = Object.values(data).flat() as Exercise[];
        setAvailableExercises(allExercises);
      } catch (error) {
        console.error('Error fetching exercises:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch exercises');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExercises();
  }, []);

  const groupedExercises = availableExercises.reduce((acc: ExercisesByCategory, exercise) => {
    const category = exercise.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(exercise);
    return acc;
  }, {});

  const filteredExercises = (dayId: string) => {
    const category = selectedCategories[dayId] || 'ALL';
    return category === 'ALL' 
      ? availableExercises 
      : groupedExercises[category] || [];
  };

  const addWorkoutDay = () => {
    const dayNumber = workoutDays.length + 1;
    const newDay: WorkoutDay = {
      id: `day-${dayNumber}`,
      name: `Day ${dayNumber}`,
      isRestDay: false,
      workoutExercises: [],
      dayNumber: dayNumber,
    };
    setWorkoutDays([...workoutDays, newDay]);
  };

  const removeWorkoutDay = (dayId: string) => {
    setWorkoutDays(prevDays => prevDays.filter(day => day.id !== dayId));
  };

  const toggleRestDay = (dayId: string) => {
    setWorkoutDays(prevDays => prevDays.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          isRestDay: !day.isRestDay,
          workoutExercises: !day.isRestDay ? [] : day.workoutExercises,
        };
      }
      return day;
    }));
  };

  const removeExerciseFromDay = (dayId: string, exerciseId: number) => {
    setWorkoutDays(prevDays => prevDays.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          workoutExercises: day.workoutExercises.filter(ex => ex.id !== exerciseId),
        };
      }
      return day;
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    setWorkoutDays((prev) => prev.map((day) => {
      if (day.isRestDay) return day;
      const ids = day.workoutExercises.map((ex) => `exercise-${ex.id}-${day.id}`);
      const from = ids.indexOf(String(active.id));
      const to = ids.indexOf(String(over.id));
      if (from !== -1 && to !== -1) {
        return { ...day, workoutExercises: arrayMove(day.workoutExercises, from, to) };
      }
      return day;
    }));
  };

  const handleSave = async () => {
    try {
      const endpoint = mode === 'edit' ? `/api/plans/${initialPlan?.id}` : '/api/plans';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: planName,
          days: workoutDays.map(day => ({
            isRestDay: day.isRestDay,
            workoutExercises: day.workoutExercises.map((ex, index) => ({ 
              id: ex.id,
              order: index + 1
            }))
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${mode} plan`);
      }

      const data = await response.json();
      window.location.href = data.redirect || '/plans';
    } catch (error) {
      console.error(`Error ${mode}ing plan:`, error);
      setError(error instanceof Error ? error.message : `Failed to ${mode} plan`);
    }
  };

  const handleOpenNewExerciseDialog = (dayIndex: number) => {
    setCreatingExerciseForDayIndex(dayIndex);
    setOpenNewExerciseDialog(true);
  };

  const handleCloseNewExerciseDialog = () => {
    setOpenNewExerciseDialog(false);
    setNewExercise({ name: '', category: '' as ExerciseCategory });
    setCreatingExerciseForDayIndex(null);
  };

  const handleCreateAndAddExercise = async () => {
    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExercise),
      });

      if (!response.ok) {
        throw new Error('Failed to create exercise');
      }

      const createdExercise = await response.json();

      if (creatingExerciseForDayIndex !== null) {
        setWorkoutDays(prevDays => prevDays.map((day, index) => {
          if (index === creatingExerciseForDayIndex && !day.isRestDay) {
            return {
              ...day,
              workoutExercises: [...day.workoutExercises, createdExercise]
            };
          }
          return day;
        }));
      }

      const exercisesResponse = await fetch('/api/exercises');
      if (exercisesResponse.ok) {
        const data = await exercisesResponse.json() as ExerciseResponse;
        const exercises = Object.entries(data).flatMap(([category, exerciseList]) =>
          exerciseList.map(exercise => ({
            ...exercise,
            category: category as ExerciseCategory
          }))
        );
        setAvailableExercises(exercises);
      }

      handleCloseNewExerciseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exercise');
    }
  };

  const handleAddExercise = (dayId: string) => {
    const selectedExercise = selectedExercises[dayId];
    if (selectedExercise) {
      const exercise = availableExercises.find(ex => ex.id === parseInt(selectedExercise));
      if (exercise) {
        setWorkoutDays(prevDays => prevDays.map(day => {
          if (day.id === dayId && !day.isRestDay) {
            return {
              ...day,
              workoutExercises: [...day.workoutExercises, exercise]
            };
          }
          return day;
        }));
        setSelectedExercises(prev => ({
          ...prev,
          [dayId]: ''
        }));
      }
    }
  };

  if (isLoading) {
    return (
      <ResponsiveContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="lg">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <Box sx={{
        px: { xs: 2, sm: 3 }, 
        pt: { xs: 2, sm: 2, md: 2 },
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header Section */}
        <Box sx={{
          pb: { xs: 2, sm: 3 },
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              color: 'white',
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            {mode === 'edit' ? 'Edit Workout Plan' : 'Create Workout Plan'}
          </Typography>
        </Box>

        {error && (
          <Box sx={{ mb: 3 }}>
            <Alert severity="error" sx={{ 
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'rgba(239, 68, 68, 0.9)'
            }}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Plan Name Section */}
        <Box sx={{ 
          mb: 4,
          borderRadius: 2,
          overflow: 'hidden',
          background: gradients.surface,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <Box sx={{
            p: { xs: 2, sm: 3 },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FitnessCenterIcon sx={{ 
                mr: 1.5, 
                color: 'white',
                fontSize: '1.5rem'
              }} />
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  color: 'white',
                  fontSize: { xs: '1.125rem', sm: '1.25rem' }
                }}
              >
                Plan Details
              </Typography>
            </Box>
            <TextField
              fullWidth
              label="Plan Name"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 2,
                  color: 'white',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-focused': {
                    borderColor: 'rgba(59, 130, 246, 0.5)',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  },
                  '& fieldset': {
                    border: 'none'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: 'rgba(59, 130, 246, 0.8)'
                  }
                },
                '& .MuiInputBase-input': {
                  color: 'white'
                }
              }}
            />
          </Box>
        </Box>

        {/* Days Management Section */}
        <Box sx={{ 
          mb: 4,
          borderRadius: 2,
          overflow: 'hidden',
          background: gradients.surface,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <Box sx={{
            p: { xs: 2, sm: 3 },
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarTodayIcon sx={{ 
                  mr: 1.5, 
                  color: 'white',
                  fontSize: '1.5rem'
                }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'white',
                    fontSize: { xs: '1.125rem', sm: '1.25rem' }
                  }}
                >
                  Workout Days
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addWorkoutDay}
                sx={{
                  background: gradients.primary,
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  color: 'white',
                  '&:hover': {
                    background: gradients.primaryHover,
                    transform: 'translateY(-1px)',
                    boxShadow: '0 8px 25px -8px rgba(59, 130, 246, 0.3)'
                  }
                }}
              >
                Add Day
              </Button>
            </Box>

            <Grid container spacing={3}>
              {[...workoutDays]
                .sort((a, b) => a.dayNumber - b.dayNumber)
                .map((day, dayIndex) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={day.id}>
                  <WorkoutDayCard
                    day={day}
                    dayIndex={dayIndex}
                    availableExercises={availableExercises}
                    selectedCategories={selectedCategories}
                    selectedExercises={selectedExercises}
                    onRemoveDay={removeWorkoutDay}
                    onToggleRestDay={toggleRestDay}
                    onRemoveExercise={removeExerciseFromDay}
                    onAddExercise={handleAddExercise}
                    onCategoryChange={(dayId, category) => setSelectedCategories(prev => ({
                      ...prev,
                      [dayId]: category
                    }))}
                    onExerciseSelect={(dayId, exerciseId) => setSelectedExercises(prev => ({
                      ...prev,
                      [dayId]: exerciseId
                    }))}
                    onCreateExercise={handleOpenNewExerciseDialog}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        {/* Save Button */}
        <Box sx={{ mt: 3 }}>
          <GradientButton
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!planName || workoutDays.length === 0}
            sx={{
              background: gradients.primary,
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: 'white',
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              '&:hover': {
                background: gradients.primaryHover,
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 35px -8px rgba(59, 130, 246, 0.4)'
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.3)',
                transform: 'none',
                boxShadow: 'none'
              }
            }}
          >
            {mode === 'edit' ? 'Update Plan' : 'Create Plan'}
          </GradientButton>
        </Box>
      </Box>

      {/* Create Exercise Dialog */}
      <Dialog 
        open={openNewExerciseDialog} 
        onClose={handleCloseNewExerciseDialog}
        PaperProps={{
          sx: {
            background: gradients.surfaceStrong,
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 600 }}>Create New Exercise</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Exercise Name"
            fullWidth
            value={newExercise.name}
            onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 2,
                color: 'white',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&.Mui-focused': {
                  borderColor: 'rgba(59, 130, 246, 0.5)',
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                },
                '& fieldset': {
                  border: 'none'
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: 'rgba(59, 130, 246, 0.8)'
                }
              },
              '& .MuiInputBase-input': {
                color: 'white'
              }
            }}
          />
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Category</InputLabel>
            <Select
              value={newExercise.category}
              label="Category"
              onChange={(e) => setNewExercise(prev => ({ ...prev, category: e.target.value as ExerciseCategory }))}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 2,
                  color: 'white',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-focused': {
                    borderColor: 'rgba(59, 130, 246, 0.5)',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  },
                  '& fieldset': {
                    border: 'none'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: 'rgba(59, 130, 246, 0.8)'
                  }
                },
                '& .MuiSelect-icon': {
                  color: 'rgba(255, 255, 255, 0.7)'
                }
              }}
            >
              {Object.values(ExerciseCategory).map((category) => (
                <MenuItem key={category} value={category} sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  {category.charAt(0) + category.slice(1).toLowerCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseNewExerciseDialog}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <GradientButton 
            onClick={handleCreateAndAddExercise}
            disabled={!newExercise.name || !newExercise.category}
            sx={{
              background: gradients.primary,
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: 'white',
              '&:hover': {
                background: gradients.primaryHover,
                transform: 'translateY(-1px)',
                boxShadow: '0 8px 25px -8px rgba(59, 130, 246, 0.3)'
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.3)'
              }
            }}
          >
            Create & Add
          </GradientButton>
        </DialogActions>
      </Dialog>
      </DndContext>
    </ResponsiveContainer>
  );
} 
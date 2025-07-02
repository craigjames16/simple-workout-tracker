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
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { ExerciseCategory } from '@prisma/client';
import { ResponsiveContainer } from './ResponsiveContainer';
import GradientButton from './GradientButton';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HotelIcon from '@mui/icons-material/Hotel';

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
    setWorkoutDays(workoutDays.map(day => {
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
    setWorkoutDays(workoutDays.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          workoutExercises: day.workoutExercises.filter(ex => ex.id !== exerciseId),
        };
      }
      return day;
    }));
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    // Return if dropped outside or no destination
    if (!destination) {
      return;
    }

    // Return if dropped in same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceDay = workoutDays.find(day => day.id === source.droppableId);
    const destDay = workoutDays.find(day => day.id === destination.droppableId);

    if (!sourceDay || !destDay || destDay.isRestDay) {
      return;
    }

    const newWorkoutDays = [...workoutDays];
    const sourceExercises = [...sourceDay.workoutExercises];
    const [movedExercise] = sourceExercises.splice(source.index, 1);

    const destExercises = destDay.id === sourceDay.id 
      ? sourceExercises 
      : [...destDay.workoutExercises];
    
    destExercises.splice(destination.index, 0, movedExercise);

    setWorkoutDays(newWorkoutDays.map(day => {
      if (day.id === sourceDay.id) {
        return { ...day, workoutExercises: sourceExercises };
      }
      if (day.id === destDay.id) {
        return { ...day, workoutExercises: destExercises };
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
            workoutExercises: day.workoutExercises.map(ex => ({ id: ex.id }))
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
        setWorkoutDays(workoutDays.map((day, index) => {
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
        setWorkoutDays(workoutDays.map(day => {
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
      <Box sx={{
        p: { xs: 2, sm: 3 }, 
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
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
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
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
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
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.8) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 8px 25px -8px rgba(59, 130, 246, 0.3)'
                  }
                }}
              >
                Add Day
              </Button>
            </Box>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Grid container spacing={3}>
                {[...workoutDays]
                  .sort((a, b) => a.dayNumber - b.dayNumber)
                  .map((day, dayIndex) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={day.id}>
                    <Box sx={{
                      borderRadius: 2,
                      overflow: 'hidden',
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 35px 60px -12px rgba(0, 0, 0, 0.35)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }
                    }}>
                      <Box sx={{
                        p: { xs: 2, sm: 3 },
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {day.isRestDay ? (
                              <HotelIcon sx={{ 
                                mr: 1, 
                                color: 'rgba(156, 163, 175, 0.9)',
                                fontSize: '1.25rem'
                              }} />
                            ) : (
                              <FitnessCenterIcon sx={{ 
                                mr: 1, 
                                color: 'rgba(59, 130, 246, 0.9)',
                                fontSize: '1.25rem'
                              }} />
                            )}
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 700,
                                color: 'white',
                                fontSize: { xs: '1rem', sm: '1.125rem' }
                              }}
                            >
                              {day.name}
                            </Typography>
                          </Box>
                          <IconButton 
                            onClick={() => removeWorkoutDay(day.id)}
                            sx={{ 
                              color: 'rgba(239, 68, 68, 0.7)',
                              '&:hover': {
                                color: 'rgba(239, 68, 68, 0.9)',
                                background: 'rgba(239, 68, 68, 0.1)'
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>

                        <FormControlLabel
                          control={
                            <Switch
                              checked={day.isRestDay}
                              onChange={() => toggleRestDay(day.id)}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: 'rgba(156, 163, 175, 0.9)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(156, 163, 175, 0.08)',
                                  },
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: 'rgba(156, 163, 175, 0.5)',
                                },
                              }}
                            />
                          }
                          label={
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>
                              Rest Day
                            </Typography>
                          }
                          sx={{ mb: 2 }}
                        />

                        {!day.isRestDay && (
                          <Box sx={{ mb: 2 }}>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Category</InputLabel>
                              <Select
                                value={selectedCategories[day.id] || 'ALL'}
                                label="Category"
                                onChange={(e) => setSelectedCategories(prev => ({
                                  ...prev,
                                  [day.id]: e.target.value
                                }))}
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
                                <MenuItem value="ALL" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>All Categories</MenuItem>
                                {Object.values(ExerciseCategory).map((category) => (
                                  <MenuItem key={category} value={category} sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                    {category.charAt(0) + category.slice(1).toLowerCase()}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>

                            <FormControl fullWidth sx={{ mb: 2 }}>
                              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Exercise</InputLabel>
                              <Select
                                value={selectedExercises[day.id] || ''}
                                label="Exercise"
                                onChange={(e) => setSelectedExercises(prev => ({
                                  ...prev,
                                  [day.id]: e.target.value
                                }))}
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
                                {filteredExercises(day.id)
                                  .map((exercise) => (
                                    <MenuItem key={exercise.id} value={exercise.id} sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                      {exercise.name}
                                    </MenuItem>
                                  ))}
                              </Select>
                            </FormControl>

                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                variant="contained"
                                onClick={() => handleAddExercise(day.id)}
                                disabled={!selectedExercises[day.id]}
                                sx={{ 
                                  flex: 1,
                                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.8) 100%)',
                                  border: '1px solid rgba(59, 130, 246, 0.2)',
                                  color: 'white',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 8px 25px -8px rgba(59, 130, 246, 0.3)'
                                  },
                                  '&:disabled': {
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.3)'
                                  }
                                }}
                              >
                                Add
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={() => handleOpenNewExerciseDialog(dayIndex)}
                                startIcon={<AddIcon />}
                                sx={{
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  color: 'rgba(255, 255, 255, 0.8)',
                                  '&:hover': {
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    background: 'rgba(255, 255, 255, 0.05)'
                                  }
                                }}
                              >
                                Create New
                              </Button>
                            </Box>
                          </Box>
                        )}
                        
                        {day.isRestDay ? (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.6)',
                              textAlign: 'center',
                              fontStyle: 'italic'
                            }}
                          >
                            Rest Day - No exercises
                          </Typography>
                        ) : (
                          <Droppable 
                            droppableId={day.id} 
                            isDropDisabled={day.isRestDay}
                            type="EXERCISE"
                            isCombineEnabled={false}
                            ignoreContainerClipping={false}
                          >
                            {(provided, snapshot) => (
                              <Box
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                sx={{ 
                                  minHeight: 100,
                                  backgroundColor: snapshot.isDraggingOver 
                                    ? 'rgba(59, 130, 246, 0.1)' 
                                    : 'rgba(255, 255, 255, 0.02)',
                                  transition: 'background-color 0.2s ease',
                                  borderRadius: 1,
                                  padding: 1,
                                  border: '1px dashed rgba(255, 255, 255, 0.1)'
                                }}
                              >
                                {day.workoutExercises.map((exercise, index) => (
                                  <Draggable
                                    key={`${exercise.id}`}
                                    draggableId={`${day.id}-exercise-${exercise.id}`}
                                    index={index}
                                    isDragDisabled={false}
                                  >
                                    {(provided, snapshot) => (
                                      <Box
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        sx={{
                                          p: 1.5,
                                          mb: 1,
                                          bgcolor: snapshot.isDragging 
                                            ? 'rgba(59, 130, 246, 0.2)'
                                            : 'rgba(255, 255, 255, 0.05)',
                                          borderRadius: 1,
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          border: '1px solid rgba(255, 255, 255, 0.1)',
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)'
                                          }
                                        }}
                                      >
                                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem' }}>
                                          {exercise.name}
                                        </Typography>
                                        <IconButton
                                          size="small"
                                          onClick={() => removeExerciseFromDay(day.id, exercise.id)}
                                          sx={{ 
                                            color: 'rgba(239, 68, 68, 0.7)',
                                            '&:hover': {
                                              color: 'rgba(239, 68, 68, 0.9)',
                                              background: 'rgba(239, 68, 68, 0.1)'
                                            }
                                          }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </Box>
                            )}
                          </Droppable>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </DragDropContext>
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
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.8) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: 'white',
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)',
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
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
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
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.8) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)',
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
    </ResponsiveContainer>
  );
} 
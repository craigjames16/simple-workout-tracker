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
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { ExerciseCategory } from '@prisma/client';
import { ResponsiveContainer } from './ResponsiveContainer';
import GradientButton from './GradientButton';
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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceDay = workoutDays.find(day => day.id === result.source.droppableId);
    const destDay = workoutDays.find(day => day.id === result.destination.droppableId);

    if (!sourceDay || !destDay || destDay.isRestDay) return;

    const exercise = sourceDay.workoutExercises[result.source.index];
    
    const newWorkoutDays = workoutDays.map(day => {
      if (day.id === sourceDay.id) {
        return {
          ...day,
          workoutExercises: day.workoutExercises.filter((_, index) => index !== result.source.index),
        };
      }
      if (day.id === destDay.id) {
        const newExercises = [...day.workoutExercises];
        newExercises.splice(result.destination.index, 0, exercise);
        return {
          ...day,
          workoutExercises: newExercises,
        };
      }
      return day;
    });

    setWorkoutDays(newWorkoutDays);
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
      <Container maxWidth="xl">
        <Paper sx={{ p: 3, mt: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Paper>
      </Container>
    );
  }

  return (
    <ResponsiveContainer maxWidth="lg">
      <Paper sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            {mode === 'edit' ? 'Edit Workout Plan' : 'Create Workout Plan'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addWorkoutDay}
          >
            Add Day
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Plan Name"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            sx={{ mb: 2 }}
          />
        </Box>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Grid container spacing={2}>
            {[...workoutDays]
              .sort((a, b) => a.dayNumber - b.dayNumber)
              .map((day, dayIndex) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={day.id}>
                <Card sx={{ bgcolor: '#171717 !important', boxShadow: '5px 5px 5px rgba(0, 0, 0, 0.1)' }}>
                  <CardHeader
                    title={day.name}
                    action={
                      <IconButton onClick={() => removeWorkoutDay(day.id)}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  />
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={day.isRestDay}
                          onChange={() => toggleRestDay(day.id)}
                        />
                      }
                      label="Rest Day"
                      sx={{ mb: 2 }}
                    />

                    {!day.isRestDay && (
                      <Box sx={{ mb: 2 }}>
                        <FormControl fullWidth>
                          <InputLabel>Category</InputLabel>
                          <Select
                            value={selectedCategories[day.id] || 'ALL'}
                            label="Category"
                            onChange={(e) => setSelectedCategories(prev => ({
                              ...prev,
                              [day.id]: e.target.value
                            }))}
                            sx={{ mb: 2 }}
                          >
                            <MenuItem value="ALL">All Categories</MenuItem>
                            {Object.values(ExerciseCategory).map((category) => (
                              <MenuItem key={category} value={category}>
                                {category.charAt(0) + category.slice(1).toLowerCase()}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl fullWidth>
                          <InputLabel>Exercise</InputLabel>
                          <Select
                            value={selectedExercises[day.id] || ''}
                            label="Exercise"
                            onChange={(e) => setSelectedExercises(prev => ({
                              ...prev,
                              [day.id]: e.target.value
                            }))}
                          >
                            {filteredExercises(day.id)
                              .map((exercise) => (
                                <MenuItem key={exercise.id} value={exercise.id}>
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
                            sx={{ flex: 1 }}
                          >
                            Add
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => handleOpenNewExerciseDialog(dayIndex)}
                            startIcon={<AddIcon />}
                          >
                            Create New
                          </Button>
                        </Box>
                      </Box>
                    )}
                    
                    {day.isRestDay ? (
                      <Typography variant="body2" color="textSecondary" align="center">
                        Rest Day - No exercises
                      </Typography>
                    ) : (
                      <Droppable droppableId={day.id}>
                        {(provided) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            sx={{ minHeight: 100 }}
                          >
                            {day.workoutExercises.map((exercise, index) => (
                              <Draggable
                                key={exercise.id}
                                draggableId={`${day.id}-exercise-${exercise.id}`}
                                index={index}
                              >
                                {(provided) => (
                                  <Box
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    sx={{
                                      p: 1,
                                      mb: 1,
                                      bgcolor: 'background.paper',
                                      borderRadius: 1,
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      boxShadow: 1,
                                    }}
                                  >
                                    <Typography>{exercise.name}</Typography>
                                    <IconButton
                                      size="small"
                                      onClick={() => removeExerciseFromDay(day.id, exercise.id)}
                                    >
                                      <DeleteIcon />
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
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DragDropContext>

        <Box sx={{ mt: 3 }}>
          <GradientButton
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!planName || workoutDays.length === 0}
          >
            Save Plan
          </GradientButton>
        </Box>
      </Paper>
      <Dialog open={openNewExerciseDialog} onClose={handleCloseNewExerciseDialog}>
        <DialogTitle>Create New Exercise</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Exercise Name"
            fullWidth
            value={newExercise.name}
            onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={newExercise.category}
              label="Category"
              onChange={(e) => setNewExercise(prev => ({ ...prev, category: e.target.value as ExerciseCategory }))}
            >
              {Object.values(ExerciseCategory).map((category) => (
                <MenuItem key={category} value={category}>
                  {category.charAt(0) + category.slice(1).toLowerCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewExerciseDialog}>Cancel</Button>
          <GradientButton 
            onClick={handleCreateAndAddExercise}
            disabled={!newExercise.name || !newExercise.category}
          >
            Create & Add
          </GradientButton>
        </DialogActions>
      </Dialog>
    </ResponsiveContainer>
  );
} 
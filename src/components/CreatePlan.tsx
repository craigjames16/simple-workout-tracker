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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import TextField from '@mui/material/TextField';

interface Exercise {
  id: number;
  name: string;
}

interface WorkoutDay {
  id: string;
  name: string;
  isRestDay: boolean;
  exercises: Exercise[];
}

export default function CreatePlan() {
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [planName, setPlanName] = useState('');

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/exercises');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch exercises');
      }

      setAvailableExercises(data);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch exercises');
    } finally {
      setIsLoading(false);
    }
  };

  const addWorkoutDay = () => {
    const newDay: WorkoutDay = {
      id: `day-${workoutDays.length + 1}`,
      name: `Day ${workoutDays.length + 1}`,
      isRestDay: false,
      exercises: [],
    };
    setWorkoutDays([...workoutDays, newDay]);
  };

  const removeWorkoutDay = (dayId: string) => {
    setWorkoutDays(prevDays => {
      const filteredDays = prevDays.filter(day => day.id !== dayId);
      return filteredDays.map((day, index) => ({
        ...day,
        id: `day-${index + 1}`,
        name: `Day ${index + 1}`
      }));
    });
  };

  const toggleRestDay = (dayId: string) => {
    setWorkoutDays(workoutDays.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          isRestDay: !day.isRestDay,
          exercises: !day.isRestDay ? [] : day.exercises, // Clear exercises when switching to rest day
        };
      }
      return day;
    }));
  };

  const addExerciseToDay = (dayId: string, exercise: Exercise) => {
    setWorkoutDays(workoutDays.map(day => {
      if (day.id === dayId && !day.isRestDay) {
        return {
          ...day,
          exercises: [...day.exercises, exercise],
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
          exercises: day.exercises.filter(ex => ex.id !== exerciseId),
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

    const exercise = sourceDay.exercises[result.source.index];
    
    const newWorkoutDays = workoutDays.map(day => {
      if (day.id === sourceDay.id) {
        return {
          ...day,
          exercises: day.exercises.filter((_, index) => index !== result.source.index),
        };
      }
      if (day.id === destDay.id) {
        const newExercises = [...day.exercises];
        newExercises.splice(result.destination.index, 0, exercise);
        return {
          ...day,
          exercises: newExercises,
        };
      }
      return day;
    });

    setWorkoutDays(newWorkoutDays);
  };

  const handleSavePlan = async () => {
    if (!planName || workoutDays.length === 0) {
      setError('Please provide a plan name and at least one day');
      return;
    }

    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: planName,
          days: workoutDays.map(day => ({
            isRestDay: day.isRestDay,
            exercises: day.exercises
          }))
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save plan');
      }

      // Reset form
      setPlanName('');
      setWorkoutDays([]);
      setError(null);
    } catch (error) {
      console.error('Error saving plan:', error);
      setError(error instanceof Error ? error.message : 'Failed to save plan');
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
    <Container maxWidth="xl">
      <Paper sx={{ p: 3, mt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Create Workout Plan</Typography>
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
            {workoutDays.map((day) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={day.id}>
                <Card>
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
                        <Select
                          fullWidth
                          value={selectedExercise}
                          onChange={(e) => {
                            const exercise = availableExercises.find(ex => ex.id.toString() === e.target.value);
                            if (exercise) {
                              addExerciseToDay(day.id, exercise);
                              setSelectedExercise('');
                            }
                          }}
                          displayEmpty
                        >
                          <MenuItem value="" disabled>Add Exercise</MenuItem>
                          {availableExercises.map((exercise) => (
                            <MenuItem key={exercise.id} value={exercise.id.toString()}>
                              {exercise.name}
                            </MenuItem>
                          ))}
                        </Select>
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
                            {day.exercises.map((exercise, index) => (
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
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleSavePlan}
            disabled={!planName || workoutDays.length === 0}
          >
            Save Plan
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 
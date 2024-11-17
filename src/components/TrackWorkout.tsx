'use client';

import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  IconButton,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

interface Exercise {
  name: string;
  sets: Array<{
    reps: number;
    weight?: number;
  }>;
}

interface WorkoutSession {
  workoutName: string;
  exercises: Exercise[];
}

const currentWorkout: WorkoutSession = {
  workoutName: 'Full Body Workout',
  exercises: [
    { name: 'Push-ups', sets: [] },
    { name: 'Squats', sets: [] },
    { name: 'Pull-ups', sets: [] },
  ],
};

export default function TrackWorkout() {
  const [workout, setWorkout] = useState<WorkoutSession>(currentWorkout);

  const handleAddSet = (exerciseIndex: number) => {
    const newWorkout = { ...workout };
    newWorkout.exercises[exerciseIndex].sets.push({ reps: 0 });
    setWorkout(newWorkout);
  };

  const handleUpdateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight',
    value: number
  ) => {
    const newWorkout = { ...workout };
    newWorkout.exercises[exerciseIndex].sets[setIndex][field] = value;
    setWorkout(newWorkout);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const newWorkout = { ...workout };
    newWorkout.exercises[exerciseIndex].sets.splice(setIndex, 1);
    setWorkout(newWorkout);
  };

  const handleSaveWorkout = () => {
    console.log('Saving completed workout:', workout);
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Track: {workout.workoutName}
        </Typography>

        <List>
          {workout.exercises.map((exercise, exerciseIndex) => (
            <ListItem
              key={exercise.name}
              sx={{ flexDirection: 'column', alignItems: 'stretch' }}
            >
              <Box sx={{ width: '100%', mb: 2 }}>
                <Typography variant="h6">{exercise.name}</Typography>
                
                {exercise.sets.map((set, setIndex) => (
                  <Grid container spacing={2} key={setIndex} sx={{ mt: 1 }}>
                    <Grid item xs={4}>
                      <TextField
                        label="Reps"
                        type="number"
                        value={set.reps}
                        onChange={(e) => handleUpdateSet(
                          exerciseIndex,
                          setIndex,
                          'reps',
                          parseInt(e.target.value)
                        )}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="Weight (kg)"
                        type="number"
                        value={set.weight || ''}
                        onChange={(e) => handleUpdateSet(
                          exerciseIndex,
                          setIndex,
                          'weight',
                          parseInt(e.target.value)
                        )}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <IconButton
                        onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
                
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => handleAddSet(exerciseIndex)}
                  sx={{ mt: 1 }}
                >
                  Add Set
                </Button>
              </Box>
            </ListItem>
          ))}
        </List>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleSaveWorkout}
          sx={{ mt: 2 }}
        >
          Complete Workout
        </Button>
      </Paper>
    </Container>
  );
} 
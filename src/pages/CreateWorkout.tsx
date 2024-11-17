import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

// This would typically come from an API or database
const exerciseList = [
  'Push-ups',
  'Pull-ups',
  'Squats',
  'Deadlifts',
  'Bench Press',
  // Add more exercises
];

function CreateWorkout() {
  const [workoutName, setWorkoutName] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [exercises, setExercises] = useState<string[]>([]);

  const handleAddExercise = () => {
    if (selectedExercise && !exercises.includes(selectedExercise)) {
      setExercises([...exercises, selectedExercise]);
      setSelectedExercise('');
    }
  };

  const handleRemoveExercise = (exercise: string) => {
    setExercises(exercises.filter(e => e !== exercise));
  };

  const handleSaveWorkout = () => {
    const workout = {
      name: workoutName,
      exercises: exercises,
    };
    // Save workout to storage/database
    console.log('Saving workout:', workout);
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Create New Workout
        </Typography>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Workout Name"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Select
              fullWidth
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              displayEmpty
            >
              <MenuItem value="" disabled>Select Exercise</MenuItem>
              {exerciseList.map((exercise) => (
                <MenuItem key={exercise} value={exercise}>
                  {exercise}
                </MenuItem>
              ))}
            </Select>
            <Button variant="contained" onClick={handleAddExercise}>
              Add
            </Button>
          </Box>
        </Box>
        
        <List>
          {exercises.map((exercise) => (
            <ListItem
              key={exercise}
              secondaryAction={
                <IconButton onClick={() => handleRemoveExercise(exercise)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText primary={exercise} />
            </ListItem>
          ))}
        </List>

        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleSaveWorkout}
          disabled={!workoutName || exercises.length === 0}
        >
          Save Workout
        </Button>
      </Paper>
    </Container>
  );
}

export default CreateWorkout; 
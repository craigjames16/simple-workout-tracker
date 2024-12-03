'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Box,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FloatingActionButton from '@/components/FloatingActionButton';
import {ResponsiveContainer} from '@/components/ResponsiveContainer';
interface Exercise {
  id: number;
  name: string;
  category: string;
}

type ExercisesByCategory = {
  [key: string]: Exercise[];
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<ExercisesByCategory>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [openDialog, setOpenDialog] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    category: '',
  });

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await fetch('/api/exercises');
        if (!response.ok) {
          throw new Error('Failed to fetch exercises');
        }
        const data = await response.json();
        setExercises(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  const handleCreateExercise = async () => {
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

      // Refresh exercises
      const updatedResponse = await fetch('/api/exercises');
      const data = await updatedResponse.json();
      setExercises(data);
      
      setOpenDialog(false);
      setNewExercise({ name: '', category: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exercise');
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const categories = ['ALL', ...Object.keys(exercises)];
  const filteredExercises = selectedCategory === 'ALL' 
    ? Object.values(exercises).flat()
    : exercises[selectedCategory] || [];

  return (
      <ResponsiveContainer maxWidth="md">
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5">
            Exercises
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={selectedCategory}
              onChange={(_, newValue) => setSelectedCategory(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {categories.map((category) => (
                <Tab 
                  key={category} 
                  label={category.charAt(0) + category.slice(1).toLowerCase()} 
                  value={category}
                />
              ))}
            </Tabs>
          </Box>

          <Grid container spacing={2}>
            {filteredExercises.map((exercise) => (
              <Grid item xs={12} sm={6} md={4} key={exercise.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {exercise.name}
                    </Typography>
                    <Typography color="text.secondary">
                      Category: {exercise.category.charAt(0) + exercise.category.slice(1).toLowerCase()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

        <FloatingActionButton
          icon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        />

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
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
                onChange={(e) => setNewExercise(prev => ({ ...prev, category: e.target.value }))}
              >
                {Object.keys(exercises).map((category) => (
                  <MenuItem key={category} value={category}>
                    {category.charAt(0) + category.slice(1).toLowerCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateExercise}
              disabled={!newExercise.name || !newExercise.category}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </ResponsiveContainer>
  );
} 
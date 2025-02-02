'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer as RechartsContainer } from 'recharts';
import FloatingActionButton from '@/components/FloatingActionButton';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { motion } from "framer-motion";
import GradientButton from '@/components/GradientButton';
import ExerciseHistoryModal from '@/components/ExerciseHistoryModal';

interface Exercise {
  id: number;
  name: string;
  category: string;
  history: ExerciseSet[];
  workoutInstances: { workoutInstanceId: string; volume: number }[];
  highestWeight: number;
}

interface ExerciseSet {
  id: number;
  weight: number;
  reps: number;
  date: string;
}

type ExercisesByCategory = {
  [key: string]: Exercise[];
};

type SortColumn = 'name' | 'category' | 'highestWeight';
type SortDirection = 'asc' | 'desc';

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
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [sortBy, setSortBy] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const isMobile = useMediaQuery((theme: any) => theme.breakpoints.down('sm'));

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

  const handleShowHistory = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowHistoryDialog(true);
  };

  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const getSortedExercises = (exercises: Exercise[]) => {
    return [...exercises].sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortBy) {
        case 'name':
          return direction * a.name.localeCompare(b.name);
        case 'category':
          return direction * a.category.localeCompare(b.category);
        case 'highestWeight':
          return direction * (a.highestWeight - b.highestWeight);
        default:
          return 0;
      }
    });
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
    ? getSortedExercises(Object.values(exercises).flat())
    : getSortedExercises(exercises[selectedCategory] || []);

  return (
    <ResponsiveContainer maxWidth="md">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
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

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell 
                  onClick={() => handleSort('name')}
                  sx={{ cursor: 'pointer' }}
                >
                  Name
                  {sortBy === 'name' && (
                    <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </TableCell>
                {!isMobile && (
                  <TableCell 
                    onClick={() => handleSort('category')}
                    sx={{ cursor: 'pointer' }}
                  >
                    Category
                    {sortBy === 'category' && (
                      <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </TableCell>
                )}
                <TableCell 
                  onClick={() => handleSort('highestWeight')}
                  sx={{ cursor: 'pointer' }}
                >
                  Highest Weight
                  {sortBy === 'highestWeight' && (
                    <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExercises.map((exercise) => {
                return (
                  <TableRow key={exercise.id}>
                    <TableCell>{exercise.name}</TableCell>
                    {!isMobile && (
                      <TableCell>
                        {exercise.category.charAt(0) + exercise.category.slice(1).toLowerCase()}
                      </TableCell>
                    )}
                    <TableCell>{exercise.highestWeight || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleShowHistory(exercise)}>
                        <BarChartIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <ExerciseHistoryModal
        open={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        exerciseName={selectedExercise?.name || ''}
        history={selectedExercise?.workoutInstances || []}
      />

      <FloatingActionButton
        icon={<AddIcon />}
        onClick={() => setOpenDialog(true)}
      />

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Exercise</DialogTitle>
        <DialogContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Box
              component={motion.form}
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ type: "spring" }}
              sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <TextField
                fullWidth
                label="Exercise name"
                value={newExercise.name}
                onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
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
              <Button
                component={motion.button}
                variant="contained"
                fullWidth
                onClick={handleCreateExercise}
                disabled={!newExercise.name || !newExercise.category}
              >
                Create
              </Button>
            </Box>
          </motion.div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </ResponsiveContainer>
  );
} 
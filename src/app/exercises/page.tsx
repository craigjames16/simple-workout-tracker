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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer as RechartsContainer } from 'recharts';
import FloatingActionButton from '@/components/FloatingActionButton';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { motion } from "framer-motion";

interface Exercise {
  id: number;
  name: string;
  category: string;
  history: ExerciseSet[];
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

  const ExerciseHistoryChart = ({ exerciseId }: { exerciseId: number }) => {
    const data = selectedExercise?.history || [];
    const chartData = data.map(set => ({
      date: new Date(set.date).toLocaleDateString(),
      weight: set.weight,
    }));

    return (
      <Box sx={{ width: '100%', height: 300 }}>
        <RechartsContainer>
          <LineChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="#8884d8" 
              dot={false} 
            />
          </LineChart>
        </RechartsContainer>
      </Box>
    );
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
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Last Weight</TableCell>
                <TableCell>Last Reps</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExercises.map((exercise) => {
                const lastSet = exercise.history?.[exercise.history.length - 1];
                
                return (
                  <TableRow key={exercise.id}>
                    <TableCell>{exercise.name}</TableCell>
                    <TableCell>
                      {exercise.category.charAt(0) + exercise.category.slice(1).toLowerCase()}
                    </TableCell>
                    <TableCell>{lastSet?.weight || '-'}</TableCell>
                    <TableCell>{lastSet?.reps || '-'}</TableCell>
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

      <Dialog
        open={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedExercise?.name} History
        </DialogTitle>
        <DialogContent>
          {selectedExercise && <ExerciseHistoryChart exerciseId={selectedExercise.id} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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
            <motion.form
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ type: "spring" }}
            >
              <motion.input
                whileFocus={{ scale: 1.02 }}
                className="border rounded p-2 mb-4"
                type="text"
                placeholder="Exercise name"
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
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
                onClick={handleCreateExercise}
                disabled={!newExercise.name || !newExercise.category}
              >
                Create
              </motion.button>
            </motion.form>
          </motion.div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </ResponsiveContainer>
  );
} 
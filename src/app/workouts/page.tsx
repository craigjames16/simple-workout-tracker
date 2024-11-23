'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Box,
  Button,
} from '@mui/material';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

interface WorkoutInstance {
  id: number;
  workout: {
    name: string;
  };
  startedAt: string;
  completedAt: string | null;
  sets: Array<{
    exercise: {
      name: string;
    };
    reps: number;
    weight: number;
  }>;
  planInstanceDay: Array<{
    planInstance: {
      plan: {
        name: string;
      };
      mesocycle?: {
        name: string;
        id: number;
      };
      iterationNumber?: number;
      rir?: number;
    };
  }>;
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<WorkoutInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const response = await fetch('/api/workout-instances');
        if (!response.ok) {
          throw new Error('Failed to fetch workouts');
        }
        const data = await response.json();
        setWorkouts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Workouts
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Workout</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Sets</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workouts
                .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
                .map((workout) => (
                  <TableRow key={workout.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FitnessCenterIcon sx={{ mr: 1 }} />
                        {workout.workout.name}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {workout.planInstanceDay[0] && (
                        <Box>
                          <Typography variant="body2">
                            {workout.planInstanceDay[0].planInstance.plan.name}
                          </Typography>
                          {workout.planInstanceDay[0].planInstance.mesocycle && (
                            <Box sx={{ mt: 0.5 }}>
                              <Chip
                                size="small"
                                component={Link}
                                href={`/mesocycles/${workout.planInstanceDay[0].planInstance.mesocycle.id}`}
                                label={`${workout.planInstanceDay[0].planInstance.mesocycle.name} - Iteration ${workout.planInstanceDay[0].planInstance.iterationNumber}`}
                                clickable
                              />
                              {workout.planInstanceDay[0].planInstance.rir !== undefined && (
                                <Chip
                                  size="small"
                                  label={`RIR: ${workout.planInstanceDay[0].planInstance.rir}`}
                                  sx={{ ml: 0.5 }}
                                />
                              )}
                            </Box>
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(workout.startedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {workout.completedAt ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          color="success"
                          size="small"
                          label="Completed"
                        />
                      ) : (
                        <Chip
                          color="primary"
                          size="small"
                          label="In Progress"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {workout.sets.length} sets
                    </TableCell>
                    <TableCell align="right">
                      {!workout.completedAt && (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          component={Link}
                          href={`/track/${workout.id}`}
                          startIcon={<ArrowForwardIcon />}
                        >
                          Continue
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
} 
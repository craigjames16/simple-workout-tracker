'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import Link from 'next/link';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';

interface PlanInstance {
  id: number;
  status: string | null;
  iterationNumber: number;
  rir: number;
  completedAt: string | null;
  days: Array<{
    isComplete: boolean;
    planDay: {
      isRestDay: boolean;
    };
    workoutInstance: {
      completedAt: string | null;
    } | null;
  }>;
}

interface Mesocycle {
  id: number;
  name: string;
  plan: {
    id: number;
    name: string;
  };
  iterations: number;
  status: string | null;
  instances: PlanInstance[];
  startedAt: string;
  completedAt: string | null;
}

export default function MesocycleDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [mesocycle, setMesocycle] = useState<Mesocycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchMesocycle = async () => {
      try {
        const response = await fetch(`/api/mesocycles/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch mesocycle');
        }
        const data = await response.json();
        setMesocycle(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMesocycle();
  }, [params.id]);

  const calculateProgress = (instances: PlanInstance[]) => {
    if (!instances.length) return 0;
    const completedCount = instances.filter(i => i.completedAt).length;
    return (completedCount / instances.length) * 100;
  };

  const isInstanceComplete = (instance: PlanInstance) => {
    if (instance.completedAt) return true;
    
    return instance.days.every(day => 
      day.planDay.isRestDay ? day.isComplete : day.workoutInstance?.completedAt != null
    );
  };

  const getCurrentIteration = (instances: PlanInstance[]) => {
    return instances.find(i => !isInstanceComplete(i));
  };

  const canStartIteration = (instance: PlanInstance, instances: PlanInstance[]) => {
    if (isInstanceComplete(instance)) return false;

    if (instance.status === 'IN_PROGRESS') return false;

    if (instance.iterationNumber === 1) return true;

    const previousIterations = instances.filter(i => i.iterationNumber < instance.iterationNumber);
    return previousIterations.every(i => isInstanceComplete(i));
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/mesocycles/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete mesocycle');
      }

      // Redirect to mesocycles list
      router.push('/mesocycles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete mesocycle');
      setDeleteDialogOpen(false);
    }
  };

  const handleStartIteration = async (instanceId: number) => {
    try {
      // Update the plan instance status to IN_PROGRESS
      const response = await fetch(`/api/plan-instances/${instanceId}/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start iteration');
      }

      // Refresh the mesocycle data
      const mesocycleResponse = await fetch(`/api/mesocycles/${params.id}`);
      if (!mesocycleResponse.ok) {
        throw new Error('Failed to refresh mesocycle data');
      }
      const data = await mesocycleResponse.json();
      setMesocycle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start iteration');
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !mesocycle) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error">{error || 'Mesocycle not found'}</Typography>
      </Container>
    );
  }

  const progress = calculateProgress(mesocycle.instances);
  const currentIteration = getCurrentIteration(mesocycle.instances);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" gutterBottom>
              {mesocycle.name}
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Mesocycle
            </Button>
          </Box>
          <Typography color="text.secondary" gutterBottom>
            Based on plan: {mesocycle.plan.name}
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress: {Math.round(progress)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {mesocycle.instances.filter(i => i.completedAt).length} / {mesocycle.iterations} iterations completed
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 8,
                borderRadius: 4,
                backgroundColor: 'grey.300',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                }
              }}
            />
          </Box>
        </Box>

        <Grid container spacing={2}>
          {mesocycle.instances
            .sort((a, b) => a.iterationNumber - b.iterationNumber)
            .map((instance) => (
              <Grid item xs={12} sm={6} md={4} key={instance.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Iteration {instance.iterationNumber}
                      </Typography>
                      {isInstanceComplete(instance) && (
                        <CheckCircleIcon color="success" />
                      )}
                    </Box>
                    
                    <Typography color="text.secondary" gutterBottom>
                      RIR: {instance.rir}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      Status: {isInstanceComplete(instance) ? 'Complete' : instance.status || 'Not Started'}
                    </Typography>

                    {!isInstanceComplete(instance) && (
                      <>
                        {instance.status === 'IN_PROGRESS' ? (
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<ArrowForwardIcon />}
                            fullWidth
                            sx={{ mt: 2 }}
                            component={Link}
                            href={`/plans/instance/${instance.id}`}
                          >
                            Continue Iteration
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<PlayArrowIcon />}
                            fullWidth
                            sx={{ mt: 2 }}
                            onClick={() => handleStartIteration(instance.id)}
                            disabled={!canStartIteration(instance, mesocycle.instances)}
                          >
                            Start Iteration
                          </Button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>

        {mesocycle.status === 'COMPLETE' && (
          <Alert severity="success" sx={{ mt: 3 }}>
            Mesocycle completed! Great job!
          </Alert>
        )}
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Mesocycle</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this mesocycle? This will delete all associated plan instances, 
            workout instances, and progress data. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 
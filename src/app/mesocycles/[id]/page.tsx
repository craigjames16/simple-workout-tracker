'use client';

import { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import Link from 'next/link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useRouter } from 'next/navigation';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import LinearProgress from '@mui/material/LinearProgress';

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
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

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

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'COMPLETE':
        return <CheckCircleIcon color="success" />;
      case 'IN_PROGRESS':
        return <PlayCircleIcon color="primary" />;
      default:
        return <PlayCircleOutlineIcon color="action" />;
    }
  };

  if (loading) {
    return (
      <ResponsiveContainer maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </ResponsiveContainer>
    );
  }

  if (error || !mesocycle) {
    return (
      <ResponsiveContainer>
        <Typography color="error">{error || 'Mesocycle not found'}</Typography>
      </ResponsiveContainer>
    );
  }

  const progress = calculateProgress(mesocycle.instances);

  return (
    <ResponsiveContainer>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              {mesocycle.name}
            </Typography>
            <IconButton
              onClick={(event) => setMenuAnchorEl(event.currentTarget)}
              size="small"
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={() => setMenuAnchorEl(null)}
            >
              <MenuItem
                onClick={() => {
                  setMenuAnchorEl(null);
                  setDeleteDialogOpen(true);
                }}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
                Delete Mesocycle
              </MenuItem>
            </Menu>
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
          </Box>
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {mesocycle.instances
            .sort((a, b) => a.iterationNumber - b.iterationNumber)
            .map((instance) => {
              const isComplete = isInstanceComplete(instance);
              const isInProgress = instance.status === 'IN_PROGRESS';
              const canStart = !isComplete && !isInProgress && 
                mesocycle.instances
                  .filter(i => i.iterationNumber < instance.iterationNumber)
                  .every(i => isInstanceComplete(i));

              let href = '';
              if (isInProgress || canStart) {
                href = `/plans/instance/${instance.id}`;
              }

              return (
                <Box
                  key={instance.id}
                  component={href ? Link : 'div'}
                  href={href}
                  sx={{ 
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { sm: 'center' },
                    p: 2,
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s',
                    ...(href && {
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3,
                        backgroundColor: 'action.hover'
                      }
                    })
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    flex: 1,
                    gap: 2,
                  }}>
                    {getStatusIcon(instance.status)}
                    <Box>
                      <Typography variant="h6" sx={{ mb: 0.5 }}>
                        Iteration {instance.iterationNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Target RIR: {instance.rir}
                      </Typography>
                    </Box>
                  </Box>
                  {href && (
                    <Typography 
                      variant="body2" 
                      color="primary"
                      sx={{ 
                        mt: { xs: 2, sm: 0 },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      {isInProgress ? 'Continue Iteration' : 'Start Iteration'} →
                    </Typography>
                  )}
                </Box>
              );
            })}
        </Box>

        {mesocycle.status === 'COMPLETE' && (
          <Box sx={{ mt: 3 }}>
            Mesocycle completed! Great job!
          </Box>
        )}
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Mesocycle</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this mesocycle? This will delete all associated plan instances, 
          workout instances, and progress data. This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </ResponsiveContainer>
  );
} 
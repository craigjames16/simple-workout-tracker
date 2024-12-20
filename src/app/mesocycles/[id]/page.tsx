'use client';

import { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Card,
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
    id: number;
    isComplete: boolean;
    planDay: {
      isRestDay: boolean;
      dayNumber: number;
    };
    workoutInstance: {
      id: number;
      completedAt: string | null;
      workoutExercises: Array<{
        id: number;
        exercise: {
          name: string;
        };
      }>;
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

  const handleCompleteRestDay = async (instanceId: number, dayId: number) => {
    try {
      const response = await fetch(
        `/api/plan-instances/${instanceId}/days/${dayId}/complete-rest`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to complete rest day');
      }

      // Refresh the page data
      const updatedMesocycle = await fetch(`/api/mesocycles/${params.id}`);
      const data = await updatedMesocycle.json();
      setMesocycle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleStartWorkout = async (instanceId: number, dayId: number) => {
    try {
      const response = await fetch(
        `/api/plan-instances/${instanceId}/days/${dayId}/start`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to start workout');
      }

      const workoutInstance = await response.json();

      // Redirect to the track page with the new workout instance
      window.location.href = `/track/${workoutInstance.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
                {mesocycle.instances.filter(i => i.completedAt).length} / {mesocycle.iterations} Weeks completed
              </Typography>
            </Box>
          </Box>
        </Box>
        <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 8,
                mb: 2,
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
              return (
                <Card
                  key={instance.id}
                  sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    p: 2,
                    gap: 2,
                    transition: 'all 0.2s',
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                  }}>
                    {getStatusIcon(instance.status)}
                    <Box>
                      <Typography 
                        variant="h6" 
                        component={Link}
                        href={`/plans/instance/${instance.id}`}
                        sx={{ 
                          mb: 0.5,
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        Week {instance.iterationNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Target RIR: {instance.rir}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {instance.days
                      .sort((a, b) => a.planDay.dayNumber - b.planDay.dayNumber)
                      .map((day, index) => {
                        const isRestDay = day.planDay.isRestDay;
                        const isWorkoutStarted = day.workoutInstance && !day.workoutInstance.completedAt;
                        const isWorkoutComplete = day.workoutInstance?.completedAt;

                        let onClick = undefined;
                        if (isRestDay && !day.isComplete) {
                          onClick = () => handleCompleteRestDay(instance.id, day.id);
                        } else if (!isRestDay && !day.workoutInstance) {
                          onClick = () => handleStartWorkout(instance.id, day.id);
                        } else if (!isRestDay && (isWorkoutStarted || isWorkoutComplete)) {
                          onClick = () => window.location.href = `/track/${day.workoutInstance?.id}`;
                        }

                        return (
                          <Box
                            key={index}
                            component="div"
                            onClick={onClick}
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              p: 1,
                              borderRadius: 1,
                              backgroundColor: day.isComplete ? 'success.dark' : 'background.paper',
                              textDecoration: 'none',
                              color: 'inherit',
                              cursor: onClick ? 'pointer' : 'default',
                              '&:hover': {
                                backgroundColor: onClick ? 'action.hover' : 'inherit',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ flexShrink: 0 }}>
                                {isRestDay ? 'Rest Day' : 'Workout Day'}
                              </Typography>
                              
                              {!isRestDay && day.workoutInstance && (
                                <Box sx={{ 
                                  display: 'flex', 
                                  flexWrap: 'nowrap',
                                  gap: 1,
                                  mx: 1,
                                  flex: 1,
                                  minWidth: 0, // Important for proper flex behavior
                                  overflowX: 'hidden',
                                }}>
                                  {day.workoutInstance?.workoutExercises?.map((workoutExercise: any) => (
                                    <Box
                                      key={workoutExercise.id}
                                      sx={{
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 16,
                                        backgroundColor: 'primary.dark',
                                        color: 'primary.contrastText',
                                        fontSize: '0.875rem',
                                        opacity: 0.9,
                                        flexShrink: 0,
                                        '&:hover': {
                                          opacity: 1,
                                          backgroundColor: 'primary.main',
                                        },
                                      }}
                                    >
                                      {workoutExercise.exercise.name.length > 7
                                        ? `${workoutExercise.exercise.name.substring(0, 7)}...` 
                                        : workoutExercise.exercise.name}
                                    </Box>
                                  ))}
                                </Box>
                              )}

                              <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                {day.isComplete ? (
                                  <CheckCircleIcon color="success" />
                                ) : (
                                  <PlayCircleOutlineIcon color="action" />
                                )}
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                  </Box>
                </Card>
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
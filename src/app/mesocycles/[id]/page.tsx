'use client';

import React, { useEffect, useState } from 'react';
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
  Chip,
} from '@mui/material';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import Link from 'next/link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import { useRouter } from 'next/navigation';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import LinearProgress from '@mui/material/LinearProgress';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { gradients, themeColors, borders } from '@/lib/theme-constants';
import { useNavbar } from '@/contexts/NavbarContext';

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

export default function MesocycleDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [mesocycle, setMesocycle] = useState<Mesocycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const { id } = React.use(params);
  const { setShowBackButton } = useNavbar();

  useEffect(() => {
    setShowBackButton(true);
  }, [setShowBackButton]);  

  useEffect(() => {
    const fetchMesocycle = async () => {
      try {
        const response = await fetch(`/api/mesocycles/${id}`);
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
  }, [id]);

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
      const response = await fetch(`/api/mesocycles/${id}`, {
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

  const handleComplete = async () => {
    try {
      const response = await fetch(`/api/mesocycles/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'complete' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete mesocycle');
      }

      const updatedMesocycle = await response.json();
      setMesocycle(updatedMesocycle);
      setCompleteDialogOpen(false);
      setMenuAnchorEl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete mesocycle');
      setCompleteDialogOpen(false);
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
      const updatedMesocycle = await fetch(`/api/mesocycles/${id}`);
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
  const currentIteration = getCurrentIteration(mesocycle.instances);

  return (
    <ResponsiveContainer>
      <Box sx={{
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 2, sm: 3 },
        pt: { xs: 2, sm: 2, md: 2 },
      }}>
        {/* Header Section */}
        <Box sx={{
          pb: { xs: 2, sm: 3 },
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              color: 'white',
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            Mesocycle Details
          </Typography>
        </Box>

        {/* Mesocycle Header Box */}
        <Box sx={{ 
          mb: 4,
          borderRadius: 2,
          overflow: 'hidden',
          background: gradients.surface,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <Box sx={{
            p: { xs: 2, sm: 3 },
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FitnessCenterIcon sx={{ 
                  mr: 1.5, 
                  color: 'white',
                  fontSize: '1.5rem'
                }} />
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'white',
                    fontSize: { xs: '1.5rem', sm: '2rem' }
                  }}
                >
                  {mesocycle.name}
                </Typography>
              </Box>
              <IconButton 
                onClick={(event) => setMenuAnchorEl(event.currentTarget)}
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    color: 'white',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
            
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                mb: 2
              }}
            >
              Based on plan: {mesocycle.plan.name}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              <Chip
                size="small"
                icon={<CalendarTodayIcon />}
                label={`Started ${new Date(mesocycle.startedAt).toLocaleDateString()}`}
                sx={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  '& .MuiChip-icon': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  }
                }}
              />
              {mesocycle.status === 'COMPLETE' && (
                <Chip
                  size="small"
                  icon={<CheckCircleIcon />}
                  label="Complete"
                  sx={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    color: 'rgb(34, 197, 94)',
                    '& .MuiChip-icon': {
                      color: 'rgb(34, 197, 94)'
                    }
                  }}
                />
              )}
              {currentIteration && (
                <Chip
                  size="small"
                  icon={<PlayCircleIcon />}
                  label={`Week ${currentIteration.iterationNumber} in progress`}
                  sx={{
                    background: `rgba(${themeColors.primary.main.replace('rgb(', '').replace(')', '')}, 0.1)`,
                    border: borders.accent,
                    color: themeColors.primary.main,
                    '& .MuiChip-icon': {
                      color: themeColors.primary.main
                    }
                  }}
                />
              )}
            </Box>
            
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Progress: {Math.round(progress)}%
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  {mesocycle.instances.filter(i => i.completedAt).length} / {mesocycle.iterations} weeks completed
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ 
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: gradients.primary
                  }
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Management Menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={() => setMenuAnchorEl(null)}
        >
          {mesocycle.status !== 'COMPLETE' && (
            <MenuItem
              onClick={() => {
                setMenuAnchorEl(null);
                setCompleteDialogOpen(true);
              }}
              sx={{ color: 'warning.main' }}
            >
              <StopCircleIcon sx={{ mr: 1 }} fontSize="small" />
              Complete Mesocycle
            </MenuItem>
          )}
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

        {/* Weeks List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {mesocycle.instances
            .sort((a, b) => a.iterationNumber - b.iterationNumber)
            .map((instance) => {
              const isComplete = isInstanceComplete(instance);
              return (
                <Box
                  key={instance.id}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: gradients.surface,
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 35px 60px -12px rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }
                  }}
                >
                  <Box sx={{
                    p: { xs: 2, sm: 3 },
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      mb: 2
                    }}>
                      {getStatusIcon(instance.status)}
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h6" 
                          component={Link}
                          href={`/plans/instance/${instance.id}`}
                          sx={{ 
                            fontWeight: 700,
                            color: 'white',
                            fontSize: { xs: '1.125rem', sm: '1.25rem' },
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          Week {instance.iterationNumber}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Target RIR: {instance.rir}
                        </Typography>
                      </Box>
                      {isComplete && (
                        <Chip
                          size="small"
                          icon={<CheckCircleIcon />}
                          label="Complete"
                          sx={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.2)',
                            color: 'rgb(34, 197, 94)',
                            '& .MuiChip-icon': {
                              color: 'rgb(34, 197, 94)'
                            }
                          }}
                        />
                      )}
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
                                p: 1.5,
                                borderRadius: 1,
                                background: day.isComplete 
                                  ? 'rgba(34, 197, 94, 0.15)' 
                                  : 'rgba(255, 255, 255, 0.05)',
                                border: day.isComplete
                                  ? '1px solid rgba(34, 197, 94, 0.3)'
                                  : '1px solid rgba(255, 255, 255, 0.1)',
                                textDecoration: 'none',
                                color: 'inherit',
                                cursor: onClick ? 'pointer' : 'default',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  background: onClick 
                                    ? (day.isComplete 
                                      ? 'rgba(34, 197, 94, 0.2)' 
                                      : 'rgba(255, 255, 255, 0.1)')
                                    : 'inherit',
                                  transform: onClick ? 'translateX(4px)' : 'none',
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    flexShrink: 0,
                                    color: day.isComplete ? 'rgb(34, 197, 94)' : 'rgba(255, 255, 255, 0.9)',
                                    fontWeight: 500
                                  }}
                                >
                                  Day {day.planDay.dayNumber}: {isRestDay ? 'Rest Day' : 'Workout Day'}
                                </Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                  {day.isComplete ? (
                                    <CheckCircleIcon sx={{ color: 'rgb(34, 197, 94)' }} />
                                  ) : (
                                    <PlayCircleOutlineIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          );
                        })}
                    </Box>
                  </Box>
                </Box>
              );
            })}
        </Box>

        {mesocycle.status === 'COMPLETE' && (
          <Box sx={{ 
            mt: 4,
            p: 3,
            borderRadius: 2,
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            textAlign: 'center'
          }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'rgb(34, 197, 94)', mb: 1 }} />
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgb(34, 197, 94)',
                fontWeight: 700
              }}
            >
              Mesocycle completed! Great job!
            </Typography>
          </Box>
        )}
      </Box>

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

      <Dialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
      >
        <DialogTitle>Complete Mesocycle</DialogTitle>
        <DialogContent>
          Are you sure you want to complete this mesocycle? This will mark the mesocycle as complete. 
          Your progress data will be preserved, but you won't be able to continue tracking workouts 
          for this mesocycle.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleComplete} color="warning" variant="contained">
            Complete
          </Button>
        </DialogActions>
      </Dialog>
    </ResponsiveContainer>
  );
} 
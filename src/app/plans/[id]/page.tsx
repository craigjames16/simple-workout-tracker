'use client';

import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Container,
} from '@mui/material';
import { ResponsiveContainer } from '@/components';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HotelIcon from '@mui/icons-material/Hotel';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';
import { gradients, themeColors, borders } from '@/lib/theme-constants';

interface Exercise {
  exercise: {
    name: string;
  };
}

interface Workout {
  name: string;
  workoutExercises: Exercise[];
}

interface PlanDay {
  id: number;
  dayNumber: number;
  isRestDay: boolean;
  workout: Workout | null;
}

interface Plan {
  id: number;
  name: string;
  days: PlanDay[];
  createdAt: string;
}

export default function PlanDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const awaitedParams = React.use(params);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const response = await fetch(`/api/plans/${awaitedParams.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch plan');
        }
        const data = await response.json();
        setPlan(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [awaitedParams.id]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEditPlan = () => {
    router.push(`/plans/${awaitedParams.id}/edit`);
    handleMenuClose();
  };

  const handleDeletePlan = async () => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      handleMenuClose();
      return;
    }

    try {
      const response = await fetch(`/api/plans/${awaitedParams.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete plan');
      }

      router.push('/plans');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete plan');
    }
    handleMenuClose();
  };

  if (loading) {
    return (
      <ResponsiveContainer sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </ResponsiveContainer>
    );
  }

  if (error || !plan) {
    return (
      <ResponsiveContainer>
        <Typography color="error">{error || 'Plan not found'}</Typography>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      <Box sx={{
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 2, sm: 3 },
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
            Plan Details
          </Typography>
        </Box>

        {/* Plan Header Box */}
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
                  {plan.name}
                </Typography>
              </Box>
              <IconButton 
                onClick={handleMenuOpen}
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
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                icon={<CalendarTodayIcon />}
                label={`Created ${new Date(plan.createdAt).toLocaleDateString()}`}
                sx={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  '& .MuiChip-icon': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  }
                }}
              />
              <Chip
                size="small"
                icon={<FitnessCenterIcon />}
                label={`${plan.days.length} days`}
                sx={{
                  background: `rgba(${themeColors.primary.main.replace('rgb(', '').replace(')', '')}, 0.1)`,
                  border: borders.accent,
                  color: themeColors.primary.main,
                  '& .MuiChip-icon': {
                    color: themeColors.primary.main
                  }
                }}
              />
              <Chip
                size="small"
                icon={<HotelIcon />}
                label={`${plan.days.filter(day => day.isRestDay).length} rest days`}
                sx={{
                  background: 'rgba(156, 163, 175, 0.1)',
                  border: '1px solid rgba(156, 163, 175, 0.2)',
                  color: 'rgba(156, 163, 175, 0.9)',
                  '& .MuiChip-icon': {
                    color: 'rgba(156, 163, 175, 0.9)'
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
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEditPlan}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit Plan
          </MenuItem>
          <MenuItem onClick={handleDeletePlan}>
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" color="error" />
            <Typography color="error">Delete Plan</Typography>
          </MenuItem>
        </Menu>

        {/* Days List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {plan.days
            .sort((a, b) => a.dayNumber - b.dayNumber)
            .map((day, index) => (
              <Box
                key={day.id}
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {day.isRestDay ? (
                      <HotelIcon sx={{ 
                        mr: 1.5, 
                        color: 'rgba(156, 163, 175, 0.9)',
                        fontSize: '1.5rem'
                      }} />
                    ) : (
                      <FitnessCenterIcon sx={{ 
                        mr: 1.5, 
                        color: themeColors.primary.main,
                        fontSize: '1.5rem'
                      }} />
                    )}
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700,
                        color: 'white',
                        fontSize: { xs: '1.125rem', sm: '1.25rem' }
                      }}
                    >
                      Day {day.dayNumber}
                    </Typography>
                    {day.isRestDay && (
                      <Chip
                        size="small"
                        label="Rest Day"
                        sx={{
                          ml: 2,
                          background: 'rgba(156, 163, 175, 0.1)',
                          border: '1px solid rgba(156, 163, 175, 0.2)',
                          color: 'rgba(156, 163, 175, 0.9)'
                        }}
                      />
                    )}
                  </Box>

                  {day.isRestDay ? (
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontStyle: 'italic'
                      }}
                    >
                      Rest and recovery day
                    </Typography>
                  ) : day.workout ? (
                    <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.8)',
                          mb: 2,
                          fontWeight: 500
                        }}
                      >
                        {day.workout.workoutExercises.length} exercises
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {day.workout.workoutExercises.map((ex, exIndex) => (
                          <Chip
                            key={exIndex}
                            size="small"
                            label={ex.exercise.name}
                            sx={{
                              background: `rgba(${themeColors.primary.main.replace('rgb(', '').replace(')', '')}, 0.1)`,
                              border: borders.accent,
                              color: themeColors.primary.main,
                              '&:hover': {
                                background: `rgba(${themeColors.primary.main.replace('rgb(', '').replace(')', '')}, 0.2)`,
                                border: borders.accent,
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  ) : (
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'rgba(239, 68, 68, 0.9)',
                        fontStyle: 'italic'
                      }}
                    >
                      No workout assigned
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
        </Box>
      </Box>
    </ResponsiveContainer>
  );
} 
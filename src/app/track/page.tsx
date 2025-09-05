'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Box,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import Link from 'next/link';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckIcon from '@mui/icons-material/Check';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import GradientButton from '@/components/GradientButton';
import { gradients } from '@/lib/theme-constants';

interface CurrentMesocycle {
  id: number;
  name: string;
  plan: {
    id: number;
    name: string;
  };
}

// Next Workout Component
const NextWorkout = ({ 
  currentMesocycle,
  onStartWorkout,
  isStartingWorkout
}: { 
  currentMesocycle: CurrentMesocycle | null;
  onStartWorkout: (iterationId: number, dayId: number) => Promise<void>;
  isStartingWorkout: boolean;
}) => {
  const [nextWorkout, setNextWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNextWorkout = async () => {
      if (!currentMesocycle) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/workout-instances/latest`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch next workout');
        }
        
        const data = await response.json();
        setNextWorkout(data);
      } catch (err) {
        console.error('Error fetching next workout:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNextWorkout();
  }, [currentMesocycle]);

  const handleStartWorkout = async () => {
    if (!nextWorkout) return;

    if (nextWorkout.needsNewIteration) {
      // Create a new iteration first
      try {
        const response = await fetch(`/api/plan-instances`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: currentMesocycle?.plan.id
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create new iteration');
        }

        const newIteration = await response.json();
        // Now start the workout with the new iteration's first day
        const firstDay = newIteration.days[0];
        onStartWorkout(newIteration.id, firstDay.id);
      } catch (err) {
        console.error('Error creating new iteration:', err);
        setError(err instanceof Error ? err.message : 'Failed to create new iteration');
      }
    } else {
      // Start workout with existing iteration
      if (!nextWorkout.iterationId || !nextWorkout.dayId) {
        setError('Missing required workout information. Please try refreshing the page.');
        return;
      }
      onStartWorkout(nextWorkout.iterationId, nextWorkout.dayId);
    }
  };
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography color="error">
            Error loading next workout: {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  if (!nextWorkout) {
    return (
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography>
            No upcoming workouts found. Please check your mesocycle configuration.
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  const isRestDay = nextWorkout.isRestDay;
  
  return (
    <Card 
      elevation={0} 
      sx={{ 
        mb: 3, 
        borderRadius: 2,
        overflow: 'hidden',
        background: gradients.surface,
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}
    >
      <Box sx={{ 
        p: { xs: 2, sm: 3 },
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700,
            color: 'white',
            fontSize: { xs: '1.125rem', sm: '1.25rem' }
          }}
        >
          Next Workout
        </Typography>
      </Box>
      
      <CardContent sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'center', sm: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 2, sm: 0 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
            <Avatar 
              sx={{ 
                bgcolor: isRestDay ? 'info.main' : 'secondary.main',
                mr: 1.5,
                width: 32,
                height: 32
              }}
            >
              {isRestDay ? nextWorkout.dayNumber : <FitnessCenterIcon fontSize="small" />}
            </Avatar>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                Day {nextWorkout.dayNumber}: {isRestDay ? 'Rest Day' : nextWorkout.workoutName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Week {nextWorkout.iterationNumber}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ width: { xs: '100%', sm: 'auto' }, display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
            {isRestDay ? (
              <GradientButton 
                variant="outlined" 
                color="info"
                size="small"
                startIcon={<CheckIcon />}
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/plan-instances/${nextWorkout.iterationId}/days/${nextWorkout.dayId}/complete-rest`, {
                      method: 'POST',
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to complete rest day');
                    }
                    
                    window.location.reload();
                  } catch (error) {
                    console.error('Error completing rest day:', error);
                    alert('Failed to complete rest day. Please try again.');
                  }
                }}
              >
                Complete Rest Day
              </GradientButton>
            ) : (
              <GradientButton 
                variant="contained"
                size="small"
                startIcon={<PlayArrowIcon />}
                onClick={handleStartWorkout}
                disabled={isStartingWorkout}
              >
                {isStartingWorkout ? 'Starting...' : (nextWorkout.inProgress ? 'Continue Workout' : 'Start Workout')}
              </GradientButton>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default function TrackPage() {
  const router = useRouter();
  const [currentMesocycle, setCurrentMesocycle] = useState<CurrentMesocycle | null>(null);
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentMesocycle = async () => {
      try {
        const res = await fetch('/api/mesocycles');
        if (!res.ok) throw new Error('Failed to fetch mesocycles');
        const data = await res.json();
        // Find the mesocycle in progress
        const inProgress = data.find((m: any) => m.status === 'IN_PROGRESS');
        if (inProgress) {
          setCurrentMesocycle(inProgress);
        } else if (data.length > 0) {
          // If no mesocycle is in progress, use the first one
          setCurrentMesocycle(data[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch mesocycles');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentMesocycle();
  }, []);

  const startWorkoutInstance = async (iterationId: number, dayId: number) => {
    try {
      setIsStartingWorkout(true);
      const response = await fetch(
        `/api/plan-instances/${iterationId}/days/${dayId}/start`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start new workout instance');
      }

      const newWorkoutInstance = await response.json();
      router.push(`/track/${newWorkoutInstance.id}`);
    } catch (error) {
      console.error('Error starting workout instance:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to start new workout instance'
      );
    } finally {
      setIsStartingWorkout(false);
    }
  };

  if (loading) {
    return (
      <ResponsiveContainer maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </ResponsiveContainer>
    );
  }

  if (error) {
    return (
      <ResponsiveContainer maxWidth="lg">
             <Box sx={{
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        px: { xs: 2, sm: 3 },
        pt: { xs: 6, sm: 6, md: 6 },
      }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              href="/dashboard"
            >
              Go to Dashboard
            </Button>
          </Box>
        </Box>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="lg">
      <Box sx={{
        px: { xs: 2, sm: 3 }, 
        pt: { xs: 6, sm: 6, md: 6 },
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
      }}>
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
            Track Workout
          </Typography>
        </Box>

        <NextWorkout 
          currentMesocycle={currentMesocycle} 
          onStartWorkout={startWorkoutInstance}
          isStartingWorkout={isStartingWorkout}
        />
      </Box>
    </ResponsiveContainer>
  );
} 
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
import ScheduleTimeline from '@/components/ScheduleTimeline';
import WorkoutCalendar from '@/components/WorkoutCalendar';
import WorkoutHeatmap from '@/components/WorkoutHeatmap';
import { gradients } from '@/lib/theme-constants';

interface CurrentMesocycle {
  id: number;
  name: string;
  plan: {
    id: number;
    name: string;
  };
}


interface PlanInstanceDay {
  id: number;
  planInstanceId: number;
  planDayId: number;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
  planDay: {
    id: number;
    isRestDay: boolean;
    dayNumber: number;
    workout?: {
      id: number;
      name: string;
    } | null;
  };
  workoutInstance: {
    id: number;
    completedAt: string | null;
    workout: {
      id: number;
      name: string;
    };
  } | null;
  planInstance: {
    id: number;
    iterationNumber: number | null;
    status: string | null;
    startedAt: string;
    completedAt: string | null;
  };
}

interface ScheduleData {
  previousDays: PlanInstanceDay[];
  upcomingDays: PlanInstanceDay[];
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
  const [nextWorkout, setNextWorkout] = useState<PlanInstanceDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNextWorkout = async () => {
      if (!currentMesocycle) {
        setNextWorkout(null);
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/mesocycles/${currentMesocycle.id}/schedule`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch schedule');
        }
        
        const data = await response.json() as ScheduleData;
        
        // Get the first upcoming day
        const firstUpcomingDay = data.upcomingDays.length > 0 ? data.upcomingDays[0] : null;
        setNextWorkout(firstUpcomingDay);
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNextWorkout();
  }, [currentMesocycle]);

  const handleStartWorkout = async () => {
    if (!nextWorkout) return;

    // Check if we need to create a new iteration (day has placeholder id)
    if (nextWorkout.id === -1 || nextWorkout.planInstanceId === -1) {
      // Create a new iteration first
      try {
        const iterationNumber = nextWorkout.planInstance?.iterationNumber || 1;
        const response = await fetch(`/api/plan-instances`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: currentMesocycle?.plan.id,
            mesocycleId: currentMesocycle?.id,
            iterationNumber: typeof iterationNumber === 'number' ? iterationNumber : undefined
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create new iteration');
        }

        const newIteration = await response.json();
        // Get the first day from the new iteration that matches the planDayId
        const firstDay = newIteration.days.find((d: any) => d.planDayId === nextWorkout.planDayId) || newIteration.days[0];
        
        // Check if it's a rest day - if so, complete it instead of starting a workout
        if (firstDay.planDay.isRestDay || !firstDay.planDay.workout) {
          // Complete the rest day
          const completeResponse = await fetch(
            `/api/plan-instances/${newIteration.id}/days/${firstDay.id}/complete-rest`,
            {
              method: 'POST',
            }
          );
          
          if (!completeResponse.ok) {
            throw new Error('Failed to complete rest day');
          }
          
          // Reload the page to show the next workout
          window.location.reload();
        } else {
          // Start the workout with the new iteration's first day
          onStartWorkout(newIteration.id, firstDay.id);
        }
      } catch (err) {
        console.error('Error creating new iteration:', err);
        setError(err instanceof Error ? err.message : 'Failed to create new iteration');
      }
    } else {
      // Start workout with existing iteration
      if (!nextWorkout.planInstanceId || !nextWorkout.id) {
        setError('Missing required workout information. Please try refreshing the page.');
        return;
      }
      
      // Check if it's a rest day
      if (nextWorkout.planDay?.isRestDay) {
        try {
          const response = await fetch(
            `/api/plan-instances/${nextWorkout.planInstanceId}/days/${nextWorkout.id}/complete-rest`,
            {
              method: 'POST',
            }
          );
          
          if (!response.ok) {
            throw new Error('Failed to complete rest day');
          }
          
          window.location.reload();
        } catch (err) {
          console.error('Error completing rest day:', err);
          setError(err instanceof Error ? err.message : 'Failed to complete rest day');
        }
      } else {
        onStartWorkout(nextWorkout.planInstanceId, nextWorkout.id);
      }
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
  
  // Show empty state with CTAs when no mesocycle or no upcoming workouts
  const handleStartSingleWorkout = async () => {
    try {
      const response = await fetch('/api/workout-instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to create workout');
      }

      const workoutInstance = await response.json();
      window.location.href = `/track/${workoutInstance.id}`;
    } catch (err) {
      console.error('Error creating standalone workout:', err);
      setError(err instanceof Error ? err.message : 'Failed to create workout');
    }
  };

  const handleCreateMesocycle = () => {
    window.location.href = '/plan';
  };

  if (!nextWorkout || !nextWorkout.planDay) {

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
        <CardContent sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              {!currentMesocycle ? 'Get Started' : 'No Upcoming Workouts'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {!currentMesocycle 
                ? 'Start a single workout or create a mesocycle to begin tracking your progress'
                : 'Start a quick workout or check your mesocycle schedule'}
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            justifyContent: 'center'
          }}>
            <GradientButton
              variant="contained"
              fullWidth={false}
              sx={{ flex: { xs: 1, sm: '0 1 auto' }, minWidth: { sm: 180 } }}
              startIcon={<PlayArrowIcon />}
              onClick={handleStartSingleWorkout}
            >
              Start Single Workout
            </GradientButton>
            <GradientButton
              variant="outlined"
              fullWidth={false}
              sx={{ flex: { xs: 1, sm: '0 1 auto' }, minWidth: { sm: 180 } }}
              startIcon={<FitnessCenterIcon />}
              onClick={handleCreateMesocycle}
            >
              Create Mesocycle
            </GradientButton>
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  const isRestDay = nextWorkout.planDay?.isRestDay || false;
  const workoutName = nextWorkout.workoutInstance?.workout?.name || nextWorkout.planDay?.workout?.name || 'Workout Day';
  const iterationNumber = nextWorkout.planInstance?.iterationNumber || 'Next';
  const hasWorkoutInstance = !!nextWorkout.workoutInstance;
  const isWorkoutInProgress = hasWorkoutInstance && !nextWorkout.workoutInstance?.completedAt;
  
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
      <CardContent sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'column' },
          alignItems: { xs: 'center', sm: 'center' },
          // justifyContent: 'space-between',
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
              {isRestDay ? (nextWorkout.planDay?.dayNumber || 'R') : <FitnessCenterIcon fontSize="small" />}
            </Avatar>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                Day {nextWorkout.planDay?.dayNumber || '?'}: {isRestDay ? 'Rest Day' : workoutName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {typeof iterationNumber === 'number' ? `Week ${iterationNumber}` : iterationNumber}
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
                onClick={handleStartWorkout}
                disabled={isStartingWorkout}
              >
                {isStartingWorkout ? 'Completing...' : 'Complete Rest Day'}
              </GradientButton>
            ) : (
              <GradientButton 
                variant="contained"
                size="small"
                startIcon={<PlayArrowIcon />}
                onClick={handleStartWorkout}
                disabled={isStartingWorkout}
              >
                {isStartingWorkout ? 'Starting...' : (isWorkoutInProgress ? 'Continue Workout' : 'Start Workout')}
              </GradientButton>
            )}
          </Box>
        </Box>
        {/* <ScheduleTimeline sx={{ mt: 4 }} mesocycleId={currentMesocycle?.id || null} compact /> */}
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
        const selectedMesocycle = inProgress || (data.length > 0 ? data[0] : null);
        
        if (selectedMesocycle) {
          setCurrentMesocycle(selectedMesocycle);
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
              href="/data"
            >
              Go to Data
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
        pt: { xs: 2, sm: 2, md: 2 },
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

        <WorkoutCalendar mesocycleId={currentMesocycle?.id || null} />

        <WorkoutHeatmap mesocycleId={currentMesocycle?.id || null} />
      </Box>
    </ResponsiveContainer>
  );
} 
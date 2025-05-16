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
} from '@mui/material';
import Link from 'next/link';

export default function TrackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLatestWorkout();
  }, []);

  const fetchLatestWorkout = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/workout-instances/latest');
      
      if (response.ok) {
        const data = await response.json();

        if (data.id) {
          // Incomplete workout exists
          router.push(`/track/${data.id}`);
        } else if (data.dayId || data.dayNumber) {
          // Next day info (could be rest or workout)
          if (data.isRestDay) {
            setError('Today is a rest day!');
          } else if (data.needsNewIteration) {
            // Start a new iteration (plan instance)
            // You may need to call an endpoint to create a new plan instance here
            setError('A new iteration needs to be started. Please implement iteration creation logic.');
          } else if (data.iterationId && data.dayId) {
            // Start a new workout instance for this day
            await startWorkoutInstance(data.iterationId, data.dayId);
          } else {
            setError('Unexpected response from server.');
          }
        } else {
          // Unexpected response format
          setError('Unexpected response from server.');
        }
      } else if (response.status === 404) {
        setError('No upcoming workouts or rest days found');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch latest workout');
      }
    } catch (error) {
      console.error('Error fetching latest workout:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch latest workout'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const startWorkoutInstance = async (
    planInstanceId: number,
    dayId: number
  ) => {
    try {
      const response = await fetch(
        `/api/plan-instances/${planInstanceId}/days/${dayId}/start`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        const newWorkoutInstance = await response.json();
        router.push(`/track/${newWorkoutInstance.id}`);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start new workout instance');
      }
    } catch (error) {
      console.error('Error starting workout instance:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to start new workout instance'
      );
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="sm">
        <Paper
          sx={{ p: 3, mt: 3, display: 'flex', justifyContent: 'center' }}
        >
          <CircularProgress />
        </Paper>
      </Container>
    );
  }

  if (error) {
    // Friendly user-facing messages
    let friendlyMessage = '';
    if (error.includes('rest day')) {
      friendlyMessage = 'Today is a rest day! Check your dashboard for more info.';
    } else if (error.includes('No upcoming workouts')) {
      friendlyMessage = 'No upcoming workouts found. Check your dashboard to review your plan.';
    } else if (error.includes('new iteration')) {
      friendlyMessage = 'You have completed all workouts in this cycle! Start a new week from your dashboard.';
    } else {
      friendlyMessage = 'Something went wrong. Please check your dashboard for more information.';
    }
    return (
      <Container maxWidth="sm">
        <Paper sx={{ p: 3, mt: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            {friendlyMessage}
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
        </Paper>
      </Container>
    );
  }

  return null;
} 
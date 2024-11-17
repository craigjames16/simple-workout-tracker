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
        router.push(`/track/${data.id}`);
      } else if (response.status === 404) {
        setError('No incomplete workouts found');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch latest workout');
      }
    } catch (error) {
      console.error('Error fetching latest workout:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch latest workout');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="sm">
        <Paper sx={{ p: 3, mt: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Paper sx={{ p: 3, mt: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              href="/plans"
            >
              View Plans
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return null;
} 
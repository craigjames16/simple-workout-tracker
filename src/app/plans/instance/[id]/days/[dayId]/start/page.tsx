'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, CircularProgress } from '@mui/material';

export default function StartWorkout({ params }: { params: { id: string; dayId: string } }) {
  const router = useRouter();

  useEffect(() => {
    const startWorkout = async () => {
      try {
        const response = await fetch(
          `/api/plan-instances/${params.id}/days/${params.dayId}/start`,
          {
            method: 'POST',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to start workout');
        }

        const data = await response.json();
        // Redirect to the workout tracking page
        router.push(`/track/${data.id}`);
      } catch (error) {
        console.error('Error starting workout:', error);
        // On error, redirect back to the plan instance page
        router.push(`/plans/instance/${params.id}`);
      }
    };

    startWorkout();
  }, [params.id, params.dayId, router]);

  return (
    <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
      <CircularProgress />
    </Container>
  );
} 
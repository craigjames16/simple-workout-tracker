'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, CircularProgress } from '@mui/material';

export default function CompleteRestDay({ params }: { params: { id: string; dayId: string } }) {
  const router = useRouter();

  useEffect(() => {
    const completeRestDay = async () => {
      try {
        const response = await fetch(
          `/api/plan-instances/${params.id}/days/${params.dayId}/complete-rest`,
          {
            method: 'POST',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to complete rest day');
        }

        // Redirect back to plan instance page
        router.push(`/plans/instance/${params.id}`);
      } catch (error) {
        console.error('Error completing rest day:', error);
        // On error, redirect back to the plan instance page
        router.push(`/plans/instance/${params.id}`);
      }
    };

    completeRestDay();
  }, [params.id, params.dayId, router]);

  return (
    <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
      <CircularProgress />
    </Container>
  );
} 
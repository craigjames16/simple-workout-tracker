'use client';

import React, { useEffect, useState } from 'react';
import CreatePlan from '@/components/CreatePlan';
import { Container, CircularProgress, Typography } from '@mui/material';

type Props = {
  params: Promise<{ id: string }>;
};

export default function EditPlanPage({ params }: Props) {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { id } = React.use(params);
  const planId = id;

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const response = await fetch(`/api/plans/${planId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch plan');
        }
        const data = await response.json();
        setPlan(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch plan');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId]);

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !plan) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error">{error || 'Plan not found'}</Typography>
      </Container>
    );
  }

  return <CreatePlan initialPlan={plan} mode="edit" />;
} 
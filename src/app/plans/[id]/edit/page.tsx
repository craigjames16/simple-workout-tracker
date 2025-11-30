'use client';

import React, { useEffect, useState } from 'react';
import CreatePlan from '@/components/CreatePlan';
import { CircularProgress, Typography } from '@mui/material';
import { ResponsiveContainer } from '@/components';
import { useNavbar } from '@/contexts/NavbarContext';

type Props = {
  params: Promise<{ id: string }>;
};

export default function EditPlanPage({ params }: Props) {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setShowBackButton } = useNavbar();

  const { id } = React.use(params);
  const planId = id;

  useEffect(() => {
    setShowBackButton(true);
  }, [setShowBackButton]);

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
      <ResponsiveContainer maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </ResponsiveContainer>
    );
  }

  if (error || !plan) {
    return (
      <ResponsiveContainer sx={{ mt: 4 }}>
        <Typography color="error">{error || 'Plan not found'}</Typography>
      </ResponsiveContainer>
    );
  }

  return <CreatePlan initialPlan={plan} mode="edit" />;
} 
'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Chip,
  Divider,
  Card,
} from '@/components';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FloatingActionButton from '@/components/FloatingActionButton';
import { useRouter } from 'next/navigation';


interface Plan {
  id: number;
  name: string;
  days: Array<{
    dayNumber: number;
    isRestDay: boolean;
    workout?: {
      name: string;
      exercises: Array<{
        exercise: {
          name: string;
        };
      }>;
    };
  }>;
  instances: Array<{
    status: string | null;
  }>;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/plans');
        if (!response.ok) {
          throw new Error('Failed to fetch plans');
        }
        const data = await response.json();
        setPlans(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handlePlanClick = (planId: number) => {
    router.push(`/plans/${planId}`);
  };

  if (loading) {
    return (
      <ResponsiveContainer sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </ResponsiveContainer>
    );
  }

  if (error) {
    return (
      <ResponsiveContainer>
        <Typography color="error">{error}</Typography>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer sx={{ mt: 4, pb: 4 }}>
      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5">
            Plans
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
          {plans.map((plan) => (
            <Card
              key={plan.id}
              component={Link}
              href={`/plans/${plan.id}`}
              sx={{ 
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { sm: 'center' },
                p: 2,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flex: 1,
                gap: 2,
              }}>
                <CalendarTodayIcon color="action" />
                <Box>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    {plan.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      icon={<FitnessCenterIcon />}
                      label={`${plan.days.length} days`}
                      color="primary"
                      variant="outlined"
                    />
                    {plan.instances?.some(i => i?.status === 'IN_PROGRESS') && (
                      <Chip
                        size="small"
                        label="In Progress"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              </Box>
              <Typography 
                variant="body2" 
                color="primary"
                sx={{ 
                  mt: { xs: 2, sm: 0 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                View Details →
              </Typography>
            </Card>
          ))}
        </Box>
      </Paper>

      <FloatingActionButton
        icon={<AddIcon />}
        onClick={() => router.push('/plans/create')}
      />
    </ResponsiveContainer>
  );
} 
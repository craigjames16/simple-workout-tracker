'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  Paper,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Chip,
  Divider,
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
    <ResponsiveContainer>
      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5">Workout Plans</Typography>
        </Box>

        <List sx={{ p: 0 }}>
          {plans.map((plan, index) => (
            <Box key={plan.id}>
              <ListItem
                onClick={() => handlePlanClick(plan.id)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarTodayIcon color="action" />
                      <Typography variant="subtitle1">
                        {plan.name}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
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
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handlePlanClick(plan.id)}>
                    <ArrowForwardIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              {index < plans.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Paper>

      <FloatingActionButton
        icon={<AddIcon />}
        onClick={() => router.push('/plans/create')}
      />
    </ResponsiveContainer>
  );
} 
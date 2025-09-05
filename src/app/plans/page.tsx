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
import { gradients, themeColors, borders } from '@/lib/theme-constants';


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
    <ResponsiveContainer maxWidth="md">
      <Box sx={{
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        px: { xs: 2, sm: 3 },
        pt: { xs: 6, sm: 6, md: 6 },
      }}>
        <Box sx={{
          pb: { xs: 2, sm: 3 },
        }}>
        <Typography variant="h4"
          sx={{ 
            fontWeight: 700,
            color: 'white',
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}>
            Plans
          </Typography>
          </Box>  
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }}>
          {plans.map((plan) => (
            <Box
              key={plan.id}
              component={Link}
              href={`/plans/${plan.id}`}
              sx={{ 
                borderRadius: 2,
                overflow: 'hidden',
                background: gradients.surface,
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 35px 60px -12px rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }
              }}
            >
              <Box sx={{
                p: { xs: 2, sm: 3 },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FitnessCenterIcon sx={{ 
                    mr: 1.5, 
                    color: 'white',
                    fontSize: '1.5rem'
                  }} />
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700,
                      color: 'white',
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }
                    }}
                  >
                    {plan.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarTodayIcon sx={{ 
                    mr: 1, 
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '1rem'
                  }} />
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: 500,
                      letterSpacing: '0.025em'
                    }}
                  >
                    {plan.days.length} days
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    icon={<FitnessCenterIcon />}
                    label={`${plan.days.length} days`}
                    sx={{
                      background: `rgba(${themeColors.primary.main.replace('rgb(', '').replace(')', '')}, 0.1)`,
                      border: borders.accent,
                      color: themeColors.primary.main,
                      '& .MuiChip-icon': {
                        color: themeColors.primary.main
                      }
                    }}
                  />
                  {plan.instances?.some(i => i?.status === 'IN_PROGRESS') && (
                    <Chip
                      size="small"
                      label="In Progress"
                      sx={{
                        background: 'rgba(255, 193, 7, 0.1)',
                        border: '1px solid rgba(255, 193, 7, 0.2)',
                        color: 'rgba(255, 193, 7, 0.9)'
                      }}
                    />
                  )}
                  <Chip
                    size="small"
                    label="View Details →"
                    sx={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      ml: 'auto'
                    }}
                  />
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <FloatingActionButton
        icon={<AddIcon />}
        onClick={() => router.push('/plans/create')}
      />
    </ResponsiveContainer>
  );
} 
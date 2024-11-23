'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';
import type { PlanInstanceWithCompletion } from '@/types/prisma';
import { useRouter } from 'next/navigation';

export default function PlanInstanceDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [planInstance, setPlanInstance] = useState<PlanInstanceWithCompletion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlanInstance = async () => {
      try {
        const response = await fetch(`/api/plan-instances/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch plan instance');
        }
        const data = await response.json() as PlanInstanceWithCompletion;
        setPlanInstance(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanInstance();
  }, [params.id]);

  const handleCompleteRestDay = async (dayId: number) => {
    try {
      const response = await fetch(
        `/api/plan-instances/${params.id}/days/${dayId}/complete-rest`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to complete rest day');
      }

      // Refresh the page data
      const updatedPlanInstance = await fetch(`/api/plan-instances/${params.id}`);
      const data = await updatedPlanInstance.json();
      setPlanInstance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !planInstance) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error">{error || 'Plan instance not found'}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {planInstance.plan.name}
        </Typography>

        <Grid container spacing={2}>
          {planInstance.days
            .sort((a, b) => a.planDay.dayNumber - b.planDay.dayNumber)
            .map((day) => (
            <Grid item xs={12} sm={6} md={4} key={day.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Day {day.planDay.dayNumber}
                    </Typography>
                    {day.isComplete && (
                      <CheckCircleIcon color="success" />
                    )}
                  </Box>

                  {day.planDay.isRestDay ? (
                    <>
                      <Typography color="text.secondary" gutterBottom>
                        Rest Day
                      </Typography>
                      {!day.isComplete && (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<CheckCircleIcon />}
                          fullWidth
                          sx={{ mt: 2 }}
                          onClick={() => handleCompleteRestDay(day.id)}
                        >
                          Complete Rest Day
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Typography color="text.secondary" gutterBottom>
                        {day.planDay.workout?.name}
                      </Typography>
                      {!day.workoutInstance && (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<PlayArrowIcon />}
                          fullWidth
                          sx={{ mt: 2 }}
                          component={Link}
                          href={`/plans/instance/${planInstance.id}/days/${day.id}/start`}
                        >
                          Start Workout
                        </Button>
                      )}
                      {day.workoutInstance && !day.workoutInstance.completedAt && (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<ArrowForwardIcon />}
                          fullWidth
                          sx={{ mt: 2 }}
                          component={Link}
                          href={`/track/${day.workoutInstance.id}`}
                        >
                          Continue Workout
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {planInstance.status === 'COMPLETE' && (
          <Alert severity="success" sx={{ mt: 3 }}>
            Plan completed! Great job!
          </Alert>
        )}
      </Paper>
    </Container>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HotelIcon from '@mui/icons-material/Hotel';
import { useRouter } from 'next/navigation';

interface Exercise {
  exercise: {
    name: string;
  };
}

interface Workout {
  name: string;
  exercises: Exercise[];
}

interface PlanDay {
  id: number;
  dayNumber: number;
  isRestDay: boolean;
  workout: Workout | null;
}

interface Plan {
  id: number;
  name: string;
  days: PlanDay[];
  createdAt: string;
}

export default function PlanDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const response = await fetch(`/api/plans/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch plan');
        }
        const data = await response.json();
        setPlan(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [params.id]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEditPlan = () => {
    router.push(`/plans/${params.id}/edit`);
    handleMenuClose();
  };

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

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">{plan.name}</Typography>
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          </Box>
          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              icon={<CalendarTodayIcon />}
              label={`Created ${new Date(plan.createdAt).toLocaleDateString()}`}
              variant="outlined"
            />
            <Chip
              size="small"
              icon={<FitnessCenterIcon />}
              label={`${plan.days.length} days`}
              color="primary"
              variant="outlined"
            />
            <Chip
              size="small"
              icon={<HotelIcon />}
              label={`${plan.days.filter(day => day.isRestDay).length} rest days`}
              variant="outlined"
            />
          </Box>
        </Box>

        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEditPlan}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit Plan
          </MenuItem>
        </Menu>

        <List sx={{ p: 0 }}>
          {plan.days
            .sort((a, b) => a.dayNumber - b.dayNumber)
            .map((day, index) => (
              <Box key={day.id}>
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    py: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {day.isRestDay ? (
                      <HotelIcon sx={{ mr: 1 }} color="action" />
                    ) : (
                      <FitnessCenterIcon sx={{ mr: 1 }} color="action" />
                    )}
                    <Typography variant="subtitle1">
                      Day {day.dayNumber}
                    </Typography>
                  </Box>

                  {day.isRestDay ? (
                    <Typography color="text.secondary" variant="body2">
                      Rest Day
                    </Typography>
                  ) : day.workout ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {day.workout.exercises.length} exercises
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {day.workout.exercises.map((ex, exIndex) => (
                          <Chip
                            key={exIndex}
                            size="small"
                            label={ex.exercise.name}
                            variant="outlined"
                            sx={{ mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    </Box>
                  ) : (
                    <Typography color="error" variant="body2">
                      No workout assigned
                    </Typography>
                  )}
                </ListItem>
                {index < plan.days.length - 1 && <Divider />}
              </Box>
            ))}
        </List>
      </Paper>
    </Container>
  );
} 
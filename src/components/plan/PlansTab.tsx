'use client';

import { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Chip,
  TextField,
  Button,
  Collapse,
  Alert,
} from '@mui/material';
import Link from 'next/link';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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

export default function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAICreator, setShowAICreator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/plans');
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }
      const data = await response.json();
      setPlans(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlanWithAI = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Please enter a prompt');
      return;
    }

    setIsCreating(true);
    setAiError(null);

    try {
      const response = await fetch('/api/plans/create-with-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create plan');
      }

      const data = await response.json();
      
      // Reset form
      setAiPrompt('');
      setShowAICreator(false);
      
      // Refresh plans list
      await fetchPlans();
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to create plan');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }}>
      {/* AI Creator Section */}
      <Box
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          background: gradients.surface,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <Button
          fullWidth
          onClick={() => setShowAICreator(!showAICreator)}
          startIcon={<AutoAwesomeIcon />}
          endIcon={showAICreator ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{
            justifyContent: 'space-between',
            p: 2,
            textTransform: 'none',
            color: 'white',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          <Typography sx={{ fontWeight: 600 }}>
            Create Plan with AI
          </Typography>
        </Button>
        
        <Collapse in={showAICreator}>
          <Box sx={{ p: 2, pt: 0 }}>
            {aiError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAiError(null)}>
                {aiError}
              </Alert>
            )}
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Describe the workout plan you'd like to create (e.g., 'Create a 4-day upper/lower split focusing on strength')"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              disabled={isCreating}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: themeColors.primary.main,
                  },
                },
              }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleCreatePlanWithAI}
              disabled={isCreating || !aiPrompt.trim()}
              startIcon={isCreating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {isCreating ? 'Creating Plan...' : 'Create Plan'}
            </Button>
          </Box>
        </Collapse>
      </Box>

      {/* Plans List */}
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
  );
}


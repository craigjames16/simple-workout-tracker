'use client';

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import Link from 'next/link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import GradientButton from '@/components/GradientButton';
import { gradients, themeColors, borders } from '@/lib/theme-constants';

interface MesocyclePlan {
  id: number;
  name: string;
}

interface Mesocycle {
  id: number;
  name: string;
  plan: MesocyclePlan;
  iterations: number;
  status: string | null;
  startedAt: string;
  completedAt: string | null;
  instances: Array<{
    id: number;
    status: string | null;
    iterationNumber: number;
    rir: number;
  }>;
}

export interface MesocyclesTabRef {
  openCreateDialog: () => void;
}

const MesocyclesTab = forwardRef<MesocyclesTabRef>((props, ref) => {
  const [mesocycles, setMesocycles] = useState<Mesocycle[]>([]);
  const [plans, setPlans] = useState<MesocyclePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newMesocycle, setNewMesocycle] = useState({
    name: '',
    planId: '',
    iterations: 4,
  });

  useImperativeHandle(ref, () => ({
    openCreateDialog: () => setOpenDialog(true),
  }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mesocyclesRes, plansRes] = await Promise.all([
          fetch('/api/mesocycles'),
          fetch('/api/plans')
        ]);
        
        if (!mesocyclesRes.ok || !plansRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [mesocyclesData, plansData] = await Promise.all([
          mesocyclesRes.json(),
          plansRes.json()
        ]);

        setMesocycles(mesocyclesData);
        setPlans(plansData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateMesocycle = async () => {
    try {
      const response = await fetch('/api/mesocycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMesocycle),
      });

      if (!response.ok) {
        throw new Error('Failed to create mesocycle');
      }

      const data = await response.json();
      setMesocycles(prev => [...prev, data]);
      setOpenDialog(false);
      setNewMesocycle({ name: '', planId: '', iterations: 4 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mesocycle');
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'COMPLETE':
        return <CheckCircleIcon color="success" />;
      case 'IN_PROGRESS':
        return <PlayCircleIcon color="primary" />;
      default:
        return <PlayCircleOutlineIcon color="action" />;
    }
  };

  return (
    <Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }}>
          {mesocycles.map((mesocycle) => (
            <Box
              key={mesocycle.id}
              component={Link}
              href={`/mesocycles/${mesocycle.id}`}
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
                  {getStatusIcon(mesocycle.status)}
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700,
                      color: 'white',
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                      ml: 1.5
                    }}
                  >
                    {mesocycle.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FitnessCenterIcon sx={{ 
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
                    Based on: {mesocycle.plan.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    label={`${mesocycle.iterations} iterations`}
                    sx={{
                      background: `rgba(${themeColors.primary.main.replace('rgb(', '').replace(')', '')}, 0.1)`,
                      border: borders.accent,
                      color: themeColors.primary.main,
                    }}
                  />
                  {mesocycle.status === 'IN_PROGRESS' && (
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
                  {mesocycle.status === 'COMPLETE' && (
                    <Chip
                      size="small"
                      label="Complete"
                      sx={{
                        background: 'rgba(76, 175, 80, 0.1)',
                        border: '1px solid rgba(76, 175, 80, 0.2)',
                        color: 'rgba(76, 175, 80, 0.9)'
                      }}
                    />
                  )}
                  <Chip
                    size="small"
                    label={mesocycle.status === 'IN_PROGRESS' ? 'Continue Mesocycle →' : 'View Details →'}
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
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Mesocycle</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newMesocycle.name}
            onChange={(e) => setNewMesocycle(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Base Plan</InputLabel>
            <Select
              value={newMesocycle.planId}
              label="Base Plan"
              onChange={(e) => setNewMesocycle(prev => ({ ...prev, planId: e.target.value }))}
            >
              {plans.map((plan) => (
                <MenuItem key={plan.id} value={plan.id}>
                  {plan.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="number"
            margin="dense"
            label="Number of Iterations"
            fullWidth
            value={newMesocycle.iterations}
            onChange={(e) => setNewMesocycle(prev => ({ ...prev, iterations: parseInt(e.target.value) }))}
            inputProps={{ min: 1, max: 12 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <GradientButton 
            onClick={handleCreateMesocycle}
            disabled={!newMesocycle.name || !newMesocycle.planId || newMesocycle.iterations < 1}
          >
            Create
          </GradientButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

MesocyclesTab.displayName = 'MesocyclesTab';

export default MesocyclesTab;


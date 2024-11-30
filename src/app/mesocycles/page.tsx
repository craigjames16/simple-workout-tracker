'use client';

import { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
} from '@mui/material';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import FloatingActionButton from '@/components/FloatingActionButton';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';

interface Plan {
  id: number;
  name: string;
}

interface Mesocycle {
  id: number;
  name: string;
  plan: Plan;
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

export default function MesocyclesPage() {
  const [mesocycles, setMesocycles] = useState<Mesocycle[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newMesocycle, setNewMesocycle] = useState({
    name: '',
    planId: '',
    iterations: 4,
  });

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
        return <PauseCircleIcon color="action" />;
    }
  };

  if (loading) {
    return (
      <ResponsiveContainer maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </ResponsiveContainer>
    );
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      <ResponsiveContainer maxWidth="md" sx={{ mt: 4, pb: 10 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Mesocycles
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {mesocycles.map((mesocycle) => (
              <Card 
                key={mesocycle.id}
                component={Link}
                href={`/mesocycles/${mesocycle.id}`}
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
                  {getStatusIcon(mesocycle.status)}
                  <Box>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                      {mesocycle.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Based on: {mesocycle.plan.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Iterations: {mesocycle.iterations}
                    </Typography>
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
                  {mesocycle.status === 'IN_PROGRESS' ? 'Continue Mesocycle' : 'View Details'} →
                </Typography>
              </Card>
            ))}
          </Box>
        </Paper>

        <FloatingActionButton
          icon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          position="right"
        />

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
            <Button 
              onClick={handleCreateMesocycle}
              disabled={!newMesocycle.name || !newMesocycle.planId || newMesocycle.iterations < 1}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </ResponsiveContainer>
    </Box>
  );
} 
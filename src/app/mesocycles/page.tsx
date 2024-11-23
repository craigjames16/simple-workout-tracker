'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Box,
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';

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

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Mesocycles
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Create Mesocycle
          </Button>
        </Box>

        <Grid container spacing={2}>
          {mesocycles.map((mesocycle) => (
            <Grid item xs={12} sm={6} md={4} key={mesocycle.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {mesocycle.name}
                  </Typography>
                  <Typography color="text.secondary">
                    Based on: {mesocycle.plan.name}
                  </Typography>
                  <Typography color="text.secondary">
                    Iterations: {mesocycle.iterations}
                  </Typography>
                  <Typography color="text.secondary">
                    Status: {mesocycle.status || 'Not Started'}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    href={`/mesocycles/${mesocycle.id}`}
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    {mesocycle.status === 'IN_PROGRESS' ? 'Continue Mesocycle' : 'View Details'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

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
    </Container>
  );
} 
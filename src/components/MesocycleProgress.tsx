'use client';

import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Avatar, Chip, FormControl, InputLabel, 
  Select, MenuItem, IconButton, Menu, Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, TextField, CircularProgress
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EChartsReact from 'echarts-for-react';
import { gradients, themeColors } from '@/lib/theme-constants';
import GradientButton from '@/components/GradientButton';

interface Exercise {
  name: string;
  volume: number;
}

interface WorkoutIteration {
  iterationNumber: number;
  completedAt: string | null;
  exercises: Exercise[];
}

interface PlanDay {
  dayNumber: number;
  isRestDay: boolean;
  workout: {
    id: number;
    name: string;
  };
  iterations: WorkoutIteration[];
}

interface CurrentMesocycle {
  id: number;
  name: string;
  plan: {
    id: number;
    name: string;
  };
  planDays: PlanDay[];
  iterationVolumes?: { iterationNumber: number; totalVolume: number }[];
}

interface MesocycleListItem {
  id: number;
  name: string;
  plan?: {
    id: number;
    name: string;
  };
  status?: string;
}

interface MesocycleProgressProps {
  initialMesocycleId?: number | null;
}

export default function MesocycleProgress({ initialMesocycleId }: MesocycleProgressProps) {
  const [mesocycles, setMesocycles] = useState<MesocycleListItem[]>([]);
  const [selectedMesocycleId, setSelectedMesocycleId] = useState<number | null>(initialMesocycleId || null);
  const [mesocycle, setMesocycle] = useState<CurrentMesocycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [newMesocycle, setNewMesocycle] = useState({ name: '', planId: '', iterations: 4 });

  // Fetch all mesocycles
  useEffect(() => {
    const fetchMesocycles = async () => {
      try {
        const res = await fetch('/api/mesocycles');
        if (!res.ok) throw new Error('Failed to fetch mesocycles');
        const data = await res.json();
        setMesocycles(data);
        if (data.length > 0 && !selectedMesocycleId) {
          const inProgress = data.find((m: any) => m.status === 'IN_PROGRESS');
          setSelectedMesocycleId(inProgress ? inProgress.id : data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch mesocycles');
      } finally {
        setLoading(false);
      }
    };
    fetchMesocycles();
  }, []);

  // Fetch selected mesocycle data
  useEffect(() => {
    if (!selectedMesocycleId) {
      setMesocycle(null);
      return;
    }
    setLoading(true);
    const fetchMesocycleData = async () => {
      try {
        const res = await fetch(`/api/dashboard?data=mesocycle&id=${selectedMesocycleId}`);
        if (!res.ok) throw new Error('Failed to fetch mesocycle data');
        const data = await res.json();
        if (data.error) setError(data.error);
        else setMesocycle(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch mesocycle data');
      } finally {
        setLoading(false);
      }
    };
    fetchMesocycleData();
  }, [selectedMesocycleId]);

  // Fetch available plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/plans');
        if (!res.ok) throw new Error('Failed to fetch plans');
        const data = await res.json();
        setPlans(data);
      } catch (err) {
        // Silently ignore plan fetch errors
      }
    };
    fetchPlans();
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleCreateMesocycle = async () => {
    try {
      const response = await fetch('/api/mesocycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMesocycle),
      });
      if (!response.ok) throw new Error('Failed to create mesocycle');
      const data = await response.json();
      setMesocycles(prev => [...prev, data]);
      setSelectedMesocycleId(data.id);
      setCreateOpen(false);
      setNewMesocycle({ name: '', planId: '', iterations: 4 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mesocycle');
    }
  };

  const handleConfirmDelete = async () => {
    if (!mesocycle) return;
    try {
      const response = await fetch(`/api/mesocycles/${mesocycle.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete mesocycle');
      setMesocycles(prev => prev.filter(m => m.id !== mesocycle.id));
      const remaining = mesocycles.filter(m => m.id !== mesocycle.id);
      setSelectedMesocycleId(remaining.length ? remaining[0].id : null);
      setDeleteOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete mesocycle');
      setDeleteOpen(false);
    }
  };

  if (loading && mesocycles.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (mesocycles.length === 0) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        py: 8,
        px: 2
      }}>
        <Box sx={{ 
          mb: 4,
          borderRadius: 2,
          overflow: 'hidden',
          background: gradients.surface,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          p: { xs: 4, sm: 6 },
          maxWidth: 500,
          textAlign: 'center'
        }}>
          <FitnessCenterIcon sx={{ 
            fontSize: { xs: '3rem', sm: '4rem' },
            color: 'rgba(255, 255, 255, 0.7)',
            mb: 3
          }} />
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              color: 'white',
              fontSize: { xs: '1.5rem', sm: '2rem' },
              mb: 2
            }}
          >
            No Mesocycles Yet
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              mb: 4,
              lineHeight: 1.6
            }}
          >
            Create your first mesocycle to start tracking your workout progress and volume over time.
          </Typography>
          <GradientButton
            onClick={() => setCreateOpen(true)}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            <AddIcon sx={{ mr: 1 }} />
            Create Mesocycle
          </GradientButton>
        </Box>
      </Box>
    );
  }

  if (!mesocycle && selectedMesocycleId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!mesocycle) {
    return (
      <Typography 
        variant="h6" 
        sx={{ 
          color: 'rgba(255, 255, 255, 0.7)',
          textAlign: 'center',
          py: 4
        }}
      >
        No active mesocycle found
      </Typography>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Mesocycle Selection */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <FormControl 
          sx={{ 
            minWidth: 220,
            '& .MuiOutlinedInput-root': {
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 2,
              color: 'white',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
              },
              '&.Mui-focused': {
                borderColor: themeColors.primary.main,
                boxShadow: `0 0 0 3px rgba(${themeColors.primary.main.replace('rgb(', '').replace(')', '')}, 0.1)`
              },
              '& fieldset': {
                border: 'none'
              }
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-focused': {
                color: themeColors.primary.main
              }
            }
          }} 
          size="small"
        >
          <InputLabel id="mesocycle-select-label">Select Mesocycle</InputLabel>
          <Select
            labelId="mesocycle-select-label"
            value={selectedMesocycleId ?? ''}
            label="Select Mesocycle"
            onChange={e => setSelectedMesocycleId(Number(e.target.value))}
          >
            {mesocycles.map((m) => (
              <MenuItem key={m.id} value={m.id}>{m.name} ({m.plan?.name || 'No Plan'})</MenuItem>
            ))}
          </Select>
        </FormControl>

        <IconButton onClick={handleMenuOpen} sx={{ ml: 1, borderRadius: 1 }}>
          <MoreVertIcon />
        </IconButton>
      </Box>

      {/* Management Menu */}
      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { setHistoryOpen(true); handleMenuClose(); }}>
          <HistoryIcon fontSize="small" sx={{ mr: 1 }} /> History
        </MenuItem>
        <MenuItem onClick={() => { setCreateOpen(true); handleMenuClose(); }}>
          <AddIcon fontSize="small" sx={{ mr: 1 }} /> Create New
        </MenuItem>
        <MenuItem onClick={() => { setDeleteOpen(true); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete Mesocycle
        </MenuItem>
      </Menu>

      {/* Mesocycle Header */}
      <Box sx={{ 
        mb: 4,
        borderRadius: 2,
        overflow: 'hidden',
        background: gradients.surface,
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FitnessCenterIcon sx={{ 
              mr: 1.5, 
              color: 'white',
              fontSize: '1.5rem'
            }} />
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                color: 'white',
                fontSize: { xs: '1.5rem', sm: '2rem' }
              }}
            >
              {mesocycle.name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
              Based on plan: {mesocycle.plan.name}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Total Volume per Week Chart */}
      <Box sx={{ 
        mb: 4,
        borderRadius: 2,
        overflow: 'hidden',
        background: gradients.surface,
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              color: 'white',
              fontSize: { xs: '1.125rem', sm: '1.25rem' }
            }}
          >
            Total Volume per Week
          </Typography>
        </Box>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {mesocycle.iterationVolumes && mesocycle.iterationVolumes.length > 0 ? (
            <EChartsReact
              style={{ width: '100%', height: 300 }}
              option={{
                tooltip: { 
                  trigger: 'axis',
                  formatter: (params: any) => {
                    const data = params[0];
                    return `${data.name}<br/>Volume: ${data.value.toLocaleString()}`;
                  }
                },
                grid: { left: 80, right: 30, bottom: 50, top: 30 },
                xAxis: {
                  type: 'category',
                  data: mesocycle.iterationVolumes.map(v => `Week ${v.iterationNumber}`),
                  name: 'Week',
                  nameLocation: 'center',
                  nameGap: 30,
                  axisLabel: { fontSize: 14 },
                  splitLine: { show: false }
                },
                yAxis: {
                  type: 'value',
                  name: 'Volume',
                  nameLocation: 'center',
                  nameGap: 50,
                  axisLabel: { fontSize: 14 },
                  splitLine: { show: false },
                  axisLine: { show: false },
                  axisTick: { show: false }
                },
                series: [
                  {
                    data: (mesocycle.iterationVolumes || []).map((v, index) => {
                      let percentChange = 0;
                      if (index > 0 && mesocycle.iterationVolumes) {
                        const prevVolume = mesocycle.iterationVolumes[index - 1]?.totalVolume || 0;
                        percentChange = prevVolume > 0 ? ((v.totalVolume - prevVolume) / prevVolume * 100) : 0;
                      }
                      return {
                        value: v.totalVolume,
                        percentChange: percentChange
                      };
                    }),
                    type: 'bar',
                    itemStyle: { color: '#8884d8', borderRadius: [4, 4, 0, 0] },
                    barWidth: '60%',
                    label: {
                      show: true,
                      position: 'top',
                      formatter: (params: any) => {
                        const percentChange = params.data.percentChange;
                        if (percentChange === 0) return '';
                        const sign = percentChange > 0 ? '+' : '';
                        return `${sign}${percentChange.toFixed(1)}%`;
                      },
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: (params: any) => {
                        const percentChange = params.data.percentChange;
                        if (percentChange > 0) return '#4caf50';
                        if (percentChange < 0) return '#f44336';
                        return '#666';
                      }
                    }
                  }
                ]
              }}
            />
          ) : (
            <Box sx={{ 
              height: 300, 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                No Volume Data Available
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', maxWidth: 300 }}>
                Complete some workouts to see your volume progress over time
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Plan Days */}
      <Grid container spacing={3}>
        {[...mesocycle.planDays]
          .sort((a, b) => a.dayNumber - b.dayNumber)
          .map((day) => (
            <Grid item xs={12} key={day.dayNumber}>
              {!day.isRestDay ? (
                <Box sx={{ mb: 4 }}>
                  {/* Day Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: 'secondary.main',
                        mr: 2,
                        width: 40,
                        height: 40
                      }}
                    >
                      <FitnessCenterIcon />
                    </Avatar>
                    <Typography variant="h6">
                      Day {day.dayNumber}
                    </Typography>
                  </Box>

                  {/* Day Volume Chart */}
                  <Box sx={{
                    mb: 2,
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: gradients.surface,
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                  }}>
                    <Box sx={{ p: { xs: 2, sm: 3 } }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          color: 'white',
                          fontSize: { xs: '1.125rem', sm: '1.25rem' }
                        }}
                      >
                        Total Day Volume
                      </Typography>
                    </Box>
                    <Box sx={{ p: { xs: 2, sm: 3 } }}>
                      {day.iterations.filter((iteration) => !!iteration.completedAt).length > 0 ? (
                        <EChartsReact
                          style={{ width: '100%', height: 280 }}
                          option={{
                            tooltip: { 
                              trigger: 'axis',
                              formatter: (params: any) => {
                                const data = params[0];
                                return `${data.name}<br/>Volume: ${data.value.toLocaleString()}`;
                              }
                            },
                            grid: { 
                              left: 80, 
                              right: 30, 
                              bottom: 50, 
                              top: 60 
                            },
                            xAxis: {
                              type: 'category',
                              data: day.iterations
                                .filter((iteration) => !!iteration.completedAt)
                                .sort((a, b) => a.iterationNumber - b.iterationNumber)
                                .map((iteration) => `Week ${iteration.iterationNumber}`),
                              name: 'Week',
                              nameLocation: 'center',
                              nameGap: 30,
                              axisLabel: { fontSize: 13 },
                              splitLine: { show: false }
                            },
                            yAxis: {
                              type: 'value',
                              name: 'Volume',
                              nameLocation: 'center',
                              nameGap: 50,
                              axisLabel: { fontSize: 13 },
                              splitLine: { show: false },
                              axisLine: { show: false },
                              axisTick: { show: false }
                            },
                            series: [
                              {
                                data: day.iterations
                                  .filter((iteration) => !!iteration.completedAt)
                                  .sort((a, b) => a.iterationNumber - b.iterationNumber)
                                  .map((iteration, index, sortedIterations) => {
                                    const volume = iteration.exercises.reduce((sum, ex) => sum + (ex.volume || 0), 0);
                                    let percentChange = 0;
                                    if (index > 0) {
                                      const prevVolume = sortedIterations[index - 1].exercises.reduce((sum, ex) => sum + (ex.volume || 0), 0);
                                      percentChange = prevVolume > 0 ? ((volume - prevVolume) / prevVolume * 100) : 0;
                                    }
                                    return {
                                      value: volume,
                                      percentChange: percentChange
                                    };
                                  }),
                                type: 'bar',
                                itemStyle: { color: '#4caf50', borderRadius: [4, 4, 0, 0] },
                                barWidth: '60%',
                                label: {
                                  show: true,
                                  position: 'top',
                                  formatter: (params: any) => {
                                    const percentChange = params.data.percentChange;
                                    if (percentChange === 0) return '';
                                    const sign = percentChange > 0 ? '+' : '';
                                    return `${sign}${percentChange.toFixed(1)}%`;
                                  },
                                  fontSize: 12,
                                  fontWeight: 'bold',
                                  color: (params: any) => {
                                    const percentChange = params.data.percentChange;
                                    if (percentChange > 0) return '#4caf50';
                                    if (percentChange < 0) return '#f44336';
                                    return '#666';
                                  }
                                }
                              }
                            ]
                          }}
                        />
                      ) : (
                        <Box sx={{ 
                          height: 280, 
                          display: 'flex', 
                          flexDirection: 'column',
                          justifyContent: 'center', 
                          alignItems: 'center',
                          color: 'rgba(255, 255, 255, 0.6)'
                        }}>
                          <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                            No Volume Data Available
                          </Typography>
                          <Typography variant="body2" sx={{ textAlign: 'center', maxWidth: 300 }}>
                            Complete this workout to see your volume progress
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Exercise Progress Table */}
                  <Box sx={{ 
                    mt: 2,
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: gradients.surface,
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                  }}>
                    <Box sx={{ p: { xs: 2, sm: 3 } }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          color: 'white',
                          fontSize: { xs: '1.125rem', sm: '1.25rem' }
                        }}
                      >
                        Exercise Progress
                      </Typography>
                    </Box>
                    <Box sx={{ p: { xs: 2, sm: 3 } }}>
                      {day.iterations.filter((iteration) => !!iteration.completedAt).length > 1 ? (
                        <Box sx={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: 'white' }}>
                                  Exercise
                                </th>
                                {day.iterations
                                  .filter((iteration) => !!iteration.completedAt)
                                  .sort((a, b) => a.iterationNumber - b.iterationNumber)
                                  .slice(1)
                                  .map((iteration) => (
                                    <th key={iteration.iterationNumber} style={{ 
                                      textAlign: 'center', 
                                      padding: '8px 12px', 
                                      fontWeight: 600,
                                      minWidth: '80px',
                                      color: 'white'
                                    }}>
                                      Week {iteration.iterationNumber}
                                    </th>
                                  ))}
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from(new Set(
                                day.iterations
                                  .filter((iteration) => !!iteration.completedAt)
                                  .flatMap((iteration) => iteration.exercises?.map((ex) => ex.name) || [])
                              )).map((exerciseName: string) => (
                                <tr key={exerciseName} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                  <td style={{ 
                                    padding: '12px', 
                                    fontWeight: 500,
                                    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                                    color: 'rgba(255, 255, 255, 0.9)'
                                  }}>
                                    {exerciseName}
                                  </td>
                                  {day.iterations
                                    .filter((iteration) => !!iteration.completedAt)
                                    .sort((a, b) => a.iterationNumber - b.iterationNumber)
                                    .slice(1)
                                    .map((iteration, index) => {
                                      const currentEx = iteration.exercises.find((ex) => ex.name === exerciseName);
                                      const prevIteration = day.iterations
                                        .filter((iter) => !!iter.completedAt)
                                        .sort((a, b) => a.iterationNumber - b.iterationNumber)[index];
                                      const prevEx = prevIteration?.exercises.find((ex) => ex.name === exerciseName);
                                      
                                      let changeText = '-';
                                      let changeColor = '#666';
                                      
                                      if (currentEx && prevEx && prevEx.volume > 0) {
                                        const percentChange = ((currentEx.volume - prevEx.volume) / prevEx.volume * 100);
                                        const sign = percentChange > 0 ? '+' : '';
                                        changeText = `${sign}${percentChange.toFixed(1)}%`;
                                        changeColor = percentChange > 0 ? '#4caf50' : percentChange < 0 ? '#f44336' : '#666';
                                      } else if (currentEx && !prevEx) {
                                        changeText = 'New';
                                        changeColor = '#2196f3';
                                      } else if (!currentEx && prevEx) {
                                        changeText = 'Removed';
                                        changeColor = '#ff9800';
                                      }
                                      
                                      return (
                                        <td key={`${exerciseName}-${iteration.iterationNumber}`} style={{ 
                                          padding: '12px', 
                                          textAlign: 'center',
                                          color: changeColor,
                                          fontWeight: 600,
                                          fontSize: '0.875rem'
                                        }}>
                                          {changeText}
                                        </td>
                                      );
                                    })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Box>
                      ) : (
                        <Box sx={{ 
                          height: 200, 
                          display: 'flex', 
                          flexDirection: 'column',
                          justifyContent: 'center', 
                          alignItems: 'center',
                          color: 'rgba(255, 255, 255, 0.6)'
                        }}>
                          <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                            No Progress Data Available
                          </Typography>
                          <Typography variant="body2" sx={{ textAlign: 'center', maxWidth: 300 }}>
                            Complete at least 2 workouts to see exercise progress comparison
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: 'info.main',
                        mr: 2,
                        width: 40,
                        height: 40
                      }}
                    >
                      {day.dayNumber}
                    </Avatar>
                    <Typography variant="h6">
                      Day {day.dayNumber} - Rest Day
                    </Typography>
                    <Chip 
                      label="Rest Day" 
                      color="info" 
                      size="small" 
                      sx={{ ml: 2 }}
                    />
                  </Box>
                </Box>
              )}
            </Grid>
          ))}
      </Grid>

      {/* Management Dialogs */}
      {/* Create Mesocycle Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <DialogTitle>Create New Mesocycle</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Name"
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
              {plans.map((plan: any) => (
                <MenuItem key={plan.id} value={plan.id}>{plan.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label="Number of Iterations"
            value={newMesocycle.iterations}
            onChange={(e) => setNewMesocycle(prev => ({ ...prev, iterations: parseInt(e.target.value) }))}
            inputProps={{ min: 1, max: 12 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateMesocycle} variant="contained" disabled={!newMesocycle.name || !newMesocycle.planId}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Mesocycle</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this mesocycle? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


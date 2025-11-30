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
import { CombinedDataTab } from '@/components/dashboard/CombinedDataTab';
import { MesocycleSelect } from '@/components/dashboard/MesocycleSelect';

interface Exercise {
  name: string;
  volume: number;
  category?: string;
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

export default function MesocycleProgress() {
  const [mesocycles, setMesocycles] = useState<MesocycleListItem[]>([]);
  const [selectedMesocycleId, setSelectedMesocycleId] = useState<number | null>(null);
  const [mesocycle, setMesocycle] = useState<CurrentMesocycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [newMesocycle, setNewMesocycle] = useState({ name: '', planId: '', iterations: 4 });

  // Fetch all mesocycles and select initial one
  useEffect(() => {
    const fetchMesocycles = async () => {
      try {
        const res = await fetch('/api/mesocycles');
        if (!res.ok) throw new Error('Failed to fetch mesocycles');
        const data = await res.json();
        setMesocycles(data);
        if (data.length > 0 && !selectedMesocycleId) {
          // Find mesocycle in progress, or use the first one
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
        const mesocycleRes = await fetch(`/api/dashboard?data=mesocycle&id=${selectedMesocycleId}`);
        
        if (!mesocycleRes.ok) throw new Error('Failed to fetch mesocycle data');
        const data = await mesocycleRes.json();
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
      <MesocycleSelect
        value={selectedMesocycleId}
        onChange={(value) => setSelectedMesocycleId(typeof value === 'number' ? value : null)}
        label="Select Mesocycle"
        showPlanName={true}
      />

      {/* Combined Volume & Sets Data */}
      <CombinedDataTab 
        preSelectedMesocycleId={selectedMesocycleId} 
        hideFilter={true}
        hideBarCharts={true}
        hideToggle={true}
        sx={{ mb: 4 }}
      />

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
          {mesocycle.iterationVolumes && mesocycle.iterationVolumes.length > 0 ? (() => {
            // Get all workout days (non-rest days) sorted by day number
            const workoutDays = mesocycle.planDays
              .filter(day => !day.isRestDay)
              .sort((a, b) => a.dayNumber - b.dayNumber);

            // Get all iteration numbers that have data
            const iterations = mesocycle.iterationVolumes
              .map(v => v.iterationNumber)
              .sort((a, b) => a - b);

            // Build raw data: for each day, get volume for each iteration
            const rawData: number[][] = workoutDays.map(day => {
              return iterations.map(iterationNumber => {
                const iteration = day.iterations.find(
                  iter => iter.iterationNumber === iterationNumber && iter.completedAt
                );
                if (!iteration) return 0;
                return iteration.exercises.reduce((sum, ex) => sum + (ex.volume || 0), 0);
              });
            });

            // Calculate total volume for each iteration (week)
            const totalData: number[] = [];
            for (let i = 0; i < iterations.length; ++i) {
              let sum = 0;
              for (let j = 0; j < rawData.length; ++j) {
                sum += rawData[j][i];
              }
              totalData.push(sum);
            }

            // Theme-based color palette matching the app's purple/blue theme
            const themeColors = [
              '#8884d8', // Purple (matches radar chart)
              '#6366f1', // Indigo
              '#8b5cf6', // Violet
              '#a855f7', // Purple
              '#c084fc', // Light purple
              '#7c3aed', // Deep purple
              '#5b21b6', // Dark purple
              '#4f46e5', // Indigo
            ];

            // Create series for each day
            const series = workoutDays.map((day, dayIndex) => {
              const dayName = `Day ${day.dayNumber}`;
              const color = themeColors[dayIndex % themeColors.length];
              return {
                name: dayName,
                type: 'bar' as const,
                stack: 'total',
                barWidth: '60%',
                label: {
                  show: true,
                  formatter: (params: any) => {
                    const value = params.value;
                    const total = totalData[params.dataIndex];
                    if (total <= 0) return '0%';
                    const percentage = (value / total) * 100;
                    return Math.round(percentage * 10) / 10 + '%';
                  },
                  fontSize: 11,
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 'bold'
                },
                data: rawData[dayIndex].map((d, iterationIndex) => {
                  const total = totalData[iterationIndex];
                  return total <= 0 ? 0 : d;
                }),
                itemStyle: {
                  color: color
                }
              };
            });

            return (
              <EChartsReact
                style={{ width: '100%', height: 300 }}
                option={{
                  tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                      type: 'shadow'
                    },
                    formatter: (params: any) => {
                      let result = `${params[0].name}<br/>`;
                      let total = 0;
                      params.forEach((param: any) => {
                        const value = param.value;
                        total += value;
                        result += `${param.marker}${param.seriesName}: ${value.toLocaleString()}<br/>`;
                      });
                      result += `<strong>Total: ${total.toLocaleString()}</strong>`;
                      return result;
                    }
                  },
                  legend: {
                    data: workoutDays.map(day => `Day ${day.dayNumber}`),
                    bottom: 0,
                    textStyle: {
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: 12
                    },
                    itemGap: 20,
                    itemWidth: 14,
                    itemHeight: 14
                  },
                  grid: { left: 80, right: 30, bottom: 50, top: 30 },
                  xAxis: {
                    type: 'category',
                    data: iterations.map(iter => `Week ${iter}`),
                    name: 'Week',
                    nameLocation: 'center',
                    nameGap: 30,
                    axisLabel: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
                    splitLine: { show: false },
                    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } }
                  },
                  yAxis: {
                    type: 'value',
                    name: 'Volume',
                    nameLocation: 'center',
                    nameGap: 50,
                    axisLabel: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
                    splitLine: { 
                      show: true,
                      lineStyle: { color: 'rgba(255,255,255,0.1)' }
                    },
                    axisLine: { show: false },
                    axisTick: { show: false }
                  },
                  series
                }}
              />
            );
          })() : (
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
                        Total Day Volume (By Muscle Group)
                      </Typography>
                    </Box>
                    <Box sx={{ p: { xs: 2, sm: 3 } }}>
                      {day.iterations.filter((iteration) => !!iteration.completedAt).length > 0 ? (() => {
                        const completedIterations = day.iterations
                          .filter((iteration) => !!iteration.completedAt)
                          .sort((a, b) => a.iterationNumber - b.iterationNumber);
                        
                        // Calculate total volumes and percentage changes per iteration
                        const iterationTotals = completedIterations.map((iteration, index) => {
                          const currentVolume = iteration.exercises.reduce((sum, ex) => sum + (ex.volume || 0), 0);
                          let percentChange = 0;
                          if (index > 0) {
                            const prevVolume = completedIterations[index - 1].exercises.reduce((sum, ex) => sum + (ex.volume || 0), 0);
                            percentChange = prevVolume > 0 ? ((currentVolume - prevVolume) / prevVolume * 100) : 0;
                          }
                          return {
                            volume: currentVolume,
                            percentChange
                          };
                        });

                        const allCategories = new Set<string>();
                        completedIterations.forEach(iteration => {
                          iteration.exercises.forEach(ex => {
                            if (ex.category) allCategories.add(ex.category);
                            else allCategories.add('Other');
                          });
                        });
                        const categories = Array.from(allCategories).sort();
                        
                        const CATEGORY_COLORS: Record<string, string> = {
                          'BACK': '#3b82f6', // Blue
                          'BICEPS': '#8b5cf6', // Purple
                          'TRICEPS': '#be185d', // Muted Rose
                          'CHEST': '#b91c1c', // Muted Red
                          'SHOULDERS': '#f59e0b', // Orange
                          'HAMSTRINGS': '#10b981', // Green
                          'QUADS': '#059669', // Emerald
                          'CALVES': '#14b8a6', // Teal
                          'ABS': '#64748b', // Slate
                          'CORE': '#64748b',
                          'CARDIO': '#06b6d4', // Cyan
                        };

                        const getCategoryColor = (cat: string) => {
                          return CATEGORY_COLORS[cat.toUpperCase()] || '#a1a1aa';
                        };

                        const series: any[] = categories.map((category) => ({
                          name: category,
                          type: 'bar',
                          stack: 'total',
                          barWidth: '60%',
                          data: completedIterations.map(iteration => {
                            return iteration.exercises
                              .filter(ex => (ex.category || 'Other') === category)
                              .reduce((sum, ex) => sum + (ex.volume || 0), 0);
                          }),
                          itemStyle: { color: getCategoryColor(category) },
                          label: { show: false }
                        }));

                        // Add a transparent line series for displaying the percentage change on top
                        series.push({
                          name: 'Total Change',
                          type: 'line',
                          symbol: 'circle',
                          symbolSize: 0,
                          lineStyle: { opacity: 0 },
                          data: iterationTotals.map(t => t.volume),
                          label: {
                            show: true,
                            position: 'top',
                            formatter: (params: any) => {
                              const index = params.dataIndex;
                              const percentChange = iterationTotals[index].percentChange;
                              if (index === 0 || percentChange === 0) return '';
                              const sign = percentChange > 0 ? '+' : '';
                              // Use rich text formatting tags
                              const style = percentChange > 0 ? 'pos' : 'neg';
                              return `{${style}|${sign}${percentChange.toFixed(1)}%}`;
                            },
                            rich: {
                              pos: {
                                color: '#4caf50',
                                fontWeight: 'bold',
                                fontSize: 12
                              },
                              neg: {
                                color: '#f44336',
                                fontWeight: 'bold',
                                fontSize: 12
                              }
                            }
                          },
                          tooltip: { show: false } // Hide tooltip for this auxiliary series
                        });

                        return (
                          <EChartsReact
                            style={{ width: '100%', height: 300 }}
                            option={{
                              tooltip: { 
                                trigger: 'axis',
                                axisPointer: { type: 'shadow' },
                                formatter: (params: any) => {
                                  // Filter out the auxiliary series from tooltip
                                  const validParams = params.filter((p: any) => p.seriesName !== 'Total Change');
                                  if (validParams.length === 0) return '';

                                  let result = `${validParams[0].name}<br/>`;
                                  let total = 0;
                                  validParams.forEach((param: any) => {
                                    const value = param.value;
                                    if (value > 0) {
                                      total += value;
                                      result += `${param.marker}${param.seriesName}: ${value.toLocaleString()}<br/>`;
                                    }
                                  });
                                  result += `<strong>Total: ${total.toLocaleString()}</strong>`;
                                  
                                  // Add percent change to tooltip
                                  const index = validParams[0].dataIndex;
                                  if (index > 0) {
                                    const percentChange = iterationTotals[index].percentChange;
                                    const sign = percentChange > 0 ? '+' : '';
                                    const color = percentChange > 0 ? '#4caf50' : percentChange < 0 ? '#f44336' : '#999';
                                    result += `<br/><span style="color:${color}">Change: ${sign}${percentChange.toFixed(1)}%</span>`;
                                  }
                                  
                                  return result;
                                }
                              },
                              legend: {
                                data: categories,
                                bottom: 0,
                                textStyle: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
                                itemGap: 20,
                                itemWidth: 14,
                                itemHeight: 14
                              },
                              grid: { left: 80, right: 30, bottom: 50, top: 30 },
                              xAxis: {
                                type: 'category',
                                data: completedIterations.map((iteration) => `Week ${iteration.iterationNumber}`),
                                name: 'Week',
                                nameLocation: 'center',
                                nameGap: 30,
                                axisLabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
                                splitLine: { show: false },
                                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } }
                              },
                              yAxis: {
                                type: 'value',
                                name: 'Volume',
                                nameLocation: 'center',
                                nameGap: 50,
                                axisLabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
                                splitLine: { show: true, lineStyle: { color: 'rgba(255,255,255,0.1)' } },
                                axisLine: { show: false },
                                axisTick: { show: false }
                              },
                              series: series
                            }}
                          />
                        );
                      })() : (
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

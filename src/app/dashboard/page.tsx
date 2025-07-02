'use client';

import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { 
  Paper, Typography, Box, Tabs, Tab, Card, CardContent, Grid, Chip, CircularProgress,
  Divider, useTheme, useMediaQuery, Avatar, List, ListItem, ListItemText, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, IconButton, Menu, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress
} from '@mui/material';
import { useEffect, useState } from 'react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import EChartsReact from 'echarts-for-react';
import Link from 'next/link';

import GradientButton from '@/components/GradientButton';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      style={{ flexGrow: 1, minHeight: 0 }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%', pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`,
  };
}

interface Exercise {
  id: number;
  name: string;
  category: string;
  volume: number;
  volumeChange: number;
  sets: Array<{
    weight: number;
    reps: number;
    setNumber: number;
  }>;
  order?: number;
}

interface WorkoutIteration {
  iterationNumber: number;
  completedAt: string | null;
  exercises: Exercise[];
  volumeSummary?: {
    increased: number;
    decreased: number;
  };
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

interface PlanInstance {
  id: number;
  status: string | null;
  iterationNumber: number;
  rir: number;
  completedAt: string | null;
  days: Array<{
    id: number;
    isComplete: boolean;
    planDay: {
      isRestDay: boolean;
      dayNumber: number;
    };
    workoutInstance: {
      id: number;
      completedAt: string | null;
      workoutExercises: Array<{
        id: number;
        exercise: {
          name: string;
        };
      }>;
    } | null;
  }>;
}

interface MesocycleDetail {
  id: number;
  name: string;
  plan: {
    id: number;
    name: string;
  };
  iterations: number;
  status: string | null;
  instances: PlanInstance[];
  startedAt: string;
  completedAt: string | null;
}

// Helper component for consistent exercise displays
const ExerciseCard = ({ exercise }: { exercise: Exercise }) => {
  const formatVolume = (volume: number) => {
    return Math.round(volume).toLocaleString();
  };

  const formatVolumeChange = (change: number) => {
    const formatted = Math.abs(Math.round(change));
    return `${formatted}%`;
  };

  const getVolumeChangeColor = (change: number) => {
    if (change > 0) return 'success.main';
    if (change < 0) return 'error.main';
    return 'text.secondary';
  };

  const getVolumeChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUpIcon fontSize="small" />;
    if (change < 0) return <TrendingDownIcon fontSize="small" />;
    return null;
  };

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: 1, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar 
            sx={{ 
              bgcolor: 'primary.main', 
              width: 32, 
              height: 32, 
              mr: 1,
              fontSize: '0.875rem'
            }}
          >
            {exercise.name.substring(0, 2).toUpperCase()}
          </Avatar>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            {exercise.name}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Volume
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {formatVolume(exercise.volume)}
          </Typography>
        </Box>
        
        {exercise.volumeChange !== 0 && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            mb: 1,
            color: getVolumeChangeColor(exercise.volumeChange),
            justifyContent: 'flex-end'
          }}>
            {getVolumeChangeIcon(exercise.volumeChange)}
            <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 'medium' }}>
              {formatVolumeChange(exercise.volumeChange)}
            </Typography>
          </Box>
        )}
        
        <Divider sx={{ my: 1 }} />
        
        <List dense disablePadding>
          {exercise.sets.map((set) => (
            <ListItem 
              key={set.setNumber} 
              disablePadding 
              disableGutters
              sx={{ 
                py: 0.5, 
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': {
                  borderBottom: 'none'
                }
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Set {set.setNumber}
                    </Typography>
                    <Typography variant="body2">
                      {set.weight} kg × {set.reps}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};



export default function DashboardPage() {
  const [tabValue, setTabValue] = useState(0);
  const [muscleGroups, setMuscleGroups] = useState<any>(null);
  const [mesocycles, setMesocycles] = useState<any[]>([]);
  const [selectedMesocycleId, setSelectedMesocycleId] = useState<number | null>(null);
  const [selectedMesocycle, setSelectedMesocycle] = useState<CurrentMesocycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});
  const [expandedIterations, setExpandedIterations] = useState<Record<string, boolean>>({});
  // State for mesocycle management actions
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [newMesocycle, setNewMesocycle] = useState({ name: '', planId: '', iterations: 4 });
  const [mesocycleDetail, setMesocycleDetail] = useState<MesocycleDetail | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Fetch all mesocycles on mount
  useEffect(() => {
    const fetchMesocycles = async () => {
      try {
        const res = await fetch('/api/mesocycles');
        if (!res.ok) throw new Error('Failed to fetch mesocycles');
        const data = await res.json();
        setMesocycles(data);
        // Default to first mesocycle or the one in progress
        if (data.length > 0) {
          const inProgress = data.find((m: any) => m.status === 'IN_PROGRESS');
          setSelectedMesocycleId(inProgress ? inProgress.id : data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch mesocycles');
      }
    };
    fetchMesocycles();
  }, []);

  // Fetch selected mesocycle data
  useEffect(() => {
    if (!selectedMesocycleId) return;
    setLoading(true);
    const fetchMesocycleData = async () => {
      try {
        const res = await fetch(`/api/dashboard?data=mesocycle&id=${selectedMesocycleId}`);
        if (!res.ok) throw new Error('Failed to fetch mesocycle data');
        const data = await res.json();
        if (data.error) setError(data.error);
        else setSelectedMesocycle(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch mesocycle data');
      } finally {
        setLoading(false);
      }
    };
    fetchMesocycleData();
  }, [selectedMesocycleId]);

  // Fetch muscle group data (unchanged)
  useEffect(() => {
    const fetchMuscleGroups = async () => {
      try {
        const res = await fetch('/api/dashboard?data=muscleGroups');
        if (!res.ok) throw new Error('Failed to fetch muscle group data');
        const data = await res.json();
        setMuscleGroups(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch muscle group data');
      }
    };
    fetchMuscleGroups();
  }, []);

  // Fetch available plans for creating new mesocycles
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/plans');
        if (!res.ok) throw new Error('Failed to fetch plans');
        const data = await res.json();
        setPlans(data);
      } catch (err) {
        /* silently ignore plan fetch errors so we don't block main UI */
      }
    };
    fetchPlans();
  }, []);

  // Toggle expanded state for a day
  const toggleDayExpanded = (dayNumber: number) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayNumber]: !prev[dayNumber]
    }));
  };

  // Toggle expanded state for an iteration
  const toggleIterationExpanded = (dayNumber: number, iterationNumber: number) => {
    const key = `${dayNumber}-${iterationNumber}`;
    setExpandedIterations(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Check if a day is expanded
  const isDayExpanded = (dayNumber: number) => {
    return expandedDays[dayNumber] === true; // Default to collapsed
  };

  // Check if an iteration is expanded
  const isIterationExpanded = (dayNumber: number, iterationNumber: number) => {
    const key = `${dayNumber}-${iterationNumber}`;
    return expandedIterations[key] === true; // Default to collapsed
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Fetch detailed mesocycle data when history dialog is opened
  useEffect(() => {
    if (!historyOpen || !selectedMesocycle) return;
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/mesocycles/${selectedMesocycle.id}`);
        if (!res.ok) throw new Error('Failed to fetch mesocycle detail');
        const data = await res.json();
        setMesocycleDetail(data);
      } catch (err) {
        /* no-op: error will be shown via existing error mechanism */
      }
    };
    fetchDetail();
  }, [historyOpen, selectedMesocycle]);

  /* --------------------------- Mesocycle actions --------------------------- */
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
    if (!selectedMesocycle) return;
    try {
      const response = await fetch(`/api/mesocycles/${selectedMesocycle.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete mesocycle');
      setMesocycles(prev => prev.filter(m => m.id !== selectedMesocycle.id));
      const remaining = mesocycles.filter(m => m.id !== selectedMesocycle.id);
      setSelectedMesocycleId(remaining.length ? remaining[0].id : null);
      setDeleteOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete mesocycle');
      setDeleteOpen(false);
    }
  };

  const handleCompleteRestDay = async (instanceId: number, dayId: number) => {
    try {
      const response = await fetch(
        `/api/plan-instances/${instanceId}/days/${dayId}/complete-rest`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to complete rest day');
      }

      // Refresh the mesocycle detail data
      const updatedDetail = await fetch(`/api/mesocycles/${selectedMesocycle?.id}`);
      const data = await updatedDetail.json();
      setMesocycleDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleStartWorkout = async (instanceId: number, dayId: number) => {
    try {
      const response = await fetch(
        `/api/plan-instances/${instanceId}/days/${dayId}/start`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to start workout');
      }

      const workoutInstance = await response.json();

      // Redirect to the track page with the new workout instance
      window.location.href = `/track/${workoutInstance.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <ResponsiveContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      </ResponsiveContainer>
    );
  }

  if (error) {
    return (
      <ResponsiveContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="lg">
      <Box sx={{
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 2, sm: 3 },
      }}>
        <Box sx={{
          pb: { xs: 2, sm: 3 },
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              color: 'white',
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            Dashboard
          </Typography>
        </Box>

        <Box sx={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          mb: 2
        }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="dashboard tabs"
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{
              '& .MuiTabs-root': {
                minHeight: 40,
              },
              '& .MuiTab-root': {
                minWidth: 'auto',
                px: 3,
                py: 1.5,
                borderRadius: 1,
                color: 'rgba(156, 163, 175, 0.9)',
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  transform: 'translateY(-1px)'
                },
                                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.06) 100%)',
                        color: 'white',
                        fontWeight: 600,
                        border: '1px solid rgba(59, 130, 246, 0.15)',
                        boxShadow: '0 4px 12px -4px rgba(59, 130, 246, 0.1)'
                      }
              },
              '& .MuiTabs-indicator': {
                display: 'none'
              }
            }}
          >
            <Tab label="Mesocycle" {...a11yProps(0)} />
            <Tab label="Volume Data" {...a11yProps(1)} />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          {/* Mesocycle selection dropdown */}
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
                    borderColor: 'rgba(59, 130, 246, 0.5)',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  },
                  '& fieldset': {
                    border: 'none'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: 'rgba(59, 130, 246, 0.8)'
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
          
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            {selectedMesocycle ? (
              <>
                <Box sx={{ 
                  mb: 4,
                  borderRadius: 2,
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}>
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
                        variant="h4" 
                        sx={{ 
                          fontWeight: 700,
                          color: 'white',
                          fontSize: { xs: '1.5rem', sm: '2rem' }
                        }}
                      >
                        {selectedMesocycle.name}
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
                        Based on plan: {selectedMesocycle.plan.name}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* ECharts volume per iteration chart will go here */}
                <Box sx={{ 
                  mb: 4,
                  borderRadius: 2,
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}>
                  <Box sx={{
                    p: { xs: 2, sm: 3 },
                  }}>
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
                    {selectedMesocycle.iterationVolumes && selectedMesocycle.iterationVolumes.length > 0 ? (
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
                            data: selectedMesocycle.iterationVolumes?.map(v => `Week ${v.iterationNumber}`) || [],
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
                              data: selectedMesocycle.iterationVolumes?.map((v, index) => {
                                let percentChange = 0;
                                if (index > 0) {
                                  const prevVolume = selectedMesocycle.iterationVolumes?.[index - 1]?.totalVolume || 0;
                                  percentChange = prevVolume > 0 ? ((v.totalVolume - prevVolume) / prevVolume * 100) : 0;
                                }
                                return {
                                  value: v.totalVolume,
                                  percentChange: percentChange
                                };
                              }) || [],
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

                <Grid container spacing={3}>
                  {[...selectedMesocycle.planDays]
                    .sort((a, b) => a.dayNumber - b.dayNumber)
                    .map((day) => (
                      <Grid item xs={12} key={day.dayNumber}>
                        {!day.isRestDay ? (
                          <Box sx={{ mb: 4 }}>
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
                            <Box sx={{
                              borderRadius: 2,
                              overflow: 'hidden',
                              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                              backdropFilter: 'blur(20px)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                            }}>
                              <Box sx={{
                                p: { xs: 2, sm: 3 },
                              }}>
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
                                {day.iterations.filter((iteration: any) => !!iteration.completedAt).length > 0 ? (
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
                                          .filter((iteration: any) => !!iteration.completedAt)
                                          .sort((a, b) => a.iterationNumber - b.iterationNumber)
                                          .map((iteration: any) => `Week ${iteration.iterationNumber}`),
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
                                            .filter((iteration: any) => !!iteration.completedAt)
                                            .sort((a, b) => a.iterationNumber - b.iterationNumber)
                                            .map((iteration: any, index: number, sortedIterations: any[]) => {
                                              const volume = iteration.exercises.reduce((sum: number, ex: any) => sum + (ex.volume || 0), 0);
                                              let percentChange = 0;
                                              if (index > 0) {
                                                const prevVolume = sortedIterations[index - 1].exercises.reduce((sum: number, ex: any) => sum + (ex.volume || 0), 0);
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

                            {/* Exercise List with Week-over-Week Progress */}
                            <Box sx={{ 
                              mt: 2,
                              borderRadius: 2,
                              overflow: 'hidden',
                              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                              backdropFilter: 'blur(20px)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                            }}>
                              <Box sx={{
                                p: { xs: 2, sm: 3 },
                              }}>
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
                                {day.iterations.filter((iteration: any) => !!iteration.completedAt).length > 1 ? (
                                  <Box sx={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                      <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                          <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: 'white' }}>
                                            Exercise
                                          </th>
                                          {day.iterations
                                            .filter((iteration: any) => !!iteration.completedAt)
                                            .sort((a, b) => a.iterationNumber - b.iterationNumber)
                                            .slice(1) // Skip first week since no previous data
                                            .map((iteration: any) => (
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
                                        {/* Get all unique exercises across all iterations */}
                                        {Array.from(new Set(
                                          day.iterations
                                            .filter((iteration: any) => !!iteration.completedAt)
                                            .flatMap((iteration: any) => iteration.exercises?.map((ex: any) => ex.name) || [])
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
                                              .filter((iteration: any) => !!iteration.completedAt)
                                              .sort((a, b) => a.iterationNumber - b.iterationNumber)
                                              .slice(1)
                                              .map((iteration: any, index: number) => {
                                                const currentEx = iteration.exercises.find((ex: any) => ex.name === exerciseName);
                                                const prevIteration = day.iterations
                                                  .filter((iter: any) => !!iter.completedAt)
                                                  .sort((a, b) => a.iterationNumber - b.iterationNumber)[index]; // Previous iteration
                                                const prevEx = prevIteration?.exercises.find((ex: any) => ex.name === exerciseName);
                                                
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
              </>
            ) : (
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
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            {muscleGroups ? (
              <Box>
                {Object.entries(muscleGroups as Record<string, any[]>).map(([muscleGroup, instances]: [string, any[]]) => {
                  // Transform the data for ECharts
                  interface TransformedDataPoint {
                    instanceId: string;
                    rollingVolume: number;
                    volume: number;
                    date: string;
                    shortDate: string;
                  }
                  
                  const transformedData: TransformedDataPoint[] = instances.map((instance: any, index: number) => {
                    const [instanceId, data] = Object.entries(instance)[0] as [string, { volume: number; date: string }];
                    let rollingVolume = data.volume;
                    
                    if (index >= 3) {
                      // Get up to 3 previous instances plus current instance
                      const startIdx = Math.max(0, index - 3);
                      const relevantInstances = instances.slice(startIdx, index + 1);
                      rollingVolume = relevantInstances
                        .map((inst: any) => (Object.values(inst)[0] as { volume: number }).volume)
                        .reduce((acc: number, curr: number) => acc + curr, 0);
                    }

                    return {
                      instanceId,
                      rollingVolume: rollingVolume / 3,
                      volume: data.volume,
                      date: new Date(data.date).toLocaleDateString(),
                      shortDate: new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    };
                  });

                  return (
                    <Box key={muscleGroup} sx={{ 
                      mb: 4,
                      borderRadius: 2,
                      overflow: 'hidden',
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                      <Box sx={{
                        p: { xs: 2, sm: 3 },
                      }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700,
                            color: 'white',
                            fontSize: { xs: '1.125rem', sm: '1.25rem' }
                          }}
                        >
                          {muscleGroup}
                        </Typography>
                      </Box>
                      <Box sx={{ p: { xs: 2, sm: 3 } }}>
                        <EChartsReact
                          style={{ width: '100%', height: 300 }}
                          option={{
                            tooltip: {
                              trigger: 'axis',
                              axisPointer: {
                                type: 'cross',
                                crossStyle: {
                                  color: '#999'
                                }
                              },
                              formatter: (params: any) => {
                                let result = `${params[0].name}<br/>`;
                                params.forEach((param: any) => {
                                  const value = param.seriesName === 'Rolling Average' 
                                    ? param.value.toFixed(1) 
                                    : param.value.toLocaleString();
                                  result += `${param.marker}${param.seriesName}: ${value}<br/>`;
                                });
                                return result;
                              }
                            },
                            legend: {
                              data: ['Volume', 'Rolling Average'],
                              top: 10,
                              textStyle: {
                                color: '#ffffff',
                                fontSize: 14,
                                fontWeight: 'bold'
                              }
                            },
                            grid: {
                              left: 60,
                              right: 60,
                              bottom: 60,
                              top: 60
                            },
                            xAxis: [
                              {
                                type: 'category',
                                data: transformedData.map((d: TransformedDataPoint) => d.shortDate),
                                axisPointer: {
                                  type: 'shadow'
                                },
                                axisLabel: {
                                  fontSize: 12,
                                  rotate: transformedData.length > 8 ? 45 : 0
                                },
                                name: 'Date',
                                nameLocation: 'center',
                                nameGap: 35
                              }
                            ],
                            yAxis: [
                              {
                                type: 'value',
                                name: 'Volume',
                                nameLocation: 'center',
                                nameGap: 40,
                                axisLabel: {
                                  fontSize: 12
                                },
                                splitLine: {
                                  show: false
                                }
                              }
                            ],
                            series: [
                              {
                                name: 'Volume',
                                type: 'bar',
                                data: transformedData.map((d: TransformedDataPoint) => d.volume),
                                itemStyle: {
                                  color: '#8884d8',
                                  borderRadius: [4, 4, 0, 0]
                                },
                                barWidth: '60%'
                              },
                              {
                                name: 'Rolling Average',
                                type: 'line',
                                data: transformedData.map((d: TransformedDataPoint) => d.rollingVolume),
                                itemStyle: {
                                  color: '#ff7300'
                                },
                                lineStyle: {
                                  width: 3,
                                  color: '#ff7300'
                                },
                                symbol: 'circle',
                                symbolSize: 6,
                                smooth: true
                              }
                            ]
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  textAlign: 'center',
                  py: 4
                }}
              >
                No volume data available
              </Typography>
            )}
          </Box>
        </TabPanel>
      </Box>

      {/* --------------------- Mesocycle Management Dialogs --------------------- */}

      {/* History Dialog */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Mesocycle History - {selectedMesocycle?.name}</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: 600 }}>
          {mesocycleDetail ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {mesocycleDetail.instances
                .sort((a, b) => a.iterationNumber - b.iterationNumber)
                .map((instance) => (
                  <Card key={instance.id} variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                      Week {instance.iterationNumber}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {instance.days
                        .sort((a, b) => a.planDay.dayNumber - b.planDay.dayNumber)
                        .map((day) => {
                          const isRestDay = day.planDay.isRestDay;
                          const isWorkoutStarted = day.workoutInstance && !day.workoutInstance.completedAt;
                          const isWorkoutComplete = day.workoutInstance?.completedAt;
                          const completed = isRestDay ? day.isComplete : !!isWorkoutComplete;

                          let onClick = undefined;
                          if (isRestDay && !day.isComplete) {
                            onClick = () => handleCompleteRestDay(instance.id, day.id);
                          } else if (!isRestDay && !day.workoutInstance) {
                            onClick = () => handleStartWorkout(instance.id, day.id);
                          } else if (!isRestDay && (isWorkoutStarted || isWorkoutComplete)) {
                            onClick = () => window.location.href = `/track/${day.workoutInstance?.id}`;
                          }

                          const label = `Day ${day.planDay.dayNumber} ${isRestDay ? 'Rest' : 'Workout'}`;
                          
                          return (
                            <Chip
                              key={day.id}
                              label={label}
                              color={completed ? 'success' : 'default'}
                              size="small"
                              clickable={!!onClick}
                              onClick={onClick}
                              sx={{ 
                                cursor: onClick ? 'pointer' : 'default',
                                '&:hover': onClick ? {
                                  backgroundColor: 'action.hover',
                                } : {}
                              }}
                            />
                          );
                        })}
                    </Box>
                  </Card>
                ))}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <GradientButton onClick={() => setHistoryOpen(false)}>Close</GradientButton>
        </DialogActions>
      </Dialog>

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

    </ResponsiveContainer>
  );
}
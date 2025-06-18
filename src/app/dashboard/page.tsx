'use client';


import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { 
  Paper, Typography, Box, Tabs, Tab, Card, CardContent, Grid, Chip, CircularProgress,
  Divider, useTheme, useMediaQuery, Avatar, List, ListItem, ListItemText, Button,
  Collapse, IconButton, Tooltip, Badge, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { useEffect, useState } from 'react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import EChartsReact from 'echarts-for-react';

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

// Next Workout Component
const NextWorkout = ({ 
  currentMesocycle,
  onStartWorkout,
  isStartingWorkout
}: { 
  currentMesocycle: CurrentMesocycle | null;
  onStartWorkout: (iterationId: number, dayId: number) => Promise<void>;
  isStartingWorkout: boolean;
}) => {
  const [nextWorkout, setNextWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNextWorkout = async () => {
      if (!currentMesocycle) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/workout-instances/latest`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch next workout');
        }
        
        const data = await response.json();
        setNextWorkout(data);
      } catch (err) {
        console.error('Error fetching next workout:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNextWorkout();
  }, [currentMesocycle]);

  const handleStartWorkout = async () => {
    if (!nextWorkout) return;

    if (nextWorkout.needsNewIteration) {
      // Create a new iteration first
      try {
        const response = await fetch(`/api/plan-instances`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: currentMesocycle?.plan.id
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create new iteration');
        }

        const newIteration = await response.json();
        // Now start the workout with the new iteration's first day
        const firstDay = newIteration.days[0];
        onStartWorkout(newIteration.id, firstDay.id);
      } catch (err) {
        console.error('Error creating new iteration:', err);
        setError(err instanceof Error ? err.message : 'Failed to create new iteration');
      }
    } else {
      // Start workout with existing iteration
      if (!nextWorkout.iterationId || !nextWorkout.dayId) {
        setError('Missing required workout information. Please try refreshing the page.');
        return;
      }
      onStartWorkout(nextWorkout.iterationId, nextWorkout.dayId);
    }
  };
  
  if (loading) {
    return (
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={28} />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography color="error">
            Error loading next workout: {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  if (!nextWorkout) {
    return (
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography>
            No upcoming workouts found. Please check your mesocycle configuration.
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  const isRestDay = nextWorkout.isRestDay;
  
  return (
    <Card 
      elevation={2} 
      sx={{ 
        mb: 3, 
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ 
        bgcolor: 'background.paper', 
        color: 'text.primary',
        px: 2,
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
          Next Workout
        </Typography>
      </Box>
      
      <CardContent sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ 
    display: 'flex', 
    flexDirection: { xs: 'column', sm: 'row' },
    alignItems: { xs: 'center', sm: 'center' },
    justifyContent: 'space-between',
    gap: { xs: 2, sm: 0 }
  }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
      <Avatar 
        sx={{ 
          bgcolor: isRestDay ? 'info.main' : 'secondary.main',
          mr: 1.5,
          width: 32,
          height: 32
        }}
      >
        {isRestDay ? nextWorkout.dayNumber : <FitnessCenterIcon fontSize="small" />}
      </Avatar>
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
          Day {nextWorkout.dayNumber}: {isRestDay ? 'Rest Day' : nextWorkout.workoutName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Week {nextWorkout.iterationNumber}
        </Typography>
      </Box>
    </Box>
          
              <Box sx={{ width: { xs: '100%', sm: 'auto' }, display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
      {isRestDay ? (
        <Button 
          variant="outlined" 
          color="info"
          size="small"
          startIcon={<CheckIcon />}
          onClick={async () => {
            try {
              const response = await fetch(`/api/plan-instances/${nextWorkout.iterationId}/days/${nextWorkout.dayId}/complete-rest`, {
                method: 'POST',
              });
              
              if (!response.ok) {
                throw new Error('Failed to complete rest day');
              }
              
              window.location.reload();
            } catch (error) {
              console.error('Error completing rest day:', error);
              alert('Failed to complete rest day. Please try again.');
            }
          }}
        >
          Complete Rest Day
        </Button>
      ) : (
        <Button 
          variant="contained"
          size="small"
          startIcon={<PlayArrowIcon />}
          onClick={handleStartWorkout}
          disabled={isStartingWorkout}
        >
          {isStartingWorkout ? 'Starting...' : (nextWorkout.inProgress ? 'Continue Workout' : 'Start Workout')}
        </Button>
      )}
    </Box>
        </Box>
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
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();

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

  const startWorkoutInstance = async (iterationId: number, dayId: number) => {
    try {
      setIsStartingWorkout(true);
      const response = await fetch(
        `/api/plan-instances/${iterationId}/days/${dayId}/start`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start new workout instance');
      }

      const newWorkoutInstance = await response.json();
      router.push(`/track/${newWorkoutInstance.id}`);
    } catch (error) {
      console.error('Error starting workout instance:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to start new workout instance'
      );
    } finally {
      setIsStartingWorkout(false);
    }
  };

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
      <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>

        {/* Next Workout always on top */}
        <NextWorkout 
          currentMesocycle={selectedMesocycle} 
          onStartWorkout={startWorkoutInstance}
          isStartingWorkout={isStartingWorkout}
        />

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="dashboard tabs"
            variant={isMobile ? "fullWidth" : "standard"}
          >
            <Tab label="Mesocycle" {...a11yProps(0)} />
            <Tab label="Volume Data" {...a11yProps(1)} />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          {/* Mesocycle selection dropdown */}
          <FormControl sx={{ mb: 3, minWidth: 220 }} size="small">
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
          
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            {selectedMesocycle ? (
              <>
                <Box sx={{ 
                  mb: 4,
                  p: 3,
                  background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.12) 0%, rgba(25, 118, 210, 0.06) 100%)',
                  border: '1px solid',
                  borderColor: 'rgba(25, 118, 210, 0.2)',
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FitnessCenterIcon sx={{ 
                      mr: 1.5, 
                      color: 'primary.main',
                      fontSize: '1.5rem'
                    }} />
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: 'none'
                      }}
                    >
                      {selectedMesocycle.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarTodayIcon sx={{ 
                      mr: 1, 
                      color: 'text.secondary',
                      fontSize: '1rem'
                    }} />
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'text.secondary',
                        fontWeight: 500,
                        letterSpacing: '0.025em'
                      }}
                    >
                      Based on plan: {selectedMesocycle.plan.name}
                    </Typography>
                  </Box>
                </Box>

                {/* ECharts volume per iteration chart will go here */}
                {selectedMesocycle.iterationVolumes && selectedMesocycle.iterationVolumes.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Total Volume per Week
                    </Typography>
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
                          data: selectedMesocycle.iterationVolumes.map(v => `Week ${v.iterationNumber}`),
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
                            data: selectedMesocycle.iterationVolumes.map((v, index) => {
                              let percentChange = 0;
                              if (index > 0) {
                                const prevVolume = selectedMesocycle.iterationVolumes?.[index - 1]?.totalVolume || 0;
                                percentChange = prevVolume > 0 ? ((v.totalVolume - prevVolume) / prevVolume * 100) : 0;
                              }
                              return {
                                value: v.totalVolume,
                                percentChange: percentChange
                              };
                            }),
                            type: 'bar',
                            itemStyle: { color: '#8884d8', borderRadius: [6, 6, 0, 0] },
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
                  </Box>
                )}

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
                            <Card elevation={2} sx={{ p: 2 }}>
                              <Typography variant="h6" gutterBottom>
                                Total Day Volume
                              </Typography>
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
                                      itemStyle: { color: '#4caf50', borderRadius: [6, 6, 0, 0] },
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
                            </Card>

                            {/* Exercise List with Week-over-Week Progress */}
                            <Card elevation={1} sx={{ mt: 2, p: 2 }}>
                              <Typography variant="h6" gutterBottom>
                                Exercise Progress
                              </Typography>
                              <Box sx={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                      <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>
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
                                            minWidth: '80px'
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
                                          borderRight: '1px solid rgba(255, 255, 255, 0.05)'
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
                                              <td key={iteration.iterationNumber} style={{ 
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
                            </Card>
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
              <Typography variant="h6">No active mesocycle found</Typography>
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
                    <Box key={muscleGroup} sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {muscleGroup}
                      </Typography>
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
                               color: '#000000',
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
                  );
                })}
              </Box>
            ) : (
              <Typography variant="h6">No volume data available</Typography>
            )}
          </Box>
        </TabPanel>
      </Paper>
    </ResponsiveContainer>
  );
}
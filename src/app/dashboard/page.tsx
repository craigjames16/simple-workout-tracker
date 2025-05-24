'use client';

import MuscleGroupBarChart from '@/components/MuscleGroupBarChart';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { 
  Paper, Typography, Box, Tabs, Tab, Card, CardContent, Grid, Chip, CircularProgress,
  Divider, useTheme, useMediaQuery, Avatar, List, ListItem, ListItemText, Button,
  Collapse, IconButton, Tooltip, Badge
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
  const [currentMesocycle, setCurrentMesocycle] = useState<CurrentMesocycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});
  const [expandedIterations, setExpandedIterations] = useState<Record<string, boolean>>({});
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [muscleGroupsRes, currentMesocycleRes] = await Promise.all([
          fetch('/api/dashboard?data=muscleGroups'),
          fetch('/api/dashboard?data=currentMesocycle')
        ]);

        if (!muscleGroupsRes.ok || !currentMesocycleRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [muscleGroupsData, currentMesocycleData] = await Promise.all([
          muscleGroupsRes.json(),
          currentMesocycleRes.json()
        ]);

        if (currentMesocycleData.error) {
          setError(currentMesocycleData.error);
        } else {
          // Process the currentMesocycleData to add volume summary information
          if (currentMesocycleData.planDays) {
            currentMesocycleData.planDays = currentMesocycleData.planDays.map((day: any) => {
              // No need to process rest days
              if (day.isRestDay) return day;
              
              // Process each workout iteration to calculate volume changes
              if (day.iterations && day.iterations.length > 0) {
                day.iterations = day.iterations.map((iteration: WorkoutIteration, index: number) => {
                  // Skip the first iteration (no previous data to compare)
                  if (index === 0 || iteration.iterationNumber === 1) return iteration;
                  
                  // Get the previous iteration to compare with
                  const prevIteration = day.iterations[index - 1];
                  if (!prevIteration || !prevIteration.exercises) return iteration;
                  
                  // Track volume changes across exercises
                  let increased = 0;
                  let decreased = 0;
                  
                  // Compare exercises with previous iteration
                  iteration.exercises.forEach((exercise) => {
                    // Find matching exercise in previous iteration
                    const prevExercise = prevIteration.exercises.find(
                      (prev: Exercise) => prev.id === exercise.id
                    );
                    
                    if (prevExercise) {
                      if (exercise.volume > prevExercise.volume) {
                        increased++;
                      } else if (exercise.volume < prevExercise.volume) {
                        decreased++;
                      }
                    }
                  });
                  
                  return {
                    ...iteration,
                    volumeSummary: {
                      increased,
                      decreased
                    }
                  };
                });
              }
              
              return day;
            });
          }
          setCurrentMesocycle(currentMesocycleData);
        }
        setMuscleGroups(muscleGroupsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="dashboard tabs"
            variant={isMobile ? "fullWidth" : "standard"}
          >
            <Tab label="Current Mesocycle" {...a11yProps(0)} />
            <Tab label="Volume Data" {...a11yProps(1)} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            {currentMesocycle ? (
              <>
                <Box sx={{ 
                  mb: 3, 
                  p: 2, 
                  bgcolor: 'primary.main', 
                  color: 'primary.contrastText',
                  borderRadius: 1
                }}>
                  <Typography variant="h5" gutterBottom>
                    {currentMesocycle.name}
                  </Typography>
                  <Typography variant="body1">
                    Based on plan: {currentMesocycle.plan.name}
                  </Typography>
                </Box>

                <NextWorkout 
                  currentMesocycle={currentMesocycle} 
                  onStartWorkout={startWorkoutInstance}
                  isStartingWorkout={isStartingWorkout}
                />
        
                <Grid container spacing={3}>
                  {[...currentMesocycle.planDays]
                    .sort((a, b) => a.dayNumber - b.dayNumber)
                    .map((day) => (
                      <Grid item xs={12} key={day.dayNumber}>
                        <Card 
                          elevation={2}
                          sx={{ 
                            overflow: 'hidden',
                            mb: 2
                          }}
                        >
                          <Box sx={{ 
                            px: 3, 
                            py: 2, 
                            bgcolor: 'background.default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                          }}
                          onClick={() => toggleDayExpanded(day.dayNumber)}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                sx={{ 
                                  bgcolor: day.isRestDay ? 'info.main' : 'secondary.main',
                                  mr: 2
                                }}
                              >
                                {day.isRestDay ? day.dayNumber : <FitnessCenterIcon />}
                              </Avatar>
                              <Box>
                                <Typography variant="h6">
                                  Day {day.dayNumber}{day.isRestDay ? ': Rest Day':''}
                                </Typography>
                                {day.isRestDay && (
                                  <Chip 
                                    label="Rest Day" 
                                    color="info" 
                                    size="small" 
                                  />
                                )}
                              </Box>
                            </Box>
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDayExpanded(day.dayNumber);
                              }}
                              size="small"
                            >
                              {isDayExpanded(day.dayNumber) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Box>
                          
                          <Collapse in={isDayExpanded(day.dayNumber)}>
                            {!day.isRestDay && (
                              <CardContent sx={{ p: 0 }}>
                                {[
                                  ...day.iterations.filter(iteration => !!iteration.completedAt)
                                ]
                                  .sort((a, b) => a.iterationNumber - b.iterationNumber)
                                  .map((iteration, iterIndex) => (
                                    <Box 
                                      key={iteration.iterationNumber} 
                                      sx={{ 
                                        p: 2,
                                        borderTop: iterIndex > 0 ? 1 : 0,
                                        borderColor: 'divider',
                                        bgcolor: iterIndex % 2 === 1 ? 'action.hover' : 'transparent'
                                      }}
                                    >
                                      <Box 
                                        sx={{ 
                                          display: 'flex', 
                                          alignItems: 'center',
                                          mb: 2,
                                          justifyContent: 'space-between',
                                          cursor: 'pointer'
                                        }}
                                        onClick={() => toggleIterationExpanded(day.dayNumber, iteration.iterationNumber)}
                                      >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <CalendarTodayIcon 
                                            fontSize="small" 
                                            sx={{ mr: 1, color: 'text.secondary' }} 
                                          />
                                          <Typography 
                                            variant="subtitle1" 
                                            sx={{ 
                                              fontWeight: 'medium',
                                              display: 'flex',
                                              alignItems: 'center'
                                            }}
                                          >
                                            Week {iteration.iterationNumber}
                                            {iteration.completedAt && (
                                              <Typography 
                                                component="span" 
                                                color="text.secondary" 
                                                sx={{ ml: 1, fontSize: '0.875rem' }}
                                              >
                                                ({new Date(iteration.completedAt).toLocaleDateString()})
                                              </Typography>
                                            )}
                                          </Typography>
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          {iteration.volumeSummary && iteration.iterationNumber > 1 && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
                                              {iteration.volumeSummary.increased > 0 && (
                                                <Tooltip title={`${iteration.volumeSummary.increased} exercise${iteration.volumeSummary.increased !== 1 ? 's' : ''} with increased volume`}>
                                                  <Badge badgeContent={iteration.volumeSummary.increased} color="success" sx={{ mr: 1 }}>
                                                    <ArrowUpwardIcon color="success" fontSize="small" />
                                                  </Badge>
                                                </Tooltip>
                                              )}
                                              
                                              {iteration.volumeSummary.decreased > 0 && (
                                                <Tooltip title={`${iteration.volumeSummary.decreased} exercise${iteration.volumeSummary.decreased !== 1 ? 's' : ''} with decreased volume`}>
                                                  <Badge badgeContent={iteration.volumeSummary.decreased} color="error">
                                                    <ArrowDownwardIcon color="error" fontSize="small" />
                                                  </Badge>
                                                </Tooltip>
                                              )}
                                            </Box>
                                          )}
                                          
                                          <IconButton
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleIterationExpanded(day.dayNumber, iteration.iterationNumber);
                                            }}
                                            size="small"
                                          >
                                            {isIterationExpanded(day.dayNumber, iteration.iterationNumber) ? 
                                              <ExpandLessIcon /> : <ExpandMoreIcon />}
                                          </IconButton>
                                        </Box>
                                      </Box>

                                      <Collapse in={isIterationExpanded(day.dayNumber, iteration.iterationNumber)}>
                                        <Grid 
                                          container 
                                          spacing={2} 
                                          sx={{ mb: 1 }}
                                        >
                                          {[...iteration.exercises]
                                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                            .map((exercise) => (
                                              <Grid 
                                                item 
                                                xs={12} 
                                                sm={isTablet ? 6 : 4} 
                                                md={4} 
                                                lg={3} 
                                                key={exercise.id}
                                              >
                                                <ExerciseCard exercise={exercise} />
                                              </Grid>
                                            ))}
                                        </Grid>
                                      </Collapse>
                                    </Box>
                                  ))}
                              </CardContent>
                            )}
                          </Collapse>
                        </Card>
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
          <Box sx={{ height: '100%' }}>
            {muscleGroups ? (
              <MuscleGroupBarChart data={muscleGroups} />
            ) : (
              <Typography variant="h6">No volume data available</Typography>
            )}
          </Box>
        </TabPanel>
      </Paper>
    </ResponsiveContainer>
  );
}
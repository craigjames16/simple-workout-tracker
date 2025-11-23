'use client';

import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { 
  Paper, Typography, Box, Tabs, Tab, Card, CardContent, Grid, Chip, CircularProgress,
  Divider, useTheme, useMediaQuery, Avatar, List, ListItem, ListItemText, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, IconButton, Menu, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress
} from '@mui/material';
import { useEffect, useState, useMemo } from 'react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import EChartsReact from 'echarts-for-react';
import { gradients, borders } from '@/lib/theme-constants';

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

type MetricKey = 'volume' | 'count';

const buildRadarOption = (
  data: Record<string, any[]> | null,
  metricKey: MetricKey,
  chartTitle: string
) => {
  if (!data) return null;

  const muscleMetrics: Array<{ name: string; value: number }> = [];
  const legendLabel = metricKey === 'volume' ? 'Volume Data' : 'Set Data';

  const calculateMetricValue = (instances: any[]) => {
    const extractMetric = (instance: any) => {
      const entry = Object.values(instance)[0] as Record<string, number>;
      return entry?.[metricKey] ?? 0;
    };

    if (metricKey === 'count') {
      return instances.reduce(
        (acc: number, instance: any) => acc + extractMetric(instance),
        0
      );
    }

    return extractMetric(instances[instances.length - 1]);
  };

  Object.entries(data).forEach(([muscleGroup, instances]) => {
    if (!Array.isArray(instances) || !instances.length) {
      return;
    }

    muscleMetrics.push({
      name: muscleGroup,
      value: calculateMetricValue(instances)
    });
  });

  if (!muscleMetrics.length) return null;

  const globalMax = Math.max(
    ...muscleMetrics.map((metric) => metric.value),
    1
  );
  const indicatorMax = Math.ceil(globalMax * 1.2);
  const indicators = muscleMetrics.map(({ name }) => ({
    name,
    max: indicatorMax
  }));
  const latestValues = muscleMetrics.map(({ value }) =>
    Number(value.toFixed(2))
  );

  return {
    title: {
      text: chartTitle,
      left: 'center',
      top: 4,
      textStyle: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      data: [legendLabel],
      top: 32,
      textStyle: {
        color: 'rgba(255,255,255,0.85)'
      }
    },
    radar: {
      indicator: indicators,
      radius: '60%',
      center: ['50%', '60%'],
      splitNumber: 5,
      axisName: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255,255,255,0.2)'
        }
      },
      splitArea: {
        show: false
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(255,255,255,0.2)'
        }
      }
    },
    series: [
      {
        name: chartTitle,
        type: 'radar',
        data: [
          {
            value: latestValues,
            name: legendLabel
          }
        ],
        areaStyle: {
          opacity: 0.1
        },
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: {
          width: 2
        }
      }
    ]
  };
};



export default function DashboardPage() {
  const [tabValue, setTabValue] = useState(0);
  const [volumeData, setVolumeData] = useState<Record<string, any[]> | null>(null);
  const [setData, setSetData] = useState<Record<string, any[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const radarVolumeOption = useMemo(
    () => buildRadarOption(volumeData, 'volume', 'Muscle Group Volume'),
    [volumeData]
  );
  const radarSetOption = useMemo(
    () => buildRadarOption(setData, 'count', 'Muscle Group Sets'),
    [setData]
  );

  // Fetch muscle group metrics for volume and set counts
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [volumeRes, setRes] = await Promise.all([
          fetch('/api/dashboard?data=muscleGroupVolume'),
          fetch('/api/dashboard?data=muscleGroupSets')
        ]);

        if (!volumeRes.ok) throw new Error('Failed to fetch muscle group volume data');
        if (!setRes.ok) throw new Error('Failed to fetch muscle group set data');

        const [volumeJson, setJson] = await Promise.all([volumeRes.json(), setRes.json()]);
        setVolumeData(volumeJson);
        setSetData(setJson);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <ResponsiveContainer maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
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
    <ResponsiveContainer maxWidth="md">
      <Box sx={{
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        px: { xs: 2, sm: 3 },
        pt: { xs: 6, sm: 6, md: 6 },
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
                        background: gradients.glass,
                        color: 'white',
                        fontWeight: 600,
                        border: borders.default,
                        boxShadow: '0 4px 12px -4px rgba(0, 0, 0, 0.1)'
                      }
              },
              '& .MuiTabs-indicator': {
                display: 'none'
              }
            }}
          >
            <Tab label="Volume Data" {...a11yProps(0)} />
            <Tab label="Set Data" {...a11yProps(1)} />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            {volumeData ? (
              <Box>
                {radarVolumeOption && (
                  <Box
                    sx={{
                      mb: 4,
                      borderRadius: 2,
                      overflow: 'hidden',
                      background: gradients.surface,
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}
                  >
                    <Box sx={{ p: { xs: 2, sm: 3 } }}>
                      <EChartsReact style={{ width: '100%', height: 360 }} option={radarVolumeOption} />
                    </Box>
                  </Box>
                )}
                {Object.entries(volumeData as Record<string, any[]>).map(([muscleGroup, instances]: [string, any[]]) => {
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
                      background: gradients.surface,
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
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            {setData ? (
              <Box>
                {radarSetOption && (
                  <Box
                    sx={{
                      mb: 4,
                      borderRadius: 2,
                      overflow: 'hidden',
                      background: gradients.surface,
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}
                  >
                    <Box sx={{ p: { xs: 2, sm: 3 } }}>
                      <EChartsReact style={{ width: '100%', height: 360 }} option={radarSetOption} />
                    </Box>
                  </Box>
                )}
                {Object.entries(setData as Record<string, any[]>).map(([muscleGroup, instances]: [string, any[]]) => {
                  interface SetTransformedDataPoint {
                    instanceId: string;
                    rollingCount: number;
                    count: number;
                    date: string;
                    shortDate: string;
                  }

                  const transformedData: SetTransformedDataPoint[] = instances.map((instance: any, index: number) => {
                    const [instanceId, data] = Object.entries(instance)[0] as [string, { count: number; date: string }];
                    let rollingCount = data.count;

                    if (index >= 3) {
                      const startIdx = Math.max(0, index - 3);
                      const relevantInstances = instances.slice(startIdx, index + 1);
                      rollingCount = relevantInstances
                        .map((inst: any) => (Object.values(inst)[0] as { count: number }).count)
                        .reduce((acc: number, curr: number) => acc + curr, 0);
                    }

                    return {
                      instanceId,
                      rollingCount: rollingCount / 3,
                      count: data.count,
                      date: new Date(data.date).toLocaleDateString(),
                      shortDate: new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    };
                  });

                  return (
                    <Box key={muscleGroup} sx={{ 
                      mb: 4,
                      borderRadius: 2,
                      overflow: 'hidden',
                      background: gradients.surface,
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
                              data: ['Sets', 'Rolling Average'],
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
                                data: transformedData.map((d: SetTransformedDataPoint) => d.shortDate),
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
                                name: 'Sets',
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
                                name: 'Sets',
                                type: 'bar',
                                data: transformedData.map((d: SetTransformedDataPoint) => d.count),
                                itemStyle: {
                                  color: '#8884d8',
                                  borderRadius: [4, 4, 0, 0]
                                },
                                barWidth: '60%'
                              },
                              {
                                name: 'Rolling Average',
                                type: 'line',
                                data: transformedData.map((d: SetTransformedDataPoint) => d.rollingCount),
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
                No set data available
              </Typography>
            )}
          </Box>
        </TabPanel>
      </Box>
    </ResponsiveContainer>
  );
}
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { Card, CardContent, useTheme as useMuiTheme, Box, Typography, CircularProgress, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useThemeStyles } from '@/hooks/useThemeStyles';

interface WorkoutHeatmapProps {
  mesocycleId?: number | null;
}

export default function WorkoutHeatmap({ mesocycleId = null }: WorkoutHeatmapProps = {}) {
  const muiTheme = useMuiTheme();
  const { themeColors, gradients } = useThemeStyles();
  const [option, setOption] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMesocycleId, setCurrentMesocycleId] = useState<number | null>(mesocycleId);
  const [schedule, setSchedule] = useState<any>(null);

  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();
  const monthRange = useMemo(() => {
    const year = selectedYear.toString();
    const month = (selectedMonth + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }, [selectedYear, selectedMonth]);

  const monthYearLabel = useMemo(() => {
    return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedDate]);

  const handlePreviousMonth = () => {
    setSelectedDate(new Date(selectedYear, selectedMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedYear, selectedMonth + 1, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Fetch current mesocycle if not provided
  useEffect(() => {
    const fetchCurrentMesocycle = async () => {
      if (currentMesocycleId) return;
      
      try {
        const res = await fetch('/api/mesocycles');
        if (!res.ok) return;
        const data = await res.json();
        const inProgress = data.find((m: any) => m.status === 'IN_PROGRESS');
        const selectedMesocycle = inProgress || (data.length > 0 ? data[0] : null);
        if (selectedMesocycle) {
          setCurrentMesocycleId(selectedMesocycle.id);
        }
      } catch (err) {
        console.error('Error fetching mesocycles:', err);
      }
    };
    
    fetchCurrentMesocycle();
  }, [currentMesocycleId]);

  // Fetch schedule data for upcoming days
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!currentMesocycleId) return;
      
      try {
        const response = await fetch(`/api/mesocycles/${currentMesocycleId}/schedule`);
        if (!response.ok) return;
        const data = await response.json();
        setSchedule(data);
      } catch (err) {
        console.error('Error fetching schedule:', err);
      }
    };
    
    fetchSchedule();
  }, [currentMesocycleId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/workout-instances');
        const instances = await res.json();

        // Process data
        const volumeByDate: Record<string, number> = {};
        let maxVolume = 0;

        instances.forEach((instance: any) => {
          if (instance.completedAt) {
            const date = new Date(instance.completedAt);
            // Filter by selected month
            if (date.getFullYear() === selectedYear && date.getMonth() === selectedMonth) {
              const dateStr = date.toISOString().split('T')[0];
              const volume = instance.exerciseSets.reduce((acc: number, set: any) => acc + (set.weight * set.reps), 0);
              
              volumeByDate[dateStr] = (volumeByDate[dateStr] || 0) + volume;
            }
          }
        });

        const data = Object.entries(volumeByDate).map(([date, volume]) => {
          maxVolume = Math.max(maxVolume, volume);
          return [date, volume];
        });

        // Process upcoming days for the selected month
        const upcomingDaysData: Array<[string, number]> = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (schedule && schedule.upcomingDays) {
          // Helper to check if two dates are the same day
          const isSameDay = (date1: Date, date2: Date | string) => {
            const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
            return date1.getFullYear() === d2.getFullYear() &&
                   date1.getMonth() === d2.getMonth() &&
                   date1.getDate() === d2.getDate();
          };
          
          // Filter to only workout days (not rest days)
          const upcomingWorkoutDays = schedule.upcomingDays.filter((day: any) => !day.planDay.isRestDay);
          
          // Map upcoming workout days to future dates in the selected month
          const monthStart = new Date(selectedYear, selectedMonth, 1);
          const monthEnd = new Date(selectedYear, selectedMonth + 1, 0);
          
          // Start from today or month start, whichever is later
          const startDate = today > monthStart ? new Date(today) : new Date(monthStart);
          
          let upcomingDayIndex = 0;
          for (let d = new Date(startDate); d <= monthEnd && upcomingDayIndex < upcomingWorkoutDays.length; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            // Skip if already has completed workout data
            if (!volumeByDate[dateStr]) {
              if (upcomingDayIndex < upcomingWorkoutDays.length) {
                // Use a small value to show as a marker (not actual volume)
                upcomingDaysData.push([dateStr, 10]);
                upcomingDayIndex++;
              }
            }
          }
        }

        setHasData(data.length > 0 || upcomingDaysData.length > 0);

        const chartOption = {
          backgroundColor: 'transparent',
          tooltip: {
            position: 'top',
            formatter: function (p: any) {
              const format = echarts.time.format(p.data[0], '{yyyy}-{MM}-{dd}', false);
              return `${format}<br/>Volume: ${p.data[1].toLocaleString()}`;
            },
            backgroundColor: 'rgba(0,0,0,1)',
            borderColor: 'rgba(255,255,255,0.1)',
            textStyle: {
              color: '#fff'
            }
          },
          calendar: [
            {
              orient: 'vertical',
              yearLabel: { show: false },
              monthLabel: {
                show: true,
                textStyle: {
                  color: themeColors.text.primary
                },
                margin: 10,
                nameMap: 'en', // Shows 'Jan', 'Feb', etc.
                position: 'start',
                fontSize: 14
              },
              dayLabel: {
                firstDay: 0, // Start on Sunday
                nameMap: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
                textStyle: {
                  color: themeColors.text.secondary
                },
                margin: 10,
                fontSize: 12
              },
              cellSize: 45, // Larger cells
              left: 'center', // Center horizontally
              top: 40,
              range: monthRange, // Show selected month
              itemStyle: {
                borderWidth: 1,
                borderColor: themeColors.text.muted,
                color: 'transparent' // Keep transparent to show card gradient background
              },
              splitLine: {
                show: false
              }
            }
          ],
          series: [
            {
              type: 'effectScatter',
              coordinateSystem: 'calendar',
              data: data,
              symbolSize: function (val: any) {
                if (maxVolume === 0) return 0;
                // Scale based on max volume, but keep a minimum size for visibility
                // Min size 6, max size 30 (to fit in 45px cell)
                return 6 + (val[1] / maxVolume) * 24;
              },
              itemStyle: {
                color: themeColors.primary.main,
                shadowBlur: 15,
                shadowColor: themeColors.primary.light,
                opacity: 0.9
              },
              showEffectOn: 'render',
              rippleEffect: {
                brushType: 'stroke',
                scale: 2.5,
                color: themeColors.primary.light
              },
            },
            {
              type: 'scatter',
              coordinateSystem: 'calendar',
              data: data,
              symbolSize: function (val: any) {
                if (maxVolume === 0) return 0;
                return 4 + (val[1] / maxVolume) * 16; 
              },
              itemStyle: {
                color: themeColors.primary.main,
                opacity: 0.8
              }
            },
            // Upcoming days series - shown as outlined circles
            {
              type: 'scatter',
              coordinateSystem: 'calendar',
              data: upcomingDaysData,
              symbolSize: 12,
              itemStyle: {
                color: 'transparent',
                borderColor: '#FFA726', // Orange/yellow for upcoming
                borderWidth: 2,
                opacity: 0.7
              },
              symbol: 'circle'
            }
          ]
        };
        setOption(chartOption);
      } catch (error) {
        console.error('Error fetching workout data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedMonth, schedule, themeColors.primary.main, themeColors.primary.light, themeColors.text.primary, themeColors.text.secondary, themeColors.text.muted]);

  if (loading) {
    return (
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 2,
          overflow: 'hidden',
          background: gradients.surface,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress sx={{ color: themeColors.primary.main }} />
      </Card>
    );
  }

  if (!option) return null;

  return (
    <Card
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: 2,
        overflow: 'hidden',
        background: gradients.surface,
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <IconButton 
            onClick={handlePreviousMonth}
            sx={{ color: themeColors.text.primary }}
            size="small"
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            sx={{ 
              color: themeColors.text.primary, 
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8
              }
            }}
            onClick={handleToday}
          >
            {monthYearLabel}
          </Typography>
          <IconButton 
            onClick={handleNextMonth}
            sx={{ color: themeColors.text.primary }}
            size="small"
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
        <Box sx={{ height: '400px', width: '100%' }}>
            {hasData ? (
              <ReactECharts 
                  option={option} 
                  style={{ height: '100%', width: '100%' }} 
                  theme="light"
              />
            ) : (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeColors.text.muted }}>
                <Typography>No workouts found for {monthYearLabel}</Typography>
              </Box>
            )}
        </Box>
      </CardContent>
    </Card>
  );
}

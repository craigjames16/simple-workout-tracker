'use client';

import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { Card, CardContent, useTheme as useMuiTheme, Box, Typography, CircularProgress } from '@mui/material';
import { useThemeStyles } from '@/hooks/useThemeStyles';

export default function WorkoutHeatmap() {
  const muiTheme = useMuiTheme();
  const { themeColors, gradients } = useThemeStyles();
  const [option, setOption] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/workout-instances');
        const instances = await res.json();

        const today = new Date();
        const currentYear = today.getFullYear().toString();
        const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
        const currentRange = `${currentYear}-${currentMonth}`;
        
        // Process data
        const volumeByDate: Record<string, number> = {};
        let maxVolume = 0;

        instances.forEach((instance: any) => {
          if (instance.completedAt) {
            const date = new Date(instance.completedAt).toISOString().split('T')[0];
            const volume = instance.exerciseSets.reduce((acc: number, set: any) => acc + (set.weight * set.reps), 0);
            
            volumeByDate[date] = (volumeByDate[date] || 0) + volume;
          }
        });

        const data = Object.entries(volumeByDate).map(([date, volume]) => {
          maxVolume = Math.max(maxVolume, volume);
          return [date, volume];
        });

        setHasData(data.length > 0);

        const chartOption = {
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
              range: currentRange, // Show current month
              itemStyle: {
                borderWidth: 1,
                borderColor: themeColors.text.muted,
                color: 'transparent'
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
  }, [themeColors.primary.main, themeColors.primary.light, themeColors.text.primary, themeColors.text.secondary, themeColors.text.muted]);

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
        <Typography variant="h6" sx={{ mb: 2, color: themeColors.text.primary, textAlign: 'center' }}>
            Workout Consistency
        </Typography>
        <Box sx={{ height: '400px', width: '100%' }}>
            {hasData ? (
              <ReactECharts 
                  option={option} 
                  style={{ height: '100%', width: '100%' }} 
                  theme="light"
              />
            ) : (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeColors.text.muted }}>
                <Typography>No workouts found for this month</Typography>
              </Box>
            )}
        </Box>
      </CardContent>
    </Card>
  );
}

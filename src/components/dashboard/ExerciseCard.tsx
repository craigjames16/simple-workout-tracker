'use client';

import { Box, Typography, Card, CardContent, Avatar, Chip, Divider } from '@mui/material';
import EChartsReact from 'echarts-for-react';
import { gradients } from '@/lib/theme-constants';

interface ExercisePRs {
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
}

interface ExerciseVolumePoint {
  workoutInstanceId: number;
  date: string;
  volume: number;
  sets: number;
}

interface ExerciseStat {
  id: number;
  name: string;
  category: string;
  totalSets: number;
  totalVolume: number;
  prs: ExercisePRs;
  lastPerformed: string | null;
  volumeProgression: ExerciseVolumePoint[];
}

interface ExerciseCardProps {
  exercise: ExerciseStat;
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  interface ExerciseTransformedDataPoint {
    instanceId: number;
    rollingVolume: number;
    volume: number;
    date: string;
    shortDate: string;
  }

  const transformedData: ExerciseTransformedDataPoint[] = exercise.volumeProgression.map((point, index) => {
    let rollingVolume = point.volume;
    
    if (index >= 3) {
      const startIdx = Math.max(0, index - 3);
      const relevantPoints = exercise.volumeProgression.slice(startIdx, index + 1);
      rollingVolume = relevantPoints
        .map(p => p.volume)
        .reduce((acc, curr) => acc + curr, 0) / 3;
    }
    
    return {
      instanceId: point.workoutInstanceId,
      rollingVolume,
      volume: point.volume,
      date: point.date,
      shortDate: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        height: '100%',
        background: gradients.surface,
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: 'primary.main', 
              width: 40, 
              height: 40, 
              mr: 1.5,
              fontSize: '1rem'
            }}
          >
            {exercise.name.substring(0, 2).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
              {exercise.name}
            </Typography>
            <Chip 
              label={exercise.category} 
              size="small" 
              sx={{ 
                mt: 0.5,
                height: 20,
                fontSize: '0.7rem',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.9)'
              }} 
            />
          </Box>
        </Box>
        
        <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        
        {/* PRs Section */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
            Personal Records
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Max Weight
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="white">
                {exercise.prs.maxWeight} kg
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Max Reps
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="white">
                {exercise.prs.maxReps}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Max Volume
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="white">
                {Math.round(exercise.prs.maxVolume).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        
        {/* Stats Section */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total Sets
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="white">
              {exercise.totalSets}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total Volume
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="white">
              {Math.round(exercise.totalVolume).toLocaleString()}
            </Typography>
          </Box>
          {exercise.lastPerformed && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Last Performed
              </Typography>
              <Typography variant="body2" color="white">
                {new Date(exercise.lastPerformed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* Volume Progression Chart */}
        {exercise.volumeProgression.length > 0 && (
          <>
            <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                Volume Progression
              </Typography>
              <Box sx={{ height: 200, mt: 1 }}>
                <EChartsReact
                  style={{ width: '100%', height: '100%' }}
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
                    grid: {
                      left: 40,
                      right: 20,
                      bottom: 40,
                      top: 20
                    },
                    xAxis: [
                      {
                        type: 'category',
                        data: transformedData.map(d => d.shortDate),
                        axisLabel: {
                          fontSize: 10,
                          rotate: transformedData.length > 6 ? 45 : 0,
                          color: 'rgba(255, 255, 255, 0.7)'
                        },
                        axisLine: {
                          lineStyle: {
                            color: 'rgba(255, 255, 255, 0.2)'
                          }
                        }
                      }
                    ],
                    yAxis: [
                      {
                        type: 'value',
                        axisLabel: {
                          fontSize: 10,
                          color: 'rgba(255, 255, 255, 0.7)'
                        },
                        splitLine: {
                          show: false
                        },
                        axisLine: {
                          lineStyle: {
                            color: 'rgba(255, 255, 255, 0.2)'
                          }
                        }
                      }
                    ],
                    series: [
                      {
                        name: 'Volume',
                        type: 'bar',
                        data: transformedData.map(d => d.volume),
                        itemStyle: {
                          color: '#8884d8',
                          borderRadius: [4, 4, 0, 0]
                        },
                        barWidth: '60%'
                      },
                      {
                        name: 'Rolling Average',
                        type: 'line',
                        data: transformedData.map(d => d.rollingVolume),
                        itemStyle: {
                          color: '#ff7300'
                        },
                        lineStyle: {
                          width: 2,
                          color: '#ff7300'
                        },
                        symbol: 'circle',
                        symbolSize: 4,
                        smooth: true
                      }
                    ]
                  }}
                />
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}


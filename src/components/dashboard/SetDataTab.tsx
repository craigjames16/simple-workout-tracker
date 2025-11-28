'use client';

import { Box, Typography } from '@mui/material';
import EChartsReact from 'echarts-for-react';
import { gradients } from '@/lib/theme-constants';
import { VolumeSetRadarChart } from './VolumeSetRadarChart';

interface SetDataTabProps {
  setData: Record<string, any[]> | null;
}

export function SetDataTab({ setData }: SetDataTabProps) {
  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {setData ? (
        <Box>
          <VolumeSetRadarChart title="Volume & Sets by Muscle Group" />
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
  );
}


'use client';

import { Box, Typography } from '@mui/material';
import EChartsReact from 'echarts-for-react';
import { gradients } from '@/lib/theme-constants';
import { VolumeSetRadarChart } from './VolumeSetRadarChart';

interface VolumeDataTabProps {
  volumeData: Record<string, any[]> | null;
}

export function VolumeDataTab({ volumeData }: VolumeDataTabProps) {
  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {volumeData ? (
        <Box>
          <VolumeSetRadarChart title="Volume & Sets by Muscle Group" />
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
  );
}


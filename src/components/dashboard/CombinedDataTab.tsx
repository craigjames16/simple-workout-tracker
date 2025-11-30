'use client';

import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, SxProps, Theme, ToggleButton, ToggleButtonGroup } from '@mui/material';
import EChartsReact from 'echarts-for-react';
import { gradients, themeColors } from '@/lib/theme-constants';
import { VolumeSetRadarChart } from './VolumeSetRadarChart';
import { MesocycleSelect } from './MesocycleSelect';

interface CombinedDataTabProps {
  preSelectedMesocycleId?: number | null | 'all';
  hideFilter?: boolean;
  hideBarCharts?: boolean;
  hideToggle?: boolean;
  sx?: SxProps<Theme>;
}

interface DataPoint {
  instanceId: string;
  date: string;
  shortDate: string;
  volume: number;
  sets: number;
  rollingVolume: number;
  rollingSets: number;
}

export function CombinedDataTab({ preSelectedMesocycleId, hideFilter = false, hideBarCharts = false, hideToggle = false, sx }: CombinedDataTabProps) {
  const [selectedMesocycleId, setSelectedMesocycleId] = useState<number | 'all'>('all');
  const [volumeData, setVolumeData] = useState<Record<string, any[]> | null>(null);
  const [setData, setSetData] = useState<Record<string, any[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'volume' | 'sets'>('volume');

  // Update state when prop changes
  useEffect(() => {
    if (preSelectedMesocycleId !== undefined && preSelectedMesocycleId !== null) {
        setSelectedMesocycleId(preSelectedMesocycleId);
    }
  }, [preSelectedMesocycleId]);

  // Fetch data when selection changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let volumeParams: URLSearchParams;
        let setParams: URLSearchParams;

        if (selectedMesocycleId === 'all') {
          volumeParams = new URLSearchParams({ data: 'muscleGroupVolume' });
          setParams = new URLSearchParams({ data: 'muscleGroupSets' });
        } else {
          volumeParams = new URLSearchParams({ data: 'mesocycleMuscleGroupVolume', mesocycleId: selectedMesocycleId.toString() });
          setParams = new URLSearchParams({ data: 'mesocycleMuscleGroupSets', mesocycleId: selectedMesocycleId.toString() });
        }

        const [volumeRes, setRes] = await Promise.all([
          fetch(`/api/dashboard?${volumeParams.toString()}`),
          fetch(`/api/dashboard?${setParams.toString()}`)
        ]);

        if (volumeRes.ok) setVolumeData(await volumeRes.json());
        if (setRes.ok) setSetData(await setRes.json());

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMesocycleId]);

  const handleMesocycleChange = (value: number | 'all') => {
    setSelectedMesocycleId(value);
  };

  const handleDisplayModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'volume' | 'sets' | null) => {
    if (newMode !== null) {
      setDisplayMode(newMode);
    }
  };

  const muscleGroups = useMemo(() => {
    const groups = new Set<string>();
    if (volumeData) Object.keys(volumeData).forEach(g => groups.add(g));
    if (setData) Object.keys(setData).forEach(g => groups.add(g));
    return Array.from(groups).sort();
  }, [volumeData, setData]);

  return (
    <Box sx={{ 
      height: hideFilter ? 'auto' : '100%', 
      overflow: hideFilter ? 'visible' : 'auto',
      ...sx 
    }}>
      {!hideFilter && (
        <MesocycleSelect
          value={selectedMesocycleId}
          onChange={handleMesocycleChange}
          label="Filter by Mesocycle"
          showAllTime={true}
        />
      )}

      <VolumeSetRadarChart 
        volumeData={volumeData} 
        setData={setData} 
        loading={loading}
        error={error}
        title={selectedMesocycleId === 'all' ? "All Time Volume & Sets" : "Mesocycle Volume & Sets"} 
      />

      {!hideToggle && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <ToggleButtonGroup
            value={displayMode}
            exclusive
            onChange={handleDisplayModeChange}
            aria-label="display mode"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.05)', 
              backdropFilter: 'blur(10px)',
              '& .MuiToggleButton-root': {
                color: 'rgba(255,255,255,0.7)',
                borderColor: 'rgba(255,255,255,0.1)',
                '&.Mui-selected': {
                  color: themeColors.primary.main,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                     bgcolor: 'rgba(255,255,255,0.15)',
                  }
                },
                '&:hover': {
                   bgcolor: 'rgba(255,255,255,0.05)',
                }
              }
            }}
          >
            <ToggleButton value="volume">
              Volume
            </ToggleButton>
            <ToggleButton value="sets">
              Sets
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {!hideBarCharts && muscleGroups.map(muscleGroup => (
         <CombinedBarChart 
            key={muscleGroup} 
            muscleGroup={muscleGroup} 
            volumeInstances={volumeData?.[muscleGroup] || []} 
            setInstances={setData?.[muscleGroup] || []}
            mode={displayMode}
         />
      ))}
      
      {muscleGroups.length === 0 && !loading && (
        <Typography sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', mt: 4 }}>
            No data available for the selected period.
        </Typography>
      )}
    </Box>
  );
}

interface CombinedBarChartProps {
    muscleGroup: string;
    volumeInstances: any[];
    setInstances: any[];
    mode: 'volume' | 'sets';
}

function CombinedBarChart({ muscleGroup, volumeInstances, setInstances, mode }: CombinedBarChartProps) {
    const chartData = useMemo(() => {
        const dataMap = new Map<string, { date: string; volume: number; sets: number }>();

        // Process Volume
        volumeInstances.forEach(inst => {
            const [id, data] = Object.entries(inst)[0] as [string, { volume: number; date: string }];
            if (!dataMap.has(id)) {
                dataMap.set(id, { date: data.date, volume: 0, sets: 0 });
            }
            dataMap.get(id)!.volume = data.volume;
        });

        // Process Sets
        setInstances.forEach(inst => {
            const [id, data] = Object.entries(inst)[0] as [string, { count: number; date: string }];
            if (!dataMap.has(id)) {
                dataMap.set(id, { date: data.date, volume: 0, sets: 0 });
            }
            dataMap.get(id)!.sets = data.count;
        });

        // Sort by date
        const sortedData = Array.from(dataMap.entries())
            .map(([id, data]) => ({ instanceId: id, ...data }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate rolling averages
        return sortedData.map((item, index) => {
             // Rolling Volume (last 3)
             const startIdx = Math.max(0, index - 3);
             const relevantWindow = sortedData.slice(startIdx, index + 1);
             
             const rollingVolume = relevantWindow.reduce((sum, curr) => sum + curr.volume, 0) / relevantWindow.length;
             const rollingSets = relevantWindow.reduce((sum, curr) => sum + curr.sets, 0) / relevantWindow.length;
 
             return {
                 ...item,
                 shortDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                 rollingVolume,
                 rollingSets
             };
         });
    }, [volumeInstances, setInstances]);

    if (chartData.length === 0) return null;

    const isVolume = mode === 'volume';
    const barData = chartData.map(d => isVolume ? d.volume : d.sets);
    const lineData = chartData.map(d => isVolume ? d.rollingVolume : d.rollingSets);
    const color = isVolume ? themeColors.primary.main : themeColors.accent.warning;
    const unit = isVolume ? 'kg' : '';

    return (
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
                    {muscleGroup}
                </Typography>
            </Box>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <EChartsReact
                    style={{ width: '100%', height: 400 }}
                    option={{
                      title: {
                        text: ''
                      },
                      tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                          type: 'cross',
                          label: {
                            backgroundColor: '#6a7985'
                          }
                        }
                      },
                      legend: {
                        data: ['Daily', 'Rolling Avg'],
                        textStyle: {
                          color: themeColors.text.primary
                        }
                      },
                      grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '3%',
                        containLabel: true
                      },
                      xAxis: [
                        {
                          type: 'category',
                          boundaryGap: true,
                          data: chartData.map(d => d.shortDate),
                          axisLabel: {
                            color: themeColors.text.primary
                          },
                          splitLine: {
                            show: false
                          }
                        }
                      ],
                      yAxis: [
                        {
                          type: 'value',
                          name: isVolume ? 'Volume (kg)' : 'Sets',
                          axisLabel: {
                            color: themeColors.text.primary,
                            formatter: `{value} ${unit}`
                          },
                          splitLine: {
                            show: false
                          }
                        }
                      ],
                      series: [
                        {
                          name: 'Daily',
                          type: 'bar',
                          data: barData,
                          itemStyle: {
                            color: color,
                            opacity: 0.6
                          }
                        },
                        {
                          name: 'Rolling Avg',
                          type: 'line',
                          smooth: true,
                          data: lineData,
                          itemStyle: {
                            color: color
                          },
                          lineStyle: {
                            width: 3
                          }
                        }
                      ]
                    }}
                />
            </Box>
        </Box>
    );
}

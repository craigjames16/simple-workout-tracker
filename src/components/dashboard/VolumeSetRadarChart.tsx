'use client';

import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import EChartsReact from 'echarts-for-react';
import { gradients } from '@/lib/theme-constants';
import { buildCombinedRadarOption } from './radarUtils';

interface VolumeSetRadarChartProps {
  mesocycleId?: number | null;
  title?: string;
  volumeData?: Record<string, any[]> | null;
  setData?: Record<string, any[]> | null;
  loading?: boolean;
  error?: string | null;
}

export function VolumeSetRadarChart({ 
  mesocycleId, 
  title = 'Volume & Sets by Muscle Group',
  volumeData: propVolumeData,
  setData: propSetData,
  loading: propLoading,
  error: propError
}: VolumeSetRadarChartProps) {
  const [fetchedVolumeData, setFetchedVolumeData] = useState<Record<string, any[]> | null>(null);
  const [fetchedSetData, setFetchedSetData] = useState<Record<string, any[]> | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const isControlled = propVolumeData !== undefined || propSetData !== undefined;
  
  const volumeData = isControlled ? propVolumeData : fetchedVolumeData;
  const setData = isControlled ? propSetData : fetchedSetData;
  const loading = isControlled ? (propLoading ?? false) : internalLoading;
  const error = isControlled ? propError : internalError;

  const radarOption = useMemo(
    () => buildCombinedRadarOption(volumeData ?? null, setData ?? null, title),
    [volumeData, setData, title]
  );

  useEffect(() => {
    if (isControlled) return;

    const fetchData = async () => {
      setInternalLoading(true);
      setInternalError(null);
      
      try {
        // Build query params - include mesocycleId only if provided
        const volumeParams = new URLSearchParams({
          data: 'mesocycleMuscleGroupVolume'
        });
        const setParams = new URLSearchParams({
          data: 'mesocycleMuscleGroupSets'
        });
        
        if (mesocycleId !== null && mesocycleId !== undefined) {
          volumeParams.append('mesocycleId', mesocycleId.toString());
          setParams.append('mesocycleId', mesocycleId.toString());
        }

        const [volumeRes, setRes] = await Promise.all([
          fetch(`/api/dashboard?${volumeParams.toString()}`),
          fetch(`/api/dashboard?${setParams.toString()}`)
        ]);

        // Handle volume data
        if (volumeRes.ok) {
          const volumeDataJson = await volumeRes.json();
          if (volumeDataJson && Object.keys(volumeDataJson).length > 0) {
            const hasData = Object.values(volumeDataJson).some(
              (instances: any) => Array.isArray(instances) && instances.length > 0
            );
            if (hasData) {
              setFetchedVolumeData(volumeDataJson);
            } else {
              setFetchedVolumeData(null);
            }
          } else {
            setFetchedVolumeData(null);
          }
        } else {
          setFetchedVolumeData(null);
        }

        // Handle set data
        if (setRes.ok) {
          const setDataJson = await setRes.json();
          if (setDataJson && Object.keys(setDataJson).length > 0) {
            const hasData = Object.values(setDataJson).some(
              (instances: any) => Array.isArray(instances) && instances.length > 0
            );
            if (hasData) {
              setFetchedSetData(setDataJson);
            } else {
              setFetchedSetData(null);
            }
          } else {
            setFetchedSetData(null);
          }
        } else {
          setFetchedSetData(null);
        }
      } catch (err) {
        setInternalError(err instanceof Error ? err.message : 'Failed to fetch data');
        setFetchedVolumeData(null);
        setFetchedSetData(null);
      } finally {
        setInternalLoading(false);
      }
    };

    fetchData();
  }, [mesocycleId, isControlled]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: 360,
        borderRadius: 2,
        background: gradients.surface,
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: 360,
        borderRadius: 2,
        background: gradients.surface,
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        p: 3
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center'
          }}
        >
          {error}
        </Typography>
      </Box>
    );
  }

  if (!radarOption) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: 360,
        borderRadius: 2,
        background: gradients.surface,
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        p: 3
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center'
          }}
        >
          No data available
        </Typography>
      </Box>
    );
  }

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
        <EChartsReact style={{ width: '100%', height: 360 }} option={radarOption} />
      </Box>
    </Box>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, SxProps, Theme } from '@mui/material';
import { themeColors } from '@/lib/theme-constants';

interface Mesocycle {
  id: number;
  name: string;
  plan?: {
    id: number;
    name: string;
  };
}

interface MesocycleSelectProps {
  value: number | 'all' | null;
  onChange: (value: number | 'all') => void;
  label?: string;
  showAllTime?: boolean;
  showPlanName?: boolean;
  sx?: SxProps<Theme>;
}

export function MesocycleSelect({
  value,
  onChange,
  label = 'Select Mesocycle',
  showAllTime = false,
  showPlanName = false,
  sx,
}: MesocycleSelectProps) {
  const [mesocycles, setMesocycles] = useState<Mesocycle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMesocycles = async () => {
      try {
        const res = await fetch('/api/mesocycles');
        if (res.ok) {
          const data = await res.json();
          setMesocycles(data);
        }
      } catch (error) {
        console.error('Failed to fetch mesocycles', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMesocycles();
  }, []);

  const handleChange = (event: SelectChangeEvent<number | 'all'>) => {
    onChange(event.target.value as number | 'all');
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start', 
      mb: 3, 
      pt: 1.5,
      ...sx
    }}>
      <FormControl 
        sx={{ 
          minWidth: 220,
          '& .MuiOutlinedInput-root': {
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 2,
            color: 'white',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused': {
              borderColor: themeColors.primary.main,
              boxShadow: `0 0 0 3px rgba(${themeColors.primary.main.replace('rgb(', '').replace(')', '')}, 0.1)`
            },
            '& fieldset': {
              border: 'none'
            }
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-focused': {
              color: themeColors.primary.main
            }
          },
          ...sx
        }} 
        size="small"
      >
        <InputLabel id="mesocycle-select-label">{label}</InputLabel>
        <Select
          labelId="mesocycle-select-label"
          value={value ?? ''}
          label={label}
          onChange={handleChange}
          disabled={loading}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: '#1a1a1a',
                color: 'white',
                '& .MuiMenuItem-root': {
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                  },
                  '&.Mui-selected': {
                    bgcolor: 'rgba(136, 132, 216, 0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(136, 132, 216, 0.3)'
                    }
                  }
                }
              }
            }
          }}
        >
          {showAllTime && <MenuItem value="all">All Time</MenuItem>}
          {mesocycles.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.name}{showPlanName && m.plan ? ` (${m.plan.name})` : ''}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}


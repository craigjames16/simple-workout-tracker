import React from 'react';
import { Box, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';

interface SetVolume {
  volume: number;
  date: Date;
}

interface MuscleGroupBarChartProps {
  data: Record<string, Array<Record<string, SetVolume>>>;
}

const MuscleGroupBarChart = ({ data }: MuscleGroupBarChartProps) => {
  // Transform the data for the chart
  const transformDataForChart = (instances: Array<Record<string, SetVolume>>) => {
    return instances.map((instance, index) => {
      const [instanceId, data] = Object.entries(instance)[0];
      let rollingVolume = data.volume;
      
      if (index >= 3) {
        // Get up to 3 previous instances plus current instance
        const startIdx = Math.max(0, index - 3);
        const relevantInstances = instances.slice(startIdx, index + 1);
        rollingVolume = relevantInstances
          .map(inst => Object.values(inst)[0].volume)
          .reduce((acc, curr) => acc + curr, 0);
      }

      return {
        instanceId,
        rollingVolume: rollingVolume/3,
        volume: data.volume,
        date: new Date(data.date).toLocaleDateString()
      };
    });
  };

  return (
    <React.Fragment>  
      {Object.entries(data).map(([muscleGroup, instances]) => (
        <Box key={muscleGroup} sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {muscleGroup}
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart 
              data={transformDataForChart(instances)}
              margin={{ top: 5, right: 5, left:5, bottom: 25 }}
            >
              <XAxis 
                tick={false}
                axisLine={false} 
                tickLine={false}
                label={{ value: 'Date', position: 'bottom' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={false}
                label={{ value: 'Volume', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Bar 
                dataKey="volume" 
                fill="#8884d8" 
              />
              <Line
                type="monotone"
                dataKey="rollingVolume"
                stroke="#ff7300"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      ))}
    </React.Fragment>
  );
};

export default MuscleGroupBarChart; 
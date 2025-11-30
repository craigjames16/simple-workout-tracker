type MetricKey = 'volume' | 'count';

export const buildRadarOption = (
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

export const buildCombinedRadarOption = (
  volumeData: Record<string, any[]> | null,
  setData: Record<string, any[]> | null,
  chartTitle: string
) => {
  if (!volumeData && !setData) return null;

  const muscleMetrics: Array<{ name: string; volumeValue: number; setValue: number }> = [];

  const calculateVolumeValue = (instances: any[]) => {
    if (!instances || !Array.isArray(instances) || instances.length === 0) return 0;
    const extractVolume = (instance: any) => {
      const entry = Object.values(instance)[0] as Record<string, number>;
      return entry?.volume ?? 0;
    };
    return extractVolume(instances[instances.length - 1]);
  };

  const calculateSetValue = (instances: any[]) => {
    if (!instances || !Array.isArray(instances) || instances.length === 0) return 0;
    const extractCount = (instance: any) => {
      const entry = Object.values(instance)[0] as Record<string, number>;
      return entry?.count ?? 0;
    };
    return instances.reduce(
      (acc: number, instance: any) => acc + extractCount(instance),
      0
    );
  };

  // Get all unique muscle groups from both datasets
  const allMuscleGroups = new Set<string>();
  if (volumeData) {
    Object.keys(volumeData).forEach(group => allMuscleGroups.add(group));
  }
  if (setData) {
    Object.keys(setData).forEach(group => allMuscleGroups.add(group));
  }

  allMuscleGroups.forEach((muscleGroup) => {
    const volumeInstances = volumeData?.[muscleGroup] || [];
    const setInstances = setData?.[muscleGroup] || [];
    
    const volumeValue = calculateVolumeValue(volumeInstances);
    const setValue = calculateSetValue(setInstances);

    if (volumeValue > 0 || setValue > 0) {
      muscleMetrics.push({
        name: muscleGroup,
        volumeValue,
        setValue
      });
    }
  });

  if (!muscleMetrics.length) return null;

  // Calculate max values for normalization
  const maxVolume = Math.max(...muscleMetrics.map(m => m.volumeValue), 1);
  const maxSet = Math.max(...muscleMetrics.map(m => m.setValue), 1);
  
  // Use the larger max for the indicator scale (normalize both to same scale)
  const globalMax = Math.max(maxVolume, maxSet);
  const indicatorMax = Math.ceil(globalMax * 1.2);
  
  const indicators = muscleMetrics.map(({ name }) => ({
    name,
    max: indicatorMax
  }));

  // Normalize values to the same scale for comparison
  const volumeValues = muscleMetrics.map(({ volumeValue }) => 
    Number((volumeValue * (indicatorMax / maxVolume)).toFixed(2))
  );
  const setValues = muscleMetrics.map(({ setValue }) => 
    Number((setValue * (indicatorMax / maxSet)).toFixed(2))
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
      trigger: 'item',
      formatter: (params: any) => {
        const index = params.dataIndex;
        const metric = muscleMetrics[index];
        return `${params.name}<br/>` +
               `${params.marker}${params.seriesName}: ${params.value}<br/>` +
               `Volume: ${metric.volumeValue.toLocaleString()}<br/>` +
               `Sets: ${metric.setValue}`;
      }
    },
    legend: {
      data: ['Volume', 'Sets'],
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
        name: 'Volume',
        type: 'radar',
        data: [
          {
            value: volumeValues,
            name: 'Volume'
          }
        ],
        areaStyle: {
          opacity: 0.1,
          color: '#8884d8'
        },
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: {
          width: 2,
          color: '#8884d8'
        },
        itemStyle: {
          color: '#8884d8'
        }
      },
      {
        name: 'Sets',
        type: 'radar',
        data: [
          {
            value: setValues,
            name: 'Sets'
          }
        ],
        areaStyle: {
          opacity: 0.1,
          color: '#ff7300'
        },
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: {
          width: 2,
          color: '#ff7300'
        },
        itemStyle: {
          color: '#ff7300'
        }
      }
    ]
  };
};


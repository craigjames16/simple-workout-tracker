'use client';

import { useEffect, useState } from 'react';
import { Box, SxProps, Theme, Typography } from '@mui/material';

export interface PlanInstanceDay {
  id: number;
  planInstanceId: number;
  planDayId: number;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
  planDay: {
    id: number;
    isRestDay: boolean;
    dayNumber: number;
    workout?: {
      id: number;
      name: string;
    } | null;
  };
  workoutInstance: {
    id: number;
    completedAt: string | null;
    workout: {
      id: number;
      name: string;
    };
  } | null;
  planInstance: {
    id: number;
    iterationNumber: number | null;
    status: string | null;
    startedAt: string;
    completedAt: string | null;
  };
}

export interface ScheduleData {
  previousDays: PlanInstanceDay[];
  upcomingDays: PlanInstanceDay[];
}

interface ScheduleTimelineProps {
  mesocycleId: number | null;
  compact?: boolean; // When true, doesn't render Card wrapper and title
  sx?: SxProps<Theme>;
}

export default function ScheduleTimeline({ mesocycleId, compact = false, sx }: ScheduleTimelineProps) {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!mesocycleId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/mesocycles/${mesocycleId}/schedule`);
        if (!response.ok) {
          throw new Error('Failed to fetch schedule');
        }
        const data = await response.json();
        setSchedule(data);
      } catch (err) {
        console.error('Error fetching schedule:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [mesocycleId]);

  if (loading || !schedule) {
    return null;
  }

  // Generate timeline dates: past 10 days, today, next 10 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const timelineDates: Date[] = [];
  // Past 10 days
  for (let i = 10; i > 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    timelineDates.push(date);
  }
  // Today
  timelineDates.push(new Date(today));
  // Next 10 days
  for (let i = 1; i <= 10; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    timelineDates.push(date);
  }

  // Helper to check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date | string) => {
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    return date1.getFullYear() === d2.getFullYear() &&
           date1.getMonth() === d2.getMonth() &&
           date1.getDate() === d2.getDate();
  };

  // Map completed days to timeline dates
  // Sort previousDays by completion date (most recent first)
  const sortedPreviousDays = [...schedule.previousDays].sort((a, b) => {
    const dateA = a.workoutInstance?.completedAt 
      ? new Date(a.workoutInstance.completedAt)
      : new Date(a.updatedAt);
    const dateB = b.workoutInstance?.completedAt 
      ? new Date(b.workoutInstance.completedAt)
      : new Date(b.updatedAt);
    return dateB.getTime() - dateA.getTime();
  });

  const completedDaysMap = new Map<string, PlanInstanceDay>();
  
  // Get past timeline dates (excluding today and future)
  const pastTimelineDates = timelineDates.filter(date => {
    const dateCopy = new Date(date);
    const todayCopy = new Date(today);
    return dateCopy < todayCopy;
  });
  
  // First, try to map completed days to their actual completion dates
  sortedPreviousDays.forEach((day) => {
    const completionDate = day.workoutInstance?.completedAt 
      ? new Date(day.workoutInstance.completedAt)
      : new Date(day.updatedAt);
    
    // Find matching timeline date (exact day match)
    const matchingTimelineDate = timelineDates.find(timelineDate => 
      isSameDay(timelineDate, completionDate)
    );
    
    if (matchingTimelineDate) {
      const dateKey = matchingTimelineDate.toISOString();
      if (!completedDaysMap.has(dateKey)) {
        completedDaysMap.set(dateKey, day);
      }
    }
  });
  
  // For any remaining completed days that didn't match a timeline date, map them to past dates sequentially
  const remainingCompletedDays = sortedPreviousDays.filter(day => {
    const completionDate = day.workoutInstance?.completedAt 
      ? new Date(day.workoutInstance.completedAt)
      : new Date(day.updatedAt);
    const matchingTimelineDate = timelineDates.find(timelineDate => 
      isSameDay(timelineDate, completionDate)
    );
    // Include day if it wasn't matched to a timeline date, or if it was matched but not yet in the map
    return !matchingTimelineDate || !completedDaysMap.has(matchingTimelineDate.toISOString());
  });
  
  remainingCompletedDays.forEach((day, index) => {
    if (index < pastTimelineDates.length) {
      const timelineDate = pastTimelineDates[pastTimelineDates.length - 1 - index];
      const dateKey = timelineDate.toISOString();
      if (!completedDaysMap.has(dateKey)) {
        completedDaysMap.set(dateKey, day);
      }
    }
  });

  // Create a map for expected rest days (rest days that should appear but weren't explicitly completed)
  const expectedRestDaysMap = new Map<string, { dayNumber: number; isRestDay: true }>();
  
  // Combine previousDays and upcomingDays to understand the full plan sequence
  const allDays = [...schedule.previousDays, ...schedule.upcomingDays];
  
  // For each completed day that's mapped to a date, check if the next day in sequence is a rest day
  completedDaysMap.forEach((day, dateKey) => {
    // Only check workout days (not rest days themselves)
    if (!day.planDay.isRestDay) {
      const currentDayNumber = day.planDay.dayNumber;
      // Find the next day in the sequence from all days (previous or upcoming)
      const nextDay = allDays.find(d => d.planDay.dayNumber === currentDayNumber + 1);
      
      if (nextDay && nextDay.planDay.isRestDay) {
        // The next day is a rest day - check if it's already mapped
        const currentDate = new Date(dateKey);
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 1);
        
        // Check if this next date is in the past and not already mapped
        if (nextDate < today) {
          const nextDateKey = nextDate.toISOString();
          const matchingTimelineDate = timelineDates.find(td => isSameDay(td, nextDate));
          
          if (matchingTimelineDate && !completedDaysMap.has(matchingTimelineDate.toISOString())) {
            // This is an expected rest day that should appear but wasn't completed
            expectedRestDaysMap.set(matchingTimelineDate.toISOString(), {
              dayNumber: nextDay.planDay.dayNumber,
              isRestDay: true
            });
          }
        }
      }
    }
  });

  // Map upcoming days to future timeline dates
  // First, ensure today gets the first upcoming day (same as "Next Workout" shows)
  const upcomingDaysMap = new Map<string, PlanInstanceDay>();
  let upcomingDayIndex = 0;
  
  // Explicitly map today to the first upcoming day to match "Next Workout" section
  if (schedule.upcomingDays.length > 0) {
    const todayKey = timelineDates.find(td => isSameDay(td, today))?.toISOString();
    if (todayKey) {
      // Always set today to the first upcoming day, overriding any completed day mapping
      upcomingDaysMap.set(todayKey, schedule.upcomingDays[0]);
      upcomingDayIndex = 1;
    }
  }
  
  // Then map remaining upcoming days to future dates
  timelineDates.forEach(date => {
    // Only map to future dates (not today, as we already handled it)
    if (date > today && upcomingDayIndex < schedule.upcomingDays.length) {
      const dateKey = date.toISOString();
      if (!completedDaysMap.has(dateKey) && !upcomingDaysMap.has(dateKey)) {
        upcomingDaysMap.set(dateKey, schedule.upcomingDays[upcomingDayIndex]);
        upcomingDayIndex++;
      }
    }
  });

  // Get day abbreviation
  const getDayAbbrev = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
  };

  const timelineContent = (
    <Box sx={{ 
      display: 'flex', 
      gap: 0,
      justifyContent: 'center',
      alignItems: 'flex-start',
      flexWrap: 'nowrap',
      overflowX: 'hidden',
      pb: 1,
      ...sx,
    }}>
      {timelineDates.map((date) => {
        const dateKey = date.toISOString();
        const completedDay = completedDaysMap.get(dateKey);
        const upcomingDay = upcomingDaysMap.get(dateKey);
        const expectedRestDay = expectedRestDaysMap.get(dateKey);
        const isToday = isSameDay(date, today);
        // For today, prioritize upcoming day to match "Next Workout" section
        const day = isToday ? (upcomingDay || completedDay) : (completedDay || upcomingDay);
        
        const isRestDay = day?.planDay.isRestDay || expectedRestDay?.isRestDay || false;
        const isCompleted = !!completedDay && !(isToday && upcomingDay); // Don't show as completed if today has upcoming
        const isUpcoming = !!upcomingDay && !isCompleted;
        const isExpectedRestDay = !!expectedRestDay && !isCompleted && !isUpcoming;

        return (
          <Box
            key={dateKey}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: { xs: 0.25, sm: 0.5 },
              minWidth: { xs: '12px', sm: '14px' },
              flexShrink: 0,
            }}
          >
            {/* Day abbreviation */}
            <Typography 
              variant="caption" 
              sx={{ 
                color: isToday ? 'primary.main' : 'rgba(255, 255, 255, 0.6)',
                fontWeight: isToday ? 700 : 400,
                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                textTransform: 'uppercase',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {getDayAbbrev(date)}
            </Typography>
            
            {/* Day box - always show a box */}
            <Box
              sx={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                backgroundColor: day || expectedRestDay
                  ? (isCompleted 
                      ? (isRestDay ? '#2196F3' : '#4CAF50') // Blue for rest, green for workout
                      : isExpectedRestDay
                      ? '#2196F3' // Blue for expected rest day
                      : 'transparent')
                  : 'rgba(128, 128, 128, 0.3)', // Grey for days with no data
                border: day || expectedRestDay
                  ? (isCompleted
                      ? (isToday ? '1px solid rgba(255, 255, 255, 0.5)' : 'none')
                      : isExpectedRestDay
                      ? 'none' // No border for expected rest day
                      : `1px solid ${isRestDay ? '#2196F3' : '#4CAF50'}`) // Outline for upcoming days
                  : '1px solid rgba(128, 128, 128, 0.5)', // Grey border for days with no data
                opacity: day || expectedRestDay
                  ? (isUpcoming ? 0.6 : isExpectedRestDay ? 0.7 : 1)
                  : 1,
              }}
            />
            
            {/* Day number */}
            {(day || expectedRestDay) && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: { xs: '0.55rem', sm: '0.65rem' },
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                {day?.planDay.dayNumber || expectedRestDay?.dayNumber}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );

  if (compact) {
    return (
      <Box sx={{ p: { xs: 1, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
        {timelineContent}
      </Box>
    );
  }

  // Full version with Card wrapper (for standalone use)
  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 700,
          color: 'white',
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
          mb: 2,
          display: { xs: 'none', sm: 'block' }
        }}
      >
        Schedule Timeline
      </Typography>
      {timelineContent}
    </Box>
  );
}

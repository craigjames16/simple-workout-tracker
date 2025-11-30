'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import { DayPicker } from 'react-day-picker';
import { PlanInstanceDay, ScheduleData } from './ScheduleTimeline';
import { gradients } from '@/lib/theme-constants';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import 'react-day-picker/dist/style.css';
import './WorkoutCalendar.css';

interface WorkoutCalendarProps {
  mesocycleId: number | null;
}

export default function WorkoutCalendar({ mesocycleId }: WorkoutCalendarProps) {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);

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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Filter out rest days from completed days
  const completedWorkoutDays = schedule.previousDays.filter(day => 
    !day.planDay.isRestDay && day.workoutInstance?.completedAt
  );

  // Filter out rest days from upcoming days for display
  const upcomingWorkoutDays = schedule.upcomingDays.filter(day => 
    !day.planDay.isRestDay
  );

  // Create arrays of Date objects for modifiers
  const completedDates: Date[] = completedWorkoutDays.map(day => {
    const completionDate = day.workoutInstance?.completedAt 
      ? new Date(day.workoutInstance.completedAt)
      : new Date(day.updatedAt);
    completionDate.setHours(0, 0, 0, 0);
    return completionDate;
  });

  // Map upcoming days to calendar dates sequentially starting from today
  // Also create a map from dates to PlanInstanceDay objects for click handling
  const upcomingDates: Date[] = [];
  const upcomingDatesMap = new Map<string, PlanInstanceDay>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let upcomingIndex = 0;
  const maxDays = 60; // Look ahead 60 days
  
  for (let i = 0; i < maxDays && upcomingIndex < schedule.upcomingDays.length; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() + i);
    checkDate.setHours(0, 0, 0, 0);
    
    // Skip if this date already has a completed workout
    const isCompleted = completedDates.some(completedDate => 
      completedDate.getTime() === checkDate.getTime()
    );
    
    if (!isCompleted && upcomingIndex < schedule.upcomingDays.length) {
      const upcomingDay = schedule.upcomingDays[upcomingIndex];
      const dateKey = checkDate.toISOString();
      
      // Only add to upcomingDates if it's a workout day (for visual display)
      if (!upcomingDay.planDay.isRestDay) {
        upcomingDates.push(new Date(checkDate));
      }
      
      // Always add to map for click handling (includes rest days)
      upcomingDatesMap.set(dateKey, upcomingDay);
      upcomingIndex++;
    }
  }

  // Handler for when a day is clicked
  const handleDayClick = async (date: Date | undefined) => {
    if (!date || isStartingWorkout) return;

    const dateKey = date.toISOString();
    const upcomingDay = upcomingDatesMap.get(dateKey);

    if (!upcomingDay) return;

    // Only handle workout days (not rest days) for now
    if (upcomingDay.planDay.isRestDay) return;

    // Check if workout already has an instance
    if (upcomingDay.workoutInstance?.id) {
      // Navigate to existing workout
      window.location.href = `/track/${upcomingDay.workoutInstance.id}`;
      return;
    }

    try {
      setIsStartingWorkout(true);
      
      // Start new workout using planInstanceDayId
      const response = await fetch(
        `/api/plan-instances/${upcomingDay.planInstanceId}/days/${upcomingDay.id}/start`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to start workout');
      }

      const data = await response.json();
      // Navigate to new workout
      window.location.href = `/track/${data.id}`;
    } catch (error) {
      console.error('Error starting workout:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsStartingWorkout(false);
    }
  };

  // Custom styles for the calendar
  const calendarStyles = {
    '--rdp-cell-size': '40px',
    '--rdp-accent-color': 'rgba(255, 255, 255, 0.1)',
    '--rdp-background-color': 'transparent',
    '--rdp-selected-background': 'rgba(25, 118, 210, 0.3)',
    '--rdp-selected-color': '#1976d2',
    '--rdp-today-color': '#1976d2',
    '--rdp-day_selected-font-weight': '700',
    '--rdp-day-today-font-weight': '700',
  } as React.CSSProperties;

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
      <CardContent sx={{ 
        px: { xs: 1.5, sm: 2 }, 
        py: { xs: 1.5, sm: 2 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <DayPicker
          mode="single"
          month={selectedMonth}
          onMonthChange={setSelectedMonth}
          onSelect={handleDayClick}
          modifiers={{
            completed: completedDates,
            upcoming: upcomingDates,
          }}
          modifiersClassNames={{
            completed: 'rdp-day_completed',
            upcoming: 'rdp-day_upcoming',
          }}
          style={calendarStyles}
          fixedWeeks
        />
      </CardContent>
    </Card>
  );
}

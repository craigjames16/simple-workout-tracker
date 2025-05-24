import { ExerciseCategory } from '@prisma/client';
import type { WorkoutInstanceWithRelations } from '@/types/prisma';

export interface ExerciseTracking {
  exerciseId: number;
  exerciseName: string;
  order: number;
  sets: Array<{
    id?: number;
    reps: number;
    weight: number;
    completed?: boolean;
    skipped?: boolean;
    adjustment?: boolean;
    lastSet: {
      reps: number;
      weight: number;
    } | null;
  }>;
  history: Array<{
    workoutInstanceId: number;
    volume: number;
    completedAt: Date;
    sets: Array<{
      weight: number;
      reps: number;
      setNumber: number;
    }>;
  }>;
  mesocycleHistory: Array<{
    completedAt: Date;
    mesocycleId: number;
    sets: Array<{
      weight: number;
      reps: number;
      setNumber: number;
    }>;
    volume: number;
    workoutInstanceId: number;
  }>;
}

export interface WorkoutExercise {
  exercise: {
    id: number;
    name: string;
  };
}

export interface ExerciseWithCategory {
  id: number;
  name: string;
  category: ExerciseCategory;
  workoutInstances: Array<{
    workoutInstanceId: number;
    mesocycleId: number;
    volume: number;
    completedAt: Date;
    sets: Array<{
      weight: number;
      reps: number;
      setNumber: number;
    }>;
  }>;
}

export interface ExerciseResponse {
  [category: string]: Array<{
    id: number;
    name: string;
    category: ExerciseCategory;
    workoutInstances: Array<{
      workoutInstanceId: number;
      mesocycleId: number;
      volume: number;
      completedAt: Date;
      sets: Array<{
        weight: number;
        reps: number;
        setNumber: number;
      }>;
    }>;
  }>;
}

export interface WorkoutHistoryView {
  iterationNumber: number;
  workouts: Array<{
    dayNumber: number;
    planInstanceDayId: number;
    workoutInstanceId: number;
    completedAt: Date | null;
    isRestDay: boolean;
    isCompleted: boolean;
    name: string;
  }>;
} 
import { ExerciseCategory } from '@prisma/client';

export interface ExportSetData {
  exercise_name: string;
  exercise_category: ExerciseCategory;
  workout_name: string;
  set_number: number;
  weight: number;
  reps: number;
  completed_at: string;
  mesocycle_name: string;
  plan_name: string;
  iteration_number: number | null;
  day_number: number | null;
  created_at: string;
}

export interface ExportOptions {
  dateFrom?: Date;
  dateTo?: Date;
  exerciseCategory?: ExerciseCategory;
  mesocycleId?: number;
  planId?: number;
}

export interface ExportResponse {
  success: boolean;
  message?: string;
  data?: ExportSetData[];
}

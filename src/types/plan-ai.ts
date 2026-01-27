import { z } from 'zod';

// ExerciseCategory enum matching Prisma enum
export const ExerciseCategorySchema = z.enum([
  'BACK',
  'BICEPS',
  'TRICEPS',
  'CHEST',
  'SHOULDERS',
  'HAMSTRINGS',
  'QUADS',
  'CALVES',
]);

// Exercise schema
export const ExerciseSchema = z.object({
  name: z.string(),
  category: ExerciseCategorySchema,
  id: z.number(),
});

// WorkoutExercise schema
export const WorkoutExerciseSchema = z.object({
  exercise: ExerciseSchema,
  order: z.number(),
});

// Workout schema
export const WorkoutSchema = z.object({
  name: z.string(),
  workoutExercises: z.array(WorkoutExerciseSchema),
});

// PlanDay schema
export const PlanDaySchema = z.object({
  dayNumber: z.number(),
  isRestDay: z.boolean(),
  workout: WorkoutSchema,
});

// Plan schema (root schema for OpenAI structured output)
export const PlanSchema = z.object({
  name: z.string(),
  PlanDay: z.array(PlanDaySchema),
});

// TypeScript types inferred from Zod schemas
export type ExerciseCategory = z.infer<typeof ExerciseCategorySchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type WorkoutExercise = z.infer<typeof WorkoutExerciseSchema>;
export type Workout = z.infer<typeof WorkoutSchema>;
export type PlanDay = z.infer<typeof PlanDaySchema>;
export type Plan = z.infer<typeof PlanSchema>;


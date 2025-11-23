import {
  PrismaClient,
  Adjustment,
  Exercise,
  ExerciseSet,
  Mesocycle,
  Plan,
  PlanDay,
  PlanInstance,
  PlanInstanceDay,
  Workout,
  WorkoutExercise,
  WorkoutInstance,
} from '@prisma/client';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

interface ExportPayload {
  exportedAt: string;
  plans: Plan[];
  planDays: PlanDay[];
  planInstances: PlanInstance[];
  planInstanceDays: PlanInstanceDay[];
  mesocycles: Mesocycle[];
  workouts: Workout[];
  workoutInstances: WorkoutInstance[];
  workoutExercises: WorkoutExercise[];
  exerciseSets: ExerciseSet[];
  exercises: Exercise[];
  adjustments: Adjustment[];
}

const REQUIRED_ENV = ['PROD_RO_DATABASE_URL', 'SEED_EXPORT_PATH'] as const;

function getEnv(name: (typeof REQUIRED_ENV)[number]): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function assertReadOnlyUrl(url: string): void {
  const lowered = url.toLowerCase();
  if (lowered.includes('localhost') || lowered.includes('127.0.0.1') || lowered.includes('0.0.0.0')) {
    throw new Error('PROD_RO_DATABASE_URL points to a local host; aborting.');
  }

  try {
    const parsed = new URL(url);
    const unsafeHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
    if (parsed.hostname && unsafeHosts.has(parsed.hostname)) {
      throw new Error(`Unsafe PROD_RO_DATABASE_URL hostname detected: ${parsed.hostname}`);
    }
  } catch (err) {
    throw new Error(`Invalid PROD_RO_DATABASE_URL: ${(err as Error).message}`);
  }
}

async function main(): Promise<void> {
  REQUIRED_ENV.forEach(getEnv);
  const prodUrl = process.env.PROD_RO_DATABASE_URL!;
  const exportPathEnv = process.env.SEED_EXPORT_PATH!;

  assertReadOnlyUrl(prodUrl);

  const exportPath = path.isAbsolute(exportPathEnv)
    ? exportPathEnv
    : path.join(process.cwd(), exportPathEnv);

  await mkdir(path.dirname(exportPath), { recursive: true });

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: prodUrl,
      },
    },
  });

  try {
    const payload = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY;');

      const [
        plans,
        planDays,
        planInstances,
        planInstanceDays,
        mesocycles,
        workouts,
        workoutInstances,
        workoutExercises,
        exerciseSets,
        exercises,
        adjustments,
      ] = await Promise.all([
        tx.plan.findMany(),
        tx.planDay.findMany(),
        tx.planInstance.findMany(),
        tx.planInstanceDay.findMany(),
        tx.mesocycle.findMany(),
        tx.workout.findMany(),
        tx.workoutInstance.findMany(),
        tx.workoutExercise.findMany(),
        tx.exerciseSet.findMany(),
        tx.exercise.findMany(),
        tx.adjustment.findMany(),
      ]);

      const exportPayload: ExportPayload = {
        exportedAt: new Date().toISOString(),
        plans,
        planDays,
        planInstances,
        planInstanceDays,
        mesocycles,
        workouts,
        workoutInstances,
        workoutExercises,
        exerciseSets,
        exercises,
        adjustments,
      };

      return exportPayload;
    });

    await writeFile(exportPath, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`✅ Exported workout data snapshot to ${exportPath}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Prod export failed:', err);
  process.exitCode = 1;
});


import {
  PrismaClient,
  Prisma,
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
import { readFile } from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

type TransactionClient = Prisma.TransactionClient;

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
const LOCAL_SUFFIXES = ['.local', '.test'];

const DEFAULT_USER_ID = 'seed-default-user';
const DEFAULT_USER_EMAIL = 'craig@local.lan';
const DEFAULT_USER_PASSWORD = 'Password123!';
const DEFAULT_USER_NAME = 'Craig (local snapshot)';

const SEQUENCE_TABLES = [
  'Exercise',
  'Workout',
  'Plan',
  'PlanDay',
  'PlanInstance',
  'PlanInstanceDay',
  'Mesocycle',
  'WorkoutInstance',
  'WorkoutExercise',
  'ExerciseSet',
  'Adjustment',
] as const;

function assertLocalDatabase(): void {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set; refuse to run destructive seed without explicit local DB.');
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (err) {
    throw new Error(`Invalid DATABASE_URL: ${(err as Error).message}`);
  }

  const hostname = parsed.hostname ?? '';
  const isLocalHost =
    LOCAL_HOSTS.has(hostname) || LOCAL_SUFFIXES.some((suffix) => hostname.endsWith(suffix));

  if (!isLocalHost) {
    throw new Error(
      `Refusing to seed non-local database host "${hostname}". Point DATABASE_URL at a local instance.`,
    );
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NODE_ENV=production detected; seeding is disabled to protect production data.');
  }
}

function resolveExportPath(): string {
  const target = process.env.SEED_EXPORT_PATH;
  if (!target) {
    throw new Error('Missing SEED_EXPORT_PATH env var. Set it to the JSON created by `npm run pull:prod-data`.');
  }
  return path.isAbsolute(target) ? target : path.join(process.cwd(), target);
}

async function readExportPayload(): Promise<ExportPayload> {
  const exportPath = resolveExportPath();

  let raw: string;
  try {
    raw = await readFile(exportPath, 'utf8');
  } catch (err) {
    throw new Error(`Failed to read export at ${exportPath}: ${(err as Error).message}`);
  }

  const parsed = JSON.parse(raw);
  const requiredArrays: (keyof ExportPayload)[] = [
    'plans',
    'planDays',
    'planInstances',
    'planInstanceDays',
    'mesocycles',
    'workouts',
    'workoutInstances',
    'workoutExercises',
    'exerciseSets',
    'exercises',
    'adjustments',
  ];

  for (const key of requiredArrays) {
    if (!Array.isArray(parsed[key])) {
      throw new Error(`Export payload missing array for "${key}"`);
    }
  }

  return parsed as ExportPayload;
}

async function clearTables(tx: TransactionClient): Promise<void> {
  await tx.exerciseSet.deleteMany();
  await tx.workoutExercise.deleteMany();
  await tx.planInstanceDay.deleteMany();
  await tx.workoutInstance.deleteMany();
  await tx.planInstance.deleteMany();
  await tx.planDay.deleteMany();
  await tx.mesocycle.deleteMany();
  await tx.plan.deleteMany();
  await tx.workout.deleteMany();
  await tx.adjustment.deleteMany();
  await tx.exercise.deleteMany();
  await tx.user.deleteMany();
}

function mapRequiredUserIds<T extends { userId: string }>(items: T[], userId: string): T[] {
  return items.map((item) => ({ ...item, userId }));
}

function mapOptionalUserIds<T extends { userId?: string | null }>(items: T[], userId: string): T[] {
  return items.map((item) => ({ ...item, userId }));
}

function normalizePayload(payload: ExportPayload, userId: string): ExportPayload {
  return {
    ...payload,
    plans: mapRequiredUserIds(payload.plans, userId),
    planInstances: mapRequiredUserIds(payload.planInstances, userId),
    mesocycles: mapRequiredUserIds(payload.mesocycles, userId),
    workouts: mapRequiredUserIds(payload.workouts, userId),
    workoutInstances: mapRequiredUserIds(payload.workoutInstances, userId),
    exercises: mapOptionalUserIds(payload.exercises, userId),
    adjustments: mapOptionalUserIds(payload.adjustments, userId),
  };
}

async function insertIfAny<T>(items: T[], action: (data: T[]) => Promise<unknown>): Promise<void> {
  if (!items.length) {
    return;
  }
  await action(items);
}

async function seedData(tx: TransactionClient, payload: ExportPayload) {
  const summary: Record<string, number> = {};

  await insertIfAny(payload.exercises, (data) => tx.exercise.createMany({ data }));
  summary.exercises = payload.exercises.length;

  await insertIfAny(payload.workouts, (data) => tx.workout.createMany({ data }));
  summary.workouts = payload.workouts.length;

  await insertIfAny(payload.plans, (data) => tx.plan.createMany({ data }));
  summary.plans = payload.plans.length;

  await insertIfAny(payload.planDays, (data) => tx.planDay.createMany({ data }));
  summary.planDays = payload.planDays.length;

  await insertIfAny(payload.mesocycles, (data) => tx.mesocycle.createMany({ data }));
  summary.mesocycles = payload.mesocycles.length;

  await insertIfAny(payload.planInstances, (data) => tx.planInstance.createMany({ data }));
  summary.planInstances = payload.planInstances.length;

  await insertIfAny(payload.workoutInstances, (data) => tx.workoutInstance.createMany({ data }));
  summary.workoutInstances = payload.workoutInstances.length;

  await insertIfAny(payload.planInstanceDays, (data) => tx.planInstanceDay.createMany({ data }));
  summary.planInstanceDays = payload.planInstanceDays.length;

  await insertIfAny(payload.workoutExercises, (data) => tx.workoutExercise.createMany({ data }));
  summary.workoutExercises = payload.workoutExercises.length;

  await insertIfAny(payload.exerciseSets, (data) => tx.exerciseSet.createMany({ data }));
  summary.exerciseSets = payload.exerciseSets.length;

  await insertIfAny(payload.adjustments, (data) => tx.adjustment.createMany({ data }));
  summary.adjustments = payload.adjustments.length;

  return summary;
}

async function resetSequences(client: PrismaClient): Promise<void> {
  for (const table of SEQUENCE_TABLES) {
    const sql = `SELECT setval(pg_get_serial_sequence('"${table}"','id'), COALESCE((SELECT MAX("id") FROM "${table}"), 0) + 1, false);`;
    await client.$executeRawUnsafe(sql);
  }
}

async function main() {
  assertLocalDatabase();
  const payload = await readExportPayload();

  const hashedPassword = await bcrypt.hash(DEFAULT_USER_PASSWORD, 12);

  const summary = await prisma.$transaction(async (tx) => {
    await clearTables(tx);
    await tx.user.create({
      data: {
        id: DEFAULT_USER_ID,
        email: DEFAULT_USER_EMAIL,
        name: DEFAULT_USER_NAME,
        password: hashedPassword,
      },
    });

    const normalized = normalizePayload(payload, DEFAULT_USER_ID);

    return seedData(tx, normalized);
  });

  await resetSequences(prisma);

  console.log('✅ Seeded tables with production snapshot:');
  for (const [key, count] of Object.entries(summary)) {
    console.log(`  • ${key}: ${count}`);
  }
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
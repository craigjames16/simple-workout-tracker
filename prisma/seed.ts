import { PrismaClient, ExerciseCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete all existing data
  await prisma.exerciseSet.deleteMany();
  await prisma.workoutInstance.deleteMany();
  await prisma.planInstanceDay.deleteMany();
  await prisma.planInstance.deleteMany();
  await prisma.workoutExercise.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.planDay.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.mesocycle.deleteMany();

  // Create exercises with categories
  const exercises = await Promise.all([
    // Back exercises
    prisma.exercise.create({ data: { name: 'Pull-ups', category: ExerciseCategory.BACK } }),
    prisma.exercise.create({ data: { name: 'Bent Over Rows', category: ExerciseCategory.BACK } }),
    prisma.exercise.create({ data: { name: 'Lat Pulldowns', category: ExerciseCategory.BACK } }),
    prisma.exercise.create({ data: { name: 'Deadlifts', category: ExerciseCategory.BACK } }),
    prisma.exercise.create({ data: { name: 'T-Bar Rows', category: ExerciseCategory.BACK } }),
    prisma.exercise.create({ data: { name: 'Seated Cable Rows', category: ExerciseCategory.BACK } }),
    prisma.exercise.create({ data: { name: 'Single-Arm Dumbbell Rows', category: ExerciseCategory.BACK } }),
    prisma.exercise.create({ data: { name: 'Face Pulls', category: ExerciseCategory.BACK } }),
    
    // Chest exercises
    prisma.exercise.create({ data: { name: 'Bench Press', category: ExerciseCategory.CHEST } }),
    prisma.exercise.create({ data: { name: 'Push-ups', category: ExerciseCategory.CHEST } }),
    prisma.exercise.create({ data: { name: 'Incline Dumbbell Press', category: ExerciseCategory.CHEST } }),
    prisma.exercise.create({ data: { name: 'Decline Bench Press', category: ExerciseCategory.CHEST } }),
    prisma.exercise.create({ data: { name: 'Dumbbell Flyes', category: ExerciseCategory.CHEST } }),
    prisma.exercise.create({ data: { name: 'Cable Flyes', category: ExerciseCategory.CHEST } }),
    prisma.exercise.create({ data: { name: 'Machine Chest Press', category: ExerciseCategory.CHEST } }),
    prisma.exercise.create({ data: { name: 'Landmine Press', category: ExerciseCategory.CHEST } }),
    
    // Shoulders exercises
    prisma.exercise.create({ data: { name: 'Overhead Press', category: ExerciseCategory.SHOULDERS } }),
    prisma.exercise.create({ data: { name: 'Lateral Raises', category: ExerciseCategory.SHOULDERS } }),
    prisma.exercise.create({ data: { name: 'Front Raises', category: ExerciseCategory.SHOULDERS } }),
    prisma.exercise.create({ data: { name: 'Reverse Flyes', category: ExerciseCategory.SHOULDERS } }),
    prisma.exercise.create({ data: { name: 'Arnold Press', category: ExerciseCategory.SHOULDERS } }),
    prisma.exercise.create({ data: { name: 'Military Press', category: ExerciseCategory.SHOULDERS } }),
    prisma.exercise.create({ data: { name: 'Upright Rows', category: ExerciseCategory.SHOULDERS } }),
    prisma.exercise.create({ data: { name: 'Cable Lateral Raises', category: ExerciseCategory.SHOULDERS } }),
    
    // Biceps exercises
    prisma.exercise.create({ data: { name: 'Barbell Curls', category: ExerciseCategory.BICEPS } }),
    prisma.exercise.create({ data: { name: 'Hammer Curls', category: ExerciseCategory.BICEPS } }),
    prisma.exercise.create({ data: { name: 'Preacher Curls', category: ExerciseCategory.BICEPS } }),
    prisma.exercise.create({ data: { name: 'Incline Dumbbell Curls', category: ExerciseCategory.BICEPS } }),
    prisma.exercise.create({ data: { name: 'Cable Curls', category: ExerciseCategory.BICEPS } }),
    prisma.exercise.create({ data: { name: 'Concentration Curls', category: ExerciseCategory.BICEPS } }),
    prisma.exercise.create({ data: { name: 'Spider Curls', category: ExerciseCategory.BICEPS } }),
    prisma.exercise.create({ data: { name: 'EZ Bar Curls', category: ExerciseCategory.BICEPS } }),
    
    // Triceps exercises
    prisma.exercise.create({ data: { name: 'Tricep Pushdowns', category: ExerciseCategory.TRICEPS } }),
    prisma.exercise.create({ data: { name: 'Skull Crushers', category: ExerciseCategory.TRICEPS } }),
    prisma.exercise.create({ data: { name: 'Diamond Push-ups', category: ExerciseCategory.TRICEPS } }),
    prisma.exercise.create({ data: { name: 'Overhead Tricep Extensions', category: ExerciseCategory.TRICEPS } }),
    prisma.exercise.create({ data: { name: 'Rope Pushdowns', category: ExerciseCategory.TRICEPS } }),
    prisma.exercise.create({ data: { name: 'Close-Grip Bench Press', category: ExerciseCategory.TRICEPS } }),
    prisma.exercise.create({ data: { name: 'Dips', category: ExerciseCategory.TRICEPS } }),
    prisma.exercise.create({ data: { name: 'JM Press', category: ExerciseCategory.TRICEPS } }),
    
    // Quads exercises
    prisma.exercise.create({ data: { name: 'Squats', category: ExerciseCategory.QUADS } }),
    prisma.exercise.create({ data: { name: 'Leg Press', category: ExerciseCategory.QUADS } }),
    prisma.exercise.create({ data: { name: 'Leg Extensions', category: ExerciseCategory.QUADS } }),
    prisma.exercise.create({ data: { name: 'Front Squats', category: ExerciseCategory.QUADS } }),
    prisma.exercise.create({ data: { name: 'Hack Squats', category: ExerciseCategory.QUADS } }),
    prisma.exercise.create({ data: { name: 'Bulgarian Split Squats', category: ExerciseCategory.QUADS } }),
    prisma.exercise.create({ data: { name: 'Sissy Squats', category: ExerciseCategory.QUADS } }),
    prisma.exercise.create({ data: { name: 'Walking Lunges', category: ExerciseCategory.QUADS } }),
    
    // Hamstrings exercises
    prisma.exercise.create({ data: { name: 'Romanian Deadlifts', category: ExerciseCategory.HAMSTRINGS } }),
    prisma.exercise.create({ data: { name: 'Leg Curls', category: ExerciseCategory.HAMSTRINGS } }),
    prisma.exercise.create({ data: { name: 'Good Mornings', category: ExerciseCategory.HAMSTRINGS } }),
    prisma.exercise.create({ data: { name: 'Nordic Curls', category: ExerciseCategory.HAMSTRINGS } }),
    prisma.exercise.create({ data: { name: 'Glute-Ham Raises', category: ExerciseCategory.HAMSTRINGS } }),
    prisma.exercise.create({ data: { name: 'Single-Leg Deadlifts', category: ExerciseCategory.HAMSTRINGS } }),
    prisma.exercise.create({ data: { name: 'Seated Leg Curls', category: ExerciseCategory.HAMSTRINGS } }),
    prisma.exercise.create({ data: { name: 'Swiss Ball Leg Curls', category: ExerciseCategory.HAMSTRINGS } }),
    
    // Calves exercises
    prisma.exercise.create({ data: { name: 'Standing Calf Raises', category: ExerciseCategory.CALVES } }),
    prisma.exercise.create({ data: { name: 'Seated Calf Raises', category: ExerciseCategory.CALVES } }),
    prisma.exercise.create({ data: { name: 'Donkey Calf Raises', category: ExerciseCategory.CALVES } }),
    prisma.exercise.create({ data: { name: 'Smith Machine Calf Raises', category: ExerciseCategory.CALVES } }),
    prisma.exercise.create({ data: { name: 'Single-Leg Calf Raises', category: ExerciseCategory.CALVES } }),
    prisma.exercise.create({ data: { name: 'Leg Press Calf Raises', category: ExerciseCategory.CALVES } }),
    prisma.exercise.create({ data: { name: 'Jump Rope', category: ExerciseCategory.CALVES } }),
    prisma.exercise.create({ data: { name: 'Box Jumps', category: ExerciseCategory.CALVES } }),
  ]);

  console.log('Seeded exercises with categories');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
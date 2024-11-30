import { PrismaClient, ExerciseCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create exercises with categories
  const exercises = await Promise.all([
    // Back exercises
    prisma.exercise.create({ data: { name: 'Pull-ups', category: ExerciseCategory.BACK, userId: null } }),
    prisma.exercise.create({ data: { name: 'Bent Over Rows', category: ExerciseCategory.BACK, userId: null } }),
    prisma.exercise.create({ data: { name: 'Lat Pulldowns', category: ExerciseCategory.BACK, userId: null } }),
    prisma.exercise.create({ data: { name: 'Deadlifts', category: ExerciseCategory.BACK, userId: null } }),
    prisma.exercise.create({ data: { name: 'T-Bar Rows', category: ExerciseCategory.BACK, userId: null } }),
    prisma.exercise.create({ data: { name: 'Seated Cable Rows', category: ExerciseCategory.BACK, userId: null } }),
    prisma.exercise.create({ data: { name: 'Single-Arm Dumbbell Rows', category: ExerciseCategory.BACK, userId: null } }),
    prisma.exercise.create({ data: { name: 'Face Pulls', category: ExerciseCategory.BACK, userId: null } }),
    
    // Chest exercises
    prisma.exercise.create({ data: { name: 'Bench Press', category: ExerciseCategory.CHEST, userId: null } }),
    prisma.exercise.create({ data: { name: 'Push-ups', category: ExerciseCategory.CHEST, userId: null } }),
    prisma.exercise.create({ data: { name: 'Incline Dumbbell Press', category: ExerciseCategory.CHEST, userId: null } }),
    prisma.exercise.create({ data: { name: 'Decline Bench Press', category: ExerciseCategory.CHEST, userId: null } }),
    prisma.exercise.create({ data: { name: 'Dumbbell Flyes', category: ExerciseCategory.CHEST, userId: null } }),
    prisma.exercise.create({ data: { name: 'Cable Flyes', category: ExerciseCategory.CHEST, userId: null } }),
    prisma.exercise.create({ data: { name: 'Machine Chest Press', category: ExerciseCategory.CHEST, userId: null } }),
    prisma.exercise.create({ data: { name: 'Landmine Press', category: ExerciseCategory.CHEST, userId: null } }),
    
    // Shoulders exercises
    prisma.exercise.create({ data: { name: 'Overhead Press', category: ExerciseCategory.SHOULDERS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Lateral Raises', category: ExerciseCategory.SHOULDERS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Front Raises', category: ExerciseCategory.SHOULDERS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Reverse Flyes', category: ExerciseCategory.SHOULDERS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Arnold Press', category: ExerciseCategory.SHOULDERS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Military Press', category: ExerciseCategory.SHOULDERS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Upright Rows', category: ExerciseCategory.SHOULDERS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Cable Lateral Raises', category: ExerciseCategory.SHOULDERS, userId: null } }),
    
    // Biceps exercises
    prisma.exercise.create({ data: { name: 'Barbell Curls', category: ExerciseCategory.BICEPS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Hammer Curls', category: ExerciseCategory.BICEPS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Preacher Curls', category: ExerciseCategory.BICEPS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Incline Dumbbell Curls', category: ExerciseCategory.BICEPS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Cable Curls', category: ExerciseCategory.BICEPS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Concentration Curls', category: ExerciseCategory.BICEPS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Spider Curls', category: ExerciseCategory.BICEPS, userId: null } }),
    prisma.exercise.create({ data: { name: 'EZ Bar Curls', category: ExerciseCategory.BICEPS, userId: null } }),
    
    // Triceps exercises
    prisma.exercise.create({ data: { name: 'Tricep Pushdowns', category: ExerciseCategory.TRICEPS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Skull Crushers', category: ExerciseCategory.TRICEPS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Diamond Push-ups', category: ExerciseCategory.TRICEPS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Overhead Tricep Extensions', category: ExerciseCategory.TRICEPS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Rope Pushdowns', category: ExerciseCategory.TRICEPS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Close-Grip Bench Press', category: ExerciseCategory.TRICEPS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Dips', category: ExerciseCategory.TRICEPS, userId: null } }),
    prisma.exercise.create({ data: { name: 'JM Press', category: ExerciseCategory.TRICEPS, userId: null } }),
    
    // Quads exercises
    prisma.exercise.create({ data: { name: 'Squats', category: ExerciseCategory.QUADS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Leg Press', category: ExerciseCategory.QUADS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Leg Extensions', category: ExerciseCategory.QUADS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Front Squats', category: ExerciseCategory.QUADS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Hack Squats', category: ExerciseCategory.QUADS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Bulgarian Split Squats', category: ExerciseCategory.QUADS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Sissy Squats', category: ExerciseCategory.QUADS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Walking Lunges', category: ExerciseCategory.QUADS, userId: null } }),
    
    // Hamstrings exercises
    prisma.exercise.create({ data: { name: 'Romanian Deadlifts', category: ExerciseCategory.HAMSTRINGS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Leg Curls', category: ExerciseCategory.HAMSTRINGS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Good Mornings', category: ExerciseCategory.HAMSTRINGS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Nordic Curls', category: ExerciseCategory.HAMSTRINGS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Glute-Ham Raises', category: ExerciseCategory.HAMSTRINGS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Single-Leg Deadlifts', category: ExerciseCategory.HAMSTRINGS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Seated Leg Curls', category: ExerciseCategory.HAMSTRINGS, userId: null } }),
    prisma.exercise.create({ data: { name: 'Swiss Ball Leg Curls', category: ExerciseCategory.HAMSTRINGS, userId: null } }),
    
    // Calves exercises
    prisma.exercise.create({ data: { name: 'Standing Calf Raises', category: ExerciseCategory.CALVES, userId: null } }),
    prisma.exercise.create({ data: { name: 'Seated Calf Raises', category: ExerciseCategory.CALVES, userId: null } }),
    prisma.exercise.create({ data: { name: 'Donkey Calf Raises', category: ExerciseCategory.CALVES, userId: null } }),
    prisma.exercise.create({ data: { name: 'Smith Machine Calf Raises', category: ExerciseCategory.CALVES, userId: null } }),
    prisma.exercise.create({ data: { name: 'Single-Leg Calf Raises', category: ExerciseCategory.CALVES, userId: null } }),
    prisma.exercise.create({ data: { name: 'Leg Press Calf Raises', category: ExerciseCategory.CALVES, userId: null } }),
    prisma.exercise.create({ data: { name: 'Jump Rope', category: ExerciseCategory.CALVES, userId: null } }),
    prisma.exercise.create({ data: { name: 'Box Jumps', category: ExerciseCategory.CALVES, userId: null } }),
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
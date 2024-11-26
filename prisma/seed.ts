import { PrismaClient, ExerciseCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // First, create a default user first
  const defaultUser = await prisma.user.upsert({
    where: { email: 'default@example.com' },
    update: {},
    create: {
      email: 'default@example.com',
    }
  });

  // Create exercises with userId
  const exercises = [
    // Back exercises
    { name: 'Pull-ups', category: ExerciseCategory.BACK },
    { name: 'Lat Pulldowns', category: ExerciseCategory.BACK },
    { name: 'Barbell Rows', category: ExerciseCategory.BACK },
    // ... rest of the exercises
  ];

  // Upsert each exercise
  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { name: exercise.name },
      update: {
        userId: defaultUser.id,
        category: exercise.category
      },
      create: {
        name: exercise.name,
        category: exercise.category,
        userId: defaultUser.id
      }
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
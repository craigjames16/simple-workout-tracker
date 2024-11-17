import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create initial exercises
  const exercises = [
    'Push-ups',
    'Pull-ups',
    'Squats',
    'Deadlifts',
    'Bench Press',
    'Rows',
    'Lunges',
    'Shoulder Press',
  ];

  console.log('Starting to seed database...');

  for (const exerciseName of exercises) {
    await prisma.exercise.upsert({
      where: { name: exerciseName },
      update: {},
      create: { name: exerciseName },
    });
  }

  console.log('Database has been seeded with initial exercises');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Seeding completed.');
    await prisma.$disconnect();
  }); 
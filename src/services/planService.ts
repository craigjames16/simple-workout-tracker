import { prisma } from '@/lib/prisma';

interface ExerciseInput {
  id: string | number;
  order?: number;
}

interface DayInput {
  isRestDay: boolean;
  workoutExercises?: ExerciseInput[];
}

interface CreatePlanInput {
  name: string;
  userId: string;
  days: DayInput[];
}

export async function createPlan({ name, userId, days }: CreatePlanInput) {
  console.log('Creating plan:', { name, userId, days });
  return prisma.plan.create({
    data: {
      name,
      userId,
      days: {
        create: await Promise.all(days.map(async (day, index) => {
          if (day.isRestDay) {
            return {
              dayNumber: index + 1,
              isRestDay: true,
            };
          }

          // Create a workout for this day
          const workout = await prisma.workout.create({
            data: {
              name: `${name} - Day ${index + 1}`,
              userId,
              workoutExercises: {
                createMany: {
                  data: day.workoutExercises!.map((exercise, exerciseIndex) => ({
                    exerciseId: parseInt(String(exercise.id)),
                    order: exercise.order !== undefined ? exercise.order : exerciseIndex + 1
                  }))
                }
              }
            }
          });

          return {
            dayNumber: index + 1,
            isRestDay: false,
            workoutId: workout.id
          };
        }))
      }
    },
    include: {
      days: {
        include: {
          workout: {
            include: {
              workoutExercises: {
                include: {
                  exercise: true
                }
              }
            }
          }
        }
      }
    }
  });
} 
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const plan = await prisma.plan.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        days: {
          include: {
            workout: {
              include: {
                workoutExercises: {
                  include: {
                    exercise: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      { error: 'Error fetching plan' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { name, days } = await request.json();

    // Update the plan in a transaction
    const updatedPlan = await prisma.$transaction(async (tx) => {
      // Update plan name
      const plan = await tx.plan.update({
        where: { id: parseInt(params.id) },
        data: { name },
      });

      // Get existing days
      const existingDays = await tx.planDay.findMany({
        where: { planId: plan.id },
        include: {
          workout: {
            include: {
              workoutExercises: {
                include: {
                  exercise: true
                }
              }
            },
          },
        },
      });

      // Update or create days as needed
      await Promise.all(days.map(async (day: any, index: number) => {
        const dayNumber = index + 1;
        const existingDay = existingDays.find(d => d.dayNumber === dayNumber);

        if (existingDay) {
          // Update existing day
          if (day.isRestDay) {
            // If changing to rest day, clean up workout if it exists
            if (existingDay.workout) {
              await tx.workoutExercise.deleteMany({
                where: { workoutId: existingDay.workout.id },
              });
              await tx.workout.delete({
                where: { id: existingDay.workout.id },
              });
            }
            return tx.planDay.update({
              where: { id: existingDay.id },
              data: { isRestDay: true, workoutId: null },
            });
          } else {
            // Update workout
            if (existingDay.workout) {
              // Clear existing exercises
              await tx.workoutExercise.deleteMany({
                where: { workoutId: existingDay.workout.id },
              });
              // Add new exercises
              await tx.workout.update({
                where: { id: existingDay.workout.id },
                data: {
                  workoutExercises: {
                    create: day.workoutExercises.map((exercise: any, exerciseIndex: number) => ({
                      exercise: {
                        connect: { id: exercise.id },
                      },
                      order: exerciseIndex,
                    })),
                  },
                },
              });
            } else {
              // Create new workout if day didn't have one
              const workout = await tx.workout.create({
                data: {
                  name: `${plan.name} - Day ${dayNumber}`,
                  userId: session.user.id,
                  workoutExercises: {
                    create: day.workoutExercises.map((exercise: any, exerciseIndex: number) => ({
                      exercise: {
                        connect: { id: exercise.id },
                      },
                      order: exerciseIndex,
                    })),
                  },
                },
              });
              await tx.planDay.update({
                where: { id: existingDay.id },
                data: { isRestDay: false, workoutId: workout.id },
              });
            }
          }
        } else {
          // Create new day if it doesn't exist
          if (day.isRestDay) {
            return tx.planDay.create({
              data: {
                planId: plan.id,
                dayNumber,
                isRestDay: true,
              },
            });
          } else {
            const workout = await tx.workout.create({
              data: {
                name: `${plan.name} - Day ${dayNumber}`,
                userId: session.user.id,
                workoutExercises: {
                  create: day.workoutExercises.map((exercise: any, exerciseIndex: number) => ({
                    exercise: {
                      connect: { id: exercise.id },
                    },
                    order: exerciseIndex,
                  })),
                },
              },
            });
            return tx.planDay.create({
              data: {
                planId: plan.id,
                dayNumber,
                isRestDay: false,
                workoutId: workout.id,
              },
            });
          }
        }
      }));

      // Clean up any extra days that are no longer needed
      const extraDays = existingDays.filter(day => day.dayNumber > days.length);
      for (const day of extraDays) {
        if (day.workout) {
          await tx.workoutExercise.deleteMany({
            where: { workoutId: day.workout.id },
          });
          await tx.workout.delete({
            where: { id: day.workout.id },
          });
        }
        await tx.planDay.delete({
          where: { id: day.id },
        });
      }

      return plan;
    });

    return NextResponse.json({ 
      ...updatedPlan,
      redirect: '/plans'
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: 'Error updating plan' },
      { status: 500 }
    );
  }
} 
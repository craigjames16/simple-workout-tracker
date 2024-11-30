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
                exercises: {
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
  try {
    const { name, days } = await request.json();

    // Update the plan in a transaction
    const updatedPlan = await prisma.$transaction(async (tx) => {
      // Update plan name
      const plan = await tx.plan.update({
        where: { id: parseInt(params.id) },
        data: { name },
      });

      // Get existing days to handle cleanup
      const existingDays = await tx.planDay.findMany({
        where: { planId: plan.id },
        include: {
          workout: {
            include: {
              exercises: true,
            },
          },
        },
      });

      // Delete existing days and their workouts
      for (const day of existingDays) {
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

      // Create new days and workouts
      await Promise.all(days.map(async (day: any, index: number) => {
        if (day.isRestDay) {
          return tx.planDay.create({
            data: {
              planId: plan.id,
              dayNumber: index + 1,
              isRestDay: true,
            },
          });
        }

        const workout = await tx.workout.create({
          data: {
            name: `${plan.name} - Day ${index + 1}`,
            exercises: {
              create: day.exercises.map((exercise: any, exerciseIndex: number) => ({
                exercise: {
                  connect: {
                    id: exercise.id,
                  },
                },
                order: exerciseIndex,
              })),
            },
          },
        });

        return tx.planDay.create({
          data: {
            planId: plan.id,
            dayNumber: index + 1,
            isRestDay: false,
            workoutId: workout.id,
          },
        });
      }));

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
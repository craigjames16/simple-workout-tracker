import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const latestWorkout = await prisma.workoutInstance.findFirst({
      where: {
        completedAt: null,
        userId: session.user.id,
      },
      orderBy: {
        startedAt: 'desc',
      },
      include: {
        workout: {
          include: {
            workoutExercises: {
              include: {
                exercise: true
              }
            }
          }
        },
        exerciseSets: {
          include: {
            exercise: true
          }
        },
        planInstanceDays: {
          include: {
            planDay: true,
            planInstance: true,
          }
        }
      },
    });

    if (latestWorkout) {
      // Try to extract planInstanceDay and related info if available
      const planInstanceDay = latestWorkout.planInstanceDays?.[0];
      const planDay = planInstanceDay?.planDay;
      const planInstance = planInstanceDay?.planInstance;
      return NextResponse.json({
        dayId: planInstanceDay?.id ?? null,
        dayNumber: planDay?.dayNumber ?? null,
        iterationId: planInstance?.id ?? null,
        iterationNumber: planInstance?.iterationNumber ?? null,
        isRestDay: planDay?.isRestDay ?? false,
        workoutId: latestWorkout.workout?.id ?? null,
        workoutName: latestWorkout.workout?.name ?? null,
        inProgress: true,
      });
    }

    // First try to find a mesocycle in progress
    const currentMesocycle = await prisma.mesocycle.findFirst({
      where: {
        userId: session.user.id,
        status: 'IN_PROGRESS',
      },
      include: {
        instances: {
          where: {
            status: 'IN_PROGRESS',
          },
          include: {
            days: {
              where: {
                isComplete: false,
              },
              orderBy: {
                planDay: {
                  dayNumber: 'asc',
                },
              },
              take: 1,
              include: {
                planDay: {
                  include: {
                    workout: true,
                  },
                },
              },
            },
          },
        },
        plan: {
          include: {
            days: {
              orderBy: {
                dayNumber: 'asc',
              },
              include: {
                workout: true,
              },
            },
          },
        },
      },
    });

    if (!currentMesocycle) {
      return NextResponse.json(
        { error: 'No in-progress mesocycle found' },
        { status: 404 }
      );
    }

    // Case 1: We have an in-progress iteration with incomplete days
    if (
      currentMesocycle.instances.length > 0 &&
      currentMesocycle.instances[0].days.length > 0
    ) {
      const nextInstance = currentMesocycle.instances[0];
      const nextDay = nextInstance.days[0];
      const planDay = nextDay.planDay;

      return NextResponse.json({
        dayId: nextDay.id,
        dayNumber: planDay.dayNumber,
        iterationId: nextInstance.id,
        iterationNumber: nextInstance.iterationNumber || 1,
        isRestDay: planDay.isRestDay,
        workoutId: planDay.workout?.id,
        workoutName: planDay.workout?.name,
        inProgress: false,
      });
    } 
    // Case 2: We have an in-progress iteration but all days are complete
    // OR we have no in-progress iterations at all
    // We need to create a new iteration starting with day 1
    else if (currentMesocycle.plan?.days?.length > 0) {
      // Calculate the next iteration number
      const lastIterationNumber = currentMesocycle.instances.length > 0 
        ? (currentMesocycle.instances[0].iterationNumber || 1) 
        : 0;
      
      // Get the first day from the plan
      const firstPlanDay = currentMesocycle.plan.days[0];
      
      return NextResponse.json({
        dayNumber: firstPlanDay.dayNumber,
        iterationNumber: lastIterationNumber + 1,
        isRestDay: firstPlanDay.isRestDay,
        workoutId: firstPlanDay.workout?.id,
        workoutName: firstPlanDay.workout?.name,
        needsNewIteration: true, // Flag to indicate client should create a new iteration
        inProgress: false,
      });
    } else {
      return NextResponse.json(
        { error: 'No upcoming workouts or rest days found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error fetching latest workout or next day:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching latest workout or next day', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from "@/lib/getAuthUser"

export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const latestWorkout = await prisma.workoutInstance.findFirst({
      where: {
        completedAt: null,
        userId: userId,
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

    // Helper function to find the mesocycle to display
    const findMesocycleToDisplay = async () => {
      // Priority 1: Try to find IN_PROGRESS mesocycle (ordered by createdAt desc)
      let mesocycle = await prisma.mesocycle.findFirst({
        where: {
          userId: userId,
          status: 'IN_PROGRESS',
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Priority 2: If no IN_PROGRESS, try to find newest NOT_STARTED mesocycle
      if (!mesocycle) {
        mesocycle = await prisma.mesocycle.findFirst({
          where: {
            userId: userId,
            status: 'NOT_STARTED',
          },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            plan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      }

      return mesocycle;
    };

    if (latestWorkout) {
      // Try to extract planInstanceDay and related info if available
      const planInstanceDay = latestWorkout.planInstanceDays?.[0];
      const planDay = planInstanceDay?.planDay;
      const planInstance = planInstanceDay?.planInstance;
      
      // Try to get mesocycle info if available from planInstance
      let mesocycleInfo = null;
      if (planInstance && planInstance.mesocycleId) {
        const mesocycle = await prisma.mesocycle.findFirst({
          where: {
            id: planInstance.mesocycleId,
            userId: userId,
          },
          include: {
            plan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
        if (mesocycle) {
          mesocycleInfo = {
            id: mesocycle.id,
            name: mesocycle.name,
            status: mesocycle.status,
            plan: mesocycle.plan,
          };
        }
      }
      
      // If no mesocycle from planInstance, try to find one using the helper function
      if (!mesocycleInfo) {
        const mesocycleToDisplay = await findMesocycleToDisplay();
        if (mesocycleToDisplay) {
          mesocycleInfo = {
            id: mesocycleToDisplay.id,
            name: mesocycleToDisplay.name,
            status: mesocycleToDisplay.status,
            plan: mesocycleToDisplay.plan,
          };
        }
      }

      return NextResponse.json({
        workoutInstanceId: latestWorkout.id,
        dayId: planInstanceDay?.id ?? null,
        dayNumber: planDay?.dayNumber ?? null,
        iterationId: planInstance?.id ?? null,
        iterationNumber: planInstance?.iterationNumber ?? null,
        isRestDay: planDay?.isRestDay ?? false,
        workoutId: latestWorkout.workout?.id ?? null,
        workoutName: latestWorkout.workout?.name ?? null,
        inProgress: true,
        mesocycleId: mesocycleInfo?.id ?? null,
        mesocycle: mesocycleInfo,
      });
    }

    // Find mesocycle to display (IN_PROGRESS first, then newest NOT_STARTED)
    const mesocycleToDisplay = await findMesocycleToDisplay();

    if (!mesocycleToDisplay) {
      // No mesocycle found - return response indicating no mesocycle
      return NextResponse.json({
        inProgress: false,
        mesocycleId: null,
        mesocycle: null,
      });
    }

    // Fetch full mesocycle data with instances and plan for next workout logic
    const currentMesocycle = await prisma.mesocycle.findFirst({
      where: {
        id: mesocycleToDisplay.id,
        userId: userId,
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
      // This shouldn't happen, but handle gracefully
      return NextResponse.json({
        inProgress: false,
        mesocycleId: null,
        mesocycle: null,
      });
    }

    // Prepare mesocycle info for response
    const mesocycleInfo = {
      id: currentMesocycle.id,
      name: currentMesocycle.name,
      status: currentMesocycle.status,
      plan: {
        id: currentMesocycle.plan.id,
        name: currentMesocycle.plan.name,
      },
    };

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
        mesocycleId: currentMesocycle.id,
        mesocycle: mesocycleInfo,
      });
    } 
    // Case 2: We have an in-progress iteration but all days are complete
    // OR we have no in-progress iterations at all
    // We need to create a new iteration starting with day 1
    else if (currentMesocycle.plan?.days?.length > 0) {
      // Fetch all instances (including completed) to find the max iteration number
      const allInstances = await prisma.planInstance.findMany({
        where: {
          mesocycleId: currentMesocycle.id,
        },
        select: {
          iterationNumber: true,
        },
        orderBy: {
          iterationNumber: 'desc',
        },
        take: 1,
      });

      // Calculate the next iteration number
      const lastIterationNumber = allInstances.length > 0 && allInstances[0].iterationNumber != null
        ? allInstances[0].iterationNumber
        : 0;
      
      // Get the first day from the plan
      const firstPlanDay = currentMesocycle.plan.days[0];
      
      return NextResponse.json({
        dayNumber: firstPlanDay.dayNumber,
        iterationNumber: lastIterationNumber + 1,
        isRestDay: firstPlanDay.isRestDay,
        workoutId: firstPlanDay.workout?.id,
        workoutName: firstPlanDay.workout?.name,
        mesocycleId: currentMesocycle.id,
        mesocycle: mesocycleInfo,
        needsNewIteration: true, // Flag to indicate client should create a new iteration
        inProgress: false,
      });
    } else {
      // Mesocycle exists but has no plan days - still return mesocycle info
      return NextResponse.json({
        inProgress: false,
        mesocycleId: currentMesocycle.id,
        mesocycle: mesocycleInfo,
      });
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
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from "@/lib/getAuthUser"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUser(request);
  const awaitedParams = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const mesocycleId = parseInt(awaitedParams.id);

    // First, verify the mesocycle exists and belongs to the user
    const mesocycle = await prisma.mesocycle.findFirst({
      where: {
        id: mesocycleId,
        userId: userId
      },
      include: {
        plan: {
          include: {
            days: {
              orderBy: {
                dayNumber: 'asc'
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
                }
              }
            }
          }
        },
        instances: {
          where: {
            userId: userId
          },
          include: {
            days: {
              include: {
                planDay: {
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
                },
                workoutInstance: {
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
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          },
          orderBy: {
            iterationNumber: 'asc'
          }
        }
      }
    });

    if (!mesocycle) {
      return NextResponse.json(
        { error: 'Mesocycle not found' },
        { status: 404 }
      );
    }

    // Do a check on the mesocycle. If COMPLETE dont return any upcoming days
    if (mesocycle.status === 'COMPLETE') {
      return NextResponse.json({
        upcomingDays: []
      });
    }

    // Helper function to determine if a day is complete
    type PlanInstanceDay = NonNullable<typeof mesocycle.instances[number]>['days'][number];
    const isDayComplete = (day: PlanInstanceDay) => {
      if (day.planDay.isRestDay) {
        return day.isComplete;
      }
      return day.workoutInstance?.completedAt != null || day.isComplete;
    };

    // Find the current in-progress planInstance first, then fall back to NOT_STARTED if no IN_PROGRESS exists
    const inProgressInstance = mesocycle.instances.find(
      instance => instance.status === 'IN_PROGRESS'
    ) || mesocycle.instances.find(
      instance => instance.status === 'NOT_STARTED'
    );

    type PlanInstanceDayWithMeta = PlanInstanceDay & {
      planInstance: {
        id: number;
        iterationNumber: number | null;
        status: string | null;
        startedAt: Date;
        completedAt: Date | null;
      };
      mesocycle: {
        id: number;
        name: string;
      };
    };

    let upcomingDays: PlanInstanceDayWithMeta[] = [];
    
    if (inProgressInstance) {
      // Get upcoming days from the in-progress instance (days that are not yet complete)
      // Map them to include planInstance and mesocycle properties
      const currentInstanceDays = inProgressInstance.days
        .filter(day => !isDayComplete(day))
        .map(day => ({
          ...day,
          planInstance: {
            id: inProgressInstance.id,
            iterationNumber: inProgressInstance.iterationNumber,
            status: inProgressInstance.status,
            startedAt: inProgressInstance.startedAt,
            completedAt: inProgressInstance.completedAt
          },
          mesocycle: {
            id: mesocycle.id,
            name: mesocycle.name
          }
        })) as PlanInstanceDayWithMeta[];

      // Generate subsequent days by repeating the plan's days for remaining iterations
      const currentIterationNumber = inProgressInstance.iterationNumber || 0;
      
      // Calculate remaining iterations (from currentIterationNumber + 1 to mesocycle.iterations)
      const remainingIterations: number[] = [];
      for (let i = currentIterationNumber + 1; i <= mesocycle.iterations; i++) {
        remainingIterations.push(i);
      }

      // Repeat the plan's days for each remaining iteration
      const subsequentInstanceDays = remainingIterations.flatMap(iterationNumber =>
        mesocycle.plan.days.map(planDay => ({
          id: -1, // Placeholder ID since these days don't exist yet
          planInstanceId: -1, // Placeholder
          planDayId: planDay.id,
          workoutInstanceId: null,
          isComplete: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          planDay: {
            ...planDay,
            planId: mesocycle.plan.id
          },
          workoutInstance: null,
          planInstance: {
            id: -1,
            iterationNumber: iterationNumber,
            status: null,
            startedAt: new Date(),
            completedAt: null
          },
          mesocycle: {
            id: mesocycle.id,
            name: mesocycle.name
          }
        }))
      ) as PlanInstanceDayWithMeta[];

      // Combine current instance incomplete days with all subsequent instance days
      upcomingDays = [...currentInstanceDays, ...subsequentInstanceDays].sort((a, b) => {
        // Sort by iteration number first, then by planDay dayNumber
        const iterA = a.planInstance.iterationNumber || 0;
        const iterB = b.planInstance.iterationNumber || 0;
        if (iterA !== iterB) {
          return iterA - iterB;
        }
        return a.planDay.dayNumber - b.planDay.dayNumber;
      });
    } else {
      // If no instance is in progress, check if we can get upcoming days from the plan structure
      // We'll need to find the next instance to create or use the plan's days as reference
      const lastCompletedInstance = mesocycle.instances
        .filter(instance => instance.status === 'COMPLETE')
        .sort((a, b) => (b.iterationNumber || 0) - (a.iterationNumber || 0))[0];

      if (lastCompletedInstance) {
        console.log("lastCompletedInstance")
        // Determine next iteration number
        const nextIteration = (lastCompletedInstance.iterationNumber || 0) + 1;
        
        // If there are more iterations possible, show upcoming days from the plan
        if (nextIteration <= mesocycle.iterations) {
          console.log("NextIt less than")
          // Generate plan days for all remaining iterations
          const remainingIterations: number[] = [];
          for (let i = nextIteration; i <= mesocycle.iterations; i++) {
            remainingIterations.push(i);
          }
          
          upcomingDays = remainingIterations.flatMap(iterationNumber =>
            mesocycle.plan.days.map((planDay) => ({
              id: -1, // Placeholder ID
              planInstanceId: -1, // Placeholder
              planDayId: planDay.id,
              workoutInstanceId: null,
              isComplete: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              planDay: {
                ...planDay,
                planId: mesocycle.plan.id
              },
              workoutInstance: null,
              planInstance: {
                id: -1,
                iterationNumber: iterationNumber,
                status: null,
                startedAt: new Date(),
                completedAt: null
              },
              mesocycle: {
                id: mesocycle.id,
                name: mesocycle.name
              }
            }))
          ) as PlanInstanceDayWithMeta[];
        } else {
          console.log("empty else")
        }
      } else if (mesocycle.instances.length === 0) {
        console.log("meso instance is 0")
        // No instances yet, show all plan days for all iterations as upcoming
        const allIterations: number[] = [];
        for (let i = 1; i <= mesocycle.iterations; i++) {
          allIterations.push(i);
        }
        
        upcomingDays = allIterations.flatMap(iterationNumber =>
          mesocycle.plan.days.map((planDay) => ({
            id: -1,
            planInstanceId: -1,
            planDayId: planDay.id,
            workoutInstanceId: null,
            isComplete: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            planDay: {
              ...planDay,
              planId: mesocycle.plan.id
            },
            workoutInstance: null,
            planInstance: {
              id: -1,
              iterationNumber: iterationNumber,
              status: null,
              startedAt: new Date(),
              completedAt: null
            },
            mesocycle: {
              id: mesocycle.id,
              name: mesocycle.name
            }
          }))
        ) as PlanInstanceDayWithMeta[];
      } else {
        console.log("Empty else 2")
      }
    }
    console.log("returning: ", upcomingDays.length)
    return NextResponse.json({
      upcomingDays: upcomingDays
    });
  } catch (error) {
    console.error('Error fetching mesocycle upcoming days:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching mesocycle upcoming days', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}


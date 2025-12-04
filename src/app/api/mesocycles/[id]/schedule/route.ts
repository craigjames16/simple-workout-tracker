import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const awaitedParams = await params;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const mesocycleId = parseInt(awaitedParams.id);

    // First, verify the mesocycle exists and belongs to the user
    const mesocycle = await prisma.mesocycle.findFirst({
      where: {
        id: mesocycleId,
        userId: session.user.id
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

    console.log('[Schedule] Mesocycle found:', {
      id: mesocycle.id,
      name: mesocycle.name,
      iterations: mesocycle.iterations,
      instancesCount: mesocycle.instances.length,
      planDaysCount: mesocycle.plan.days.length
    });

    console.log('[Schedule] Instances:', mesocycle.instances.map(i => ({
      id: i.id,
      status: i.status,
      iterationNumber: i.iterationNumber,
      daysCount: i.days.length
    })));

    // Fetch all mesocycles for the user to get completed days from all of them
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const allUserMesocycles = await prisma.mesocycle.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        instances: {
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
              }
            }
          }
        }
      }
    });

    // Collect all planInstanceDays from ALL mesocycles
    const allPlanInstanceDays = allUserMesocycles.flatMap(meso => 
      meso.instances.flatMap(instance => 
        instance.days.map(day => ({
          ...day,
          planInstance: {
            id: instance.id,
            iterationNumber: instance.iterationNumber,
            status: instance.status,
            startedAt: instance.startedAt,
            completedAt: instance.completedAt
          },
          mesocycle: {
            id: meso.id,
            name: meso.name
          }
        }))
      )
    );

    console.log('[Schedule] Total planInstanceDays from all mesocycles:', allPlanInstanceDays.length);

    // Determine if a day is complete
    const isDayComplete = (day: typeof allPlanInstanceDays[0]) => {
      if (day.planDay.isRestDay) {
        return day.isComplete;
      }
      return day.workoutInstance?.completedAt != null || day.isComplete;
    };

    // Filter completed days from the past year and sort by completion date (most recent first)
    const completedDays = allPlanInstanceDays
      .filter(day => {
        if (!isDayComplete(day)) return false;
        
        // Get the completion date for filtering
        const completionDate = day.planDay.isRestDay 
          ? day.updatedAt 
          : (day.workoutInstance?.completedAt || day.updatedAt);
        
        // Only include days from the past year
        return completionDate >= oneYearAgo;
      })
      .sort((a, b) => {
        // For rest days, use updatedAt. For workout days, use workoutInstance completedAt
        const dateA = a.planDay.isRestDay 
          ? a.updatedAt 
          : (a.workoutInstance?.completedAt || a.updatedAt);
        const dateB = b.planDay.isRestDay
          ? b.updatedAt
          : (b.workoutInstance?.completedAt || b.updatedAt);
        return dateB.getTime() - dateA.getTime();
      });

    console.log('[Schedule] Completed days from all mesocycles:', completedDays.length);

    // Find the current in-progress planInstance first, then fall back to NOT_STARTED if no IN_PROGRESS exists
    const inProgressInstance = mesocycle.instances.find(
      instance => instance.status === 'IN_PROGRESS'
    ) || mesocycle.instances.find(
      instance => instance.status === 'NOT_STARTED'
    );

    console.log('[Schedule] In-progress or NOT_STARTED instance:', inProgressInstance ? {
      id: inProgressInstance.id,
      status: inProgressInstance.status,
      iterationNumber: inProgressInstance.iterationNumber,
      daysCount: inProgressInstance.days.length,
      daysDetails: inProgressInstance.days.map(d => ({
        id: d.id,
        isComplete: d.isComplete,
        isRestDay: d.planDay.isRestDay,
        dayNumber: d.planDay.dayNumber,
        workoutInstanceCompleted: d.workoutInstance?.completedAt ? true : false
      }))
    } : null);

    let upcomingDays: typeof allPlanInstanceDays = [];
    
    if (inProgressInstance) {
      console.log('[Schedule] Processing in-progress instance...');
      // Get upcoming days from the in-progress instance (days that are not yet complete)
      // Map them to include planInstance and mesocycle properties to match allPlanInstanceDays structure
      const currentInstanceDays = inProgressInstance.days
        .filter(day => !isDayComplete({
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
        }))
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
        }));
      console.log('[Schedule] Incomplete days in in-progress instance:', currentInstanceDays.length);

      // Generate subsequent days by repeating the plan's days for remaining iterations
      const currentIterationNumber = inProgressInstance.iterationNumber || 0;
      
      // Calculate remaining iterations (from currentIterationNumber + 1 to mesocycle.iterations)
      const remainingIterations: number[] = [];
      for (let i = currentIterationNumber + 1; i <= mesocycle.iterations; i++) {
        remainingIterations.push(i);
      }

      console.log('[Schedule] Current iteration:', currentIterationNumber, 
        'Remaining iterations:', remainingIterations);

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
      ) as typeof allPlanInstanceDays;

      console.log('[Schedule] Generated days from plan for remaining iterations:', subsequentInstanceDays.length,
        `(${remainingIterations.length} iterations × ${mesocycle.plan.days.length} days each)`);

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
      console.log('[Schedule] Total upcoming days after combining:', upcomingDays.length);
    } else {
      console.log('[Schedule] No in-progress instance found, checking for next instance...');
      // If no instance is in progress, check if we can get upcoming days from the plan structure
      // We'll need to find the next instance to create or use the plan's days as reference
      const lastCompletedInstance = mesocycle.instances
        .filter(instance => instance.status === 'COMPLETE')
        .sort((a, b) => (b.iterationNumber || 0) - (a.iterationNumber || 0))[0];

      console.log('[Schedule] Last completed instance:', lastCompletedInstance ? {
        id: lastCompletedInstance.id,
        iterationNumber: lastCompletedInstance.iterationNumber,
        status: lastCompletedInstance.status
      } : null);

      if (lastCompletedInstance) {
        // Determine next iteration number
        const nextIteration = (lastCompletedInstance.iterationNumber || 0) + 1;
        console.log('[Schedule] Next iteration number:', nextIteration, 'Max iterations:', mesocycle.iterations);
        
        // If there are more iterations possible, show upcoming days from the plan
        if (nextIteration <= mesocycle.iterations) {
          console.log('[Schedule] Creating upcoming days from plan structure...');
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
          ) as typeof allPlanInstanceDays;
          console.log('[Schedule] Created', upcomingDays.length, 'upcoming days from plan');
        } else {
          console.log('[Schedule] Next iteration exceeds max iterations, no upcoming days');
        }
      } else if (mesocycle.instances.length === 0) {
        console.log('[Schedule] No instances exist, creating upcoming days from plan for all iterations...');
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
        ) as typeof allPlanInstanceDays;
        console.log('[Schedule] Created', upcomingDays.length, 'upcoming days from plan (all iterations)');
      } else {
        console.log('[Schedule] No completed instances and instances exist, but none are in progress. Instance statuses:', 
          mesocycle.instances.map(i => ({ id: i.id, status: i.status, iterationNumber: i.iterationNumber }))
        );
      }
    }

    console.log('[Schedule] Final response:', {
      previousDaysCount: completedDays.length,
      upcomingDaysCount: upcomingDays.length,
      previousDaysIds: completedDays.map(d => d.id),
      upcomingDaysIds: upcomingDays.map(d => d.id)
    });

    return NextResponse.json({
      previousDays: completedDays,
      upcomingDays: upcomingDays
    });
  } catch (error) {
    console.error('Error fetching mesocycle schedule:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching mesocycle schedule', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}


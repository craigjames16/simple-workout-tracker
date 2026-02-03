import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from "@/lib/getAuthUser"

export async function GET(request: Request) {
  const userId = await getAuthUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all mesocycles for the user to get completed days from all of them
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const allUserMesocycles = await prisma.mesocycle.findMany({
      where: {
        userId: userId
      },
      include: {
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

    return NextResponse.json({
      previousDays: completedDays
    });
  } catch (error) {
    console.error('Error fetching workout history:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching workout history', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}


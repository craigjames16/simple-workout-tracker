import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from "@/lib/getAuthUser"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUser(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const awaitedParams = await params;

  try {
    // First update the workout instance as complete
    const workoutInstance = await prisma.workoutInstance.update({
      where: {
        id: parseInt(awaitedParams.id),
        userId: userId
      },
      data: {
        completedAt: new Date()
      },
      include: {
        planInstanceDays: {
          include: {
            planInstance: {
              include: {
                days: {
                  include: {
                    planDay: true,
                    workoutInstance: true
                  }
                },
                mesocycle: {
                  include: {
                    instances: {
                      include: {
                        days: {
                          include: {
                            planDay: true,
                            workoutInstance: true
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

    // If this workout is part of a mesocycle that hasn't started yet, mark it as started
    if (workoutInstance.planInstanceDays?.[0]?.planInstance?.mesocycle) {
      const mesocycle = workoutInstance.planInstanceDays[0].planInstance.mesocycle;
      if (mesocycle.status === 'NOT_STARTED') {
        await prisma.mesocycle.update({
          where: { id: mesocycle.id },
          data: {
            status: 'IN_PROGRESS',
            startedAt: new Date()
          }
        });
      }
    }

    // If this workout is part of a plan instance day, mark it as complete
    if (workoutInstance.planInstanceDays?.[0]) {
      await prisma.planInstanceDay.update({
        where: { id: workoutInstance.planInstanceDays[0].id },
        data: { isComplete: true }
      });

      const planInstance = workoutInstance.planInstanceDays[0].planInstance;
      if (planInstance) {
        console.log("Updating plan instance");
        // Check if all days in the plan instance are complete
        const allDaysComplete = planInstance.days.every(day => {
          console.log(day.id,day.planDay.isRestDay ? day.isComplete : day.workoutInstance?.completedAt != null)
          return day.planDay.isRestDay ? day.isComplete : day.workoutInstance?.completedAt != null
        }
        );

        if (allDaysComplete) {
          console.log("All days complete", planInstance.id);
          try {
            await prisma.planInstance.update({
              where: { id: planInstance.id },
              data: {
                status: 'COMPLETE',
                completedAt: new Date()
              }
            });
            console.log(`Plan instance ${planInstance.id} marked as COMPLETE.`);

           } catch (error) {
            console.error(`Failed to update plan instance ${planInstance.id}:`, error);
          }

          // If this is part of a mesocycle, check if all instances are complete
          if (planInstance.mesocycle) {
            const allInstancesComplete = planInstance.mesocycle.instances.every(instance => 
              instance.days.every(day => 
                day.planDay.isRestDay ? day.isComplete : day.workoutInstance?.completedAt != null
              )
            );

            if (allInstancesComplete) {
              // Update mesocycle to complete
              await prisma.mesocycle.update({
                where: { id: planInstance.mesocycle.id },
                data: {
                  status: 'COMPLETE',
                  completedAt: new Date()
                }
              });
            }
             
            // Update the first plan instance of the mesocycle to 'IN_PROGRESS'
            const firstPlanInstance = planInstance.mesocycle.instances.find(instance => instance.iterationNumber === 1);
            if (firstPlanInstance && firstPlanInstance.status === 'NOT_STARTED') {
              console.log("Updating first plan instance");
              await prisma.planInstance.update({
                where: { id: firstPlanInstance.id },
                data: {
                  status: 'IN_PROGRESS',
                  startedAt: new Date()
                }
              });
            }
          }
        }

        // Correctly identify the first workout day in the plan instance
        const sortedDays = planInstance.days.sort((a, b) => a.planDay.dayNumber - b.planDay.dayNumber);
        const firstWorkoutDay = sortedDays[0];

        console.log("First workout day", firstWorkoutDay);
        if (firstWorkoutDay && firstWorkoutDay.id === workoutInstance.planInstanceDays[0].id) {
          console.log("Updating plan instance to IN_PROGRESS");
          await prisma.planInstance.update({
            where: { id: workoutInstance.planInstanceDays[0].planInstance.id },
            data: {
              status: 'IN_PROGRESS',
              startedAt: new Date()
            }
          });
        }
      }
    }

    return NextResponse.json(workoutInstance);
  } catch (error) {
    console.error('Error completing workout:', error);
    return NextResponse.json(
      { 
        error: 'Error completing workout', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
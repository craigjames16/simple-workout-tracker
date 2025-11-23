import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  const awaitedParams = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First, get the plan instance day to verify it's a rest day
    const planInstanceDay = await prisma.planInstanceDay.findUnique({
      where: {
        id: parseInt(awaitedParams.dayId),
        planInstance: {
          userId: session.user.id
        }
      },
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
            workout: true,
            exerciseSets: {
              include: {
                exercise: true
              }
            }
          }
        },
        planInstance: true
      }
    });

    if (!planInstanceDay) {
      return NextResponse.json(
        { error: 'Plan instance day not found' },
        { status: 404 }
      );
    }

    if (!planInstanceDay.planDay.isRestDay) {
      return NextResponse.json(
        { error: 'This is not a rest day' },
        { status: 400 }
      );
    }

    // Update the plan instance day to mark it as complete
    const updatedPlanInstanceDay = await prisma.planInstanceDay.update({
      where: {
        id: planInstanceDay.id
      },
      data: {
        isComplete: true
      },
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
            workout: true,
            exerciseSets: {
              include: {
                exercise: true
              }
            }
          }
        },
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
    });

    // Check if all days in the plan instance are complete
    const planInstance = updatedPlanInstanceDay.planInstance;
    if (planInstance) {
      const allDaysComplete = planInstance.days.every(day => {
        return day.planDay.isRestDay 
          ? day.isComplete 
          : day.workoutInstance?.completedAt != null;
      });

      if (allDaysComplete) {
        console.log("All days complete for plan instance", planInstance.id);
        try {
          await prisma.planInstance.update({
            where: { id: planInstance.id },
            data: {
              status: 'COMPLETE',
              completedAt: new Date()
            }
          });
          console.log(`Plan instance ${planInstance.id} marked as COMPLETE.`);

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
              console.log(`Mesocycle ${planInstance.mesocycle.id} marked as COMPLETE.`);
            }
          }
        } catch (error) {
          console.error(`Failed to update plan instance ${planInstance.id}:`, error);
        }
      }
    }

    return NextResponse.json(updatedPlanInstanceDay);
  } catch (error) {
    console.error('Error completing rest day:', error);
    return NextResponse.json(
      { 
        error: 'Error completing rest day', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
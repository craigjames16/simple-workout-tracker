import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from "@/lib/getAuthUser"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  try {
    const awaitedParams = await params;
    
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, check if a workout instance already exists
    const planInstanceDay = await prisma.planInstanceDay.findFirst({
      where: {
        id: parseInt(awaitedParams.dayId),
        planInstance: {
          userId: userId
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
        workoutInstance: true,
        planInstance: {
          include: {
            mesocycle: true
          }
        }
      }
    });

    if (!planInstanceDay) {
      return NextResponse.json(
        { error: 'Plan instance day not found' },
        { status: 404 }
      );
    }

    // If a workout instance already exists, ensure it has mesocycleId if the plan instance has one
    if (planInstanceDay.workoutInstance) {
      // If the plan instance has a mesocycle but the workout instance doesn't, update it
      if (planInstanceDay.planInstance.mesocycleId && !planInstanceDay.workoutInstance.mesocycleId) {
        const updatedWorkoutInstance = await prisma.workoutInstance.update({
          where: { id: planInstanceDay.workoutInstance.id },
          data: {
            mesocycle: {
              connect: { id: planInstanceDay.planInstance.mesocycleId }
            }
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
            workoutExercises: {
              include: {
                exercise: true,
                workout: true
              }
            }
          }
        });
        return NextResponse.json(updatedWorkoutInstance);
      }
      return NextResponse.json(planInstanceDay.workoutInstance);
    }

    if (!planInstanceDay.planDay.workout) {
      return NextResponse.json(
        { error: 'No workout found for this day' },
        { status: 400 }
      );
    }

    if (!planInstanceDay.planInstance.mesocycleId) {
      return NextResponse.json(
        { error: 'No mesocycle found for this plan instance' },
        { status: 400 }
      );
    }

    // Create a new workout instance
    const workoutInstance = await prisma.workoutInstance.create({
      data: {
        user: {
          connect: { id: userId }
        },
        mesocycle: {
          connect: { id: planInstanceDay.planInstance.mesocycleId }
        },
        workout: {
          connect: { id: planInstanceDay.planDay.workout.id }
        },
        planInstanceDays: {
          connect: {
            id: planInstanceDay.id
          }
        },
        workoutExercises: {
          create: planInstanceDay.planDay.workout.workoutExercises.map(workoutExercise => ({
            exercise: {
              connect: { id: workoutExercise.exercise.id }
            },
            order: workoutExercise.order
          }))
        }
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
        workoutExercises: {
          include: {
            exercise: true,
            workout: true
          }
        }
      }
    });

    return NextResponse.json(workoutInstance);
  } catch (error) {
    console.log('Error starting workout:', JSON.stringify(error));
    return NextResponse.json(
      { 
        error: 'Error starting workout', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
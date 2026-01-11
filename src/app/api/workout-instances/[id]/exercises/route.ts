import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from "@/lib/getAuthUser"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUser(request);
  const awaitedParams = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { exerciseId } = await request.json();

    // Get the workout instance
    const workoutInstance = await prisma.workoutInstance.findUnique({
      where: { id: parseInt(awaitedParams.id), userId: userId },
      include: { workout: true },
    });

    if (!workoutInstance) {
      return NextResponse.json(
        { error: 'Workout instance not found' },
        { status: 404 }
      );
    }

    // Get the current highest order for exercises in this workout instance
    const highestOrder = await prisma.workoutExercise.findFirst({
      where: {
        workoutInstanceId: workoutInstance.id,
        workoutInstance: {
          userId: userId
        }
      },
      orderBy: {
        order: 'desc',
      },
      select: {
        order: true,
      },
    });

    const nextOrder = (highestOrder?.order ?? -1) + 1;

    // Add the exercise to the workout instance
    const updatedWorkoutExercise = await prisma.workoutExercise.create({
      data: {
        workoutInstance: { connect: { id: workoutInstance.id } },
        exercise: { connect: { id: exerciseId } },
        // workout: { connect: { id: workoutInstance.workoutId } },
        order: nextOrder,
      },
    });

    // Fetch the updated workout instance with exercises
    const updatedWorkoutInstance = await prisma.workoutInstance.findUnique({
      where: { id: parseInt(awaitedParams.id), userId: userId },
      include: {
        exerciseSets: true,
        workoutExercises: {
          include: {
            exercise: {
              include: {
                adjustments: {
                  where: {
                    completed: false
                  }
                }
              }
            }
          }
        },
        workout: true,
        planInstanceDays: {
          include: {
            planDay: true,
            planInstance: {
              include: {
                mesocycle: true,
              },
            },
          },
        },
      },
    });

    if (!updatedWorkoutInstance) {
      return NextResponse.json(
        { error: 'Workout instance not found' },
        { status: 404 }
      );
    }

    // Add the processed workout instance logic back in
    const processedWorkoutInstance = {
      ...updatedWorkoutInstance,
      workoutExercises: await Promise.all(updatedWorkoutInstance.workoutExercises.map(async ex => {
        // Find the last completed workout instance for this exercise
        const lastCompletedWorkout = await prisma.workoutInstance.findFirst({
          where: {
            id: { not: updatedWorkoutInstance.id }, // Exclude current workout
            completedAt: { not: null },
            workout: {
              workoutExercises: {
                some: {
                  exerciseId: ex.exerciseId
                }
              }
            }
          },
          include: {
            exerciseSets: {
              where: {
                exerciseId: ex.exerciseId
              },
              orderBy: {
                setNumber: 'asc'
              }
            }
          },
          orderBy: {
            completedAt: 'desc'
          }
        });

        return {
          ...ex,
          exercise: {
            ...ex.exercise
          },
          lastSets: lastCompletedWorkout?.exerciseSets || []
        };
      }))
    };

    return NextResponse.json(processedWorkoutInstance);
  } catch (error) {
    console.error('Error adding exercise:', error);
    return NextResponse.json(
      { error: 'Error adding exercise' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUser(request);
  const awaitedParams = await params;
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { exerciseId } = await request.json();

    // First get the workout instance to get its workout ID
    const workoutInstance = await prisma.workoutInstance.findUnique({
      where: {
        id: parseInt(awaitedParams.id),
        userId: userId
      },
      select: {
        workoutId: true,
        id: true,
      },
    });

    if (!workoutInstance) {
      return NextResponse.json(
        { error: 'Workout instance not found' },
        { status: 404 }
      );
    }

    // Delete the exercise from the workout
    await prisma.workoutExercise.deleteMany({
      where: {
        workoutInstanceId: workoutInstance.id,
        exerciseId: exerciseId,
      },
    });

    // Fetch the updated workout instance
    const updatedWorkoutInstance = await prisma.workoutInstance.findUnique({
      where: {
        id: parseInt(awaitedParams.id),
        userId: userId
      },
      include: {
        exerciseSets: true,
        workoutExercises: {
          include: {
            exercise: {
              include: {
                adjustments: {
                  where: {
                    completed: false
                  }
                }
              }
            }
          }
        },
        workout: true,
        planInstanceDays: {
          include: {
            planDay: true,
            planInstance: {
              include: {
                mesocycle: true,
              },
            },
          },
        },
      },
    });

    if (!updatedWorkoutInstance) {
      return NextResponse.json(
        { error: 'Workout instance not found' },
        { status: 404 }
      );
    }

    const processedWorkoutInstance = {
      ...updatedWorkoutInstance,
      workoutExercises: await Promise.all(updatedWorkoutInstance.workoutExercises.map(async ex => {
        // Find the last completed workout instance for this exercise
        const lastCompletedWorkout = await prisma.workoutInstance.findFirst({
          where: {
            id: { not: updatedWorkoutInstance.id }, // Exclude current workout
            completedAt: { not: null },
            workout: {
              workoutExercises: {
                some: {
                  exerciseId: ex.exerciseId
                }
              }
            }
          },
          include: {
            exerciseSets: {
              where: {
                exerciseId: ex.exerciseId
              },
              orderBy: {
                setNumber: 'asc'
              }
            }
          },
          orderBy: {
            completedAt: 'desc'
          }
        });

        return {
          ...ex,
          exercise: {
            ...ex.exercise
          },
          lastSets: lastCompletedWorkout?.exerciseSets || []
        };
      }))
    };

    return NextResponse.json(processedWorkoutInstance);
  } catch (error) {
    console.error('Error removing exercise:', error);
    return NextResponse.json(
      { error: 'Error removing exercise' },
      { status: 500 }
    );
  }
} 
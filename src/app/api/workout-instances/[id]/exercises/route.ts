import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { exerciseId } = await request.json();

    // Get the workout instance
    const workoutInstance = await prisma.workoutInstance.findUnique({
      where: { id: parseInt(params.id) },
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
        workout: { connect: { id: workoutInstance.workoutId } },
        order: nextOrder,
      },
    });

    // Fetch the updated workout instance with exercises
    const updatedWorkoutInstance = await prisma.workoutInstance.findUnique({
      where: { id: parseInt(params.id) },
      include: { workout: true, workoutExercises: { include: { exercise: true } } },
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
      workout: {
        ...updatedWorkoutInstance.workout,
        exercises: await Promise.all(updatedWorkoutInstance.workoutExercises.map(async ex => {
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
                include: {
                  exercise: true
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
      }
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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { exerciseId } = await request.json();

    // First get the workout instance to get its workout ID
    const workoutInstance = await prisma.workoutInstance.findUnique({
      where: {
        id: parseInt(params.id),
      },
      select: {
        workoutId: true,
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
        workoutId: workoutInstance.workoutId,
        exerciseId: exerciseId,
      },
    });

    // Fetch the updated workout instance
    const updatedWorkoutInstance = await prisma.workoutInstance.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        workoutExercises: {
          include: {
            exercise: true
          }
        },
        workout: {
          include: {
            workoutExercises: {
              include: {
                exercise: true,
              },
              orderBy: {
                order: 'asc',
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
      workout: {
        ...updatedWorkoutInstance.workout,
        exercises: await Promise.all(updatedWorkoutInstance.workoutExercises.map(async ex => {
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
      }
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
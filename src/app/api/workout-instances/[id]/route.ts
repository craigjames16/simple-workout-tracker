import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"

interface SetsByNumber {
  [key: number]: {
    weight: number;
    reps: number;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const awaitedParams = await params

  try {
    const workoutInstance = await prisma.workoutInstance.findUnique({
      where: {
        id: parseInt(awaitedParams.id),
        userId: session.user.id
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

    if (!workoutInstance) {
      return NextResponse.json(
        { error: 'Workout instance not found' },
        { status: 404 }
      );
    }

    const processedWorkoutInstance = {
      ...workoutInstance,
      workoutExercises: await Promise.all(workoutInstance.workoutExercises.map(async ex => {
        // Find the last completed workout instance for this exercise
        const lastCompletedWorkout = await prisma.workoutInstance.findFirst({
          where: {
            id: { not: workoutInstance.id }, // Exclude current workout
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
    console.error('Error in workout instance API:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching workout instance', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
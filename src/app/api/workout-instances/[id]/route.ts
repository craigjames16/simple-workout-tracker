import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface SetsByNumber {
  [key: number]: {
    weight: number;
    reps: number;
  };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workoutInstance = await prisma.workoutInstance.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        workout: {
          include: {
            exercises: {
              include: {
                exercise: {
                  include: {
                    sets: true,
                  },
                },
              },
            },
          },
        },
        planInstanceDay: {
          include: {
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
      workout: {
        ...workoutInstance.workout,
        exercises: await Promise.all(workoutInstance.workout.exercises.map(async ex => {
          // Find the last completed workout instance for this exercise
          const lastCompletedWorkout = await prisma.workoutInstance.findFirst({
            where: {
              id: { not: workoutInstance.id }, // Exclude current workout
              completedAt: { not: null },
              workout: {
                exercises: {
                  some: {
                    exerciseId: ex.exerciseId
                  }
                }
              }
            },
            include: {
              sets: {
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
            lastSets: lastCompletedWorkout?.sets || []
          };
        }))
      }
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
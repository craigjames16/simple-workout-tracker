import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
        exercises: workoutInstance.workout.exercises.map(ex => ({
          ...ex,
          exercise: {
            ...ex.exercise,
            lastCompletedSets: ex.exercise.sets?.reduce((acc: SetsByNumber, set) => {
              acc[set.setNumber] = {
                weight: set.weight,
                reps: set.reps
              };
              return acc;
            }, {}) || {}
          }
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
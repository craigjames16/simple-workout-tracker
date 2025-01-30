import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  try {
    const awaitedParams = await params;
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, check if a workout instance already exists
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
        workoutInstance: true
      }
    });

    if (!planInstanceDay) {
      return NextResponse.json(
        { error: 'Plan instance day not found' },
        { status: 404 }
      );
    }

    // If a workout instance already exists, just return it
    if (planInstanceDay.workoutInstance) {
      return NextResponse.json(planInstanceDay.workoutInstance);
    }

    if (!planInstanceDay.planDay.workout) {
      return NextResponse.json(
        { error: 'No workout found for this day' },
        { status: 400 }
      );
    }

    // Create a new workout instance
    const workoutInstance = await prisma.workoutInstance.create({
      data: {
        user: {
          connect: { id: session.user.id }
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
    console.error('Error starting workout:', error);
    return NextResponse.json(
      { 
        error: 'Error starting workout', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
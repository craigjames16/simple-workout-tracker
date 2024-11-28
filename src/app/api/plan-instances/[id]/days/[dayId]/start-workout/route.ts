import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";

export async function POST(
  request: Request,
  { params }: { params: { id: string; dayId: string } }
) {
  
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the plan instance day
    const planInstanceDay = await prisma.planInstanceDay.findUnique({
      where: {
        id: parseInt(params.dayId)
      },
      include: {
        planDay: {
          include: {
            workout: true
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

    if (!planInstanceDay.planDay.workout) {
      return NextResponse.json(
        { error: 'No workout found for this day' },
        { status: 400 }
      );
    }

    if (planInstanceDay.workoutInstanceId) {
      // If workout already started, return existing instance
      const existingWorkout = await prisma.workoutInstance.findUnique({
        where: {
          id: planInstanceDay.workoutInstanceId
        },
        include: {
          workout: {
            include: {
              exercises: {
                include: {
                  exercise: true
                }
              }
            }
          }
        }
      });

      if (!existingWorkout) {
        return NextResponse.json(
          { error: 'Existing workout instance not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ workoutInstance: existingWorkout });
    }

    // Create new workout instance
    const workoutInstance = await prisma.workoutInstance.create({
      data: {
        workoutId: planInstanceDay.planDay.workout.id,
        planInstanceDay: {
          connect: {
            id: planInstanceDay.id
          }
        }
      },
      include: {
        workout: {
          include: {
            exercises: {
              include: {
                exercise: true
              }
            }
          }
        }
      }
    });

    // Update plan instance day with the workout instance
    await prisma.planInstanceDay.update({
      where: {
        id: planInstanceDay.id
      },
      data: {
        workoutInstanceId: workoutInstance.id
      }
    });

    return NextResponse.json({ workoutInstance });
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
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string; dayId: string } }
) {
  try {
    // First, check if a workout instance already exists
    const planInstanceDay = await prisma.planInstanceDay.findUnique({
      where: {
        id: parseInt(params.dayId)
      },
      include: {
        planDay: {
          include: {
            workout: true
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
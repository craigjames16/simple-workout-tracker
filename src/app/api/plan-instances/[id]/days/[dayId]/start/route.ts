import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { PlanInstanceDayWithRelations } from '@/types/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string; dayId: string } }
) {
  try {
    // First, get the plan instance day
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
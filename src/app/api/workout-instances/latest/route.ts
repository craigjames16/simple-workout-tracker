import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const latestWorkout = await prisma.workoutInstance.findFirst({
      where: {
        completedAt: null
      },
      orderBy: {
        startedAt: 'desc'
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
        },
        sets: {
          include: {
            exercise: true
          }
        }
      }
    });

    if (!latestWorkout) {
      return NextResponse.json(
        { error: 'No incomplete workouts found' },
        { status: 404 }
      );
    }

    return NextResponse.json(latestWorkout);
  } catch (error) {
    console.error('Error fetching latest workout:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching latest workout', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
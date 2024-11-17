import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    console.log('Starting workout instance creation...');
    const json = await request.json();
    const { workoutId } = json;

    console.log('Received workoutId:', workoutId);

    if (!workoutId) {
      console.error('No workoutId provided');
      return NextResponse.json(
        { error: 'workoutId is required' },
        { status: 400 }
      );
    }

    const parsedWorkoutId = parseInt(workoutId.toString());

    // First check if there's an existing incomplete workout instance
    const existingInstance = await prisma.workoutInstance.findFirst({
      where: {
        workoutId: parsedWorkoutId,
        completedAt: null
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

    if (existingInstance) {
      console.log('Found existing workout instance:', existingInstance);
      return NextResponse.json(existingInstance);
    }

    console.log('Creating new workout instance...');
    // Create new workout instance if none exists
    const workoutInstance = await prisma.workoutInstance.create({
      data: {
        workoutId: parsedWorkoutId,
        startedAt: new Date(),
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

    console.log('New workout instance created:', workoutInstance);
    return NextResponse.json(workoutInstance);
  } catch (error) {
    console.error('Detailed error creating workout instance:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Error creating workout instance', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
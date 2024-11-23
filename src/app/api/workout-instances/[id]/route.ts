import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const workoutInstance = await prisma.workoutInstance.findUnique({
      where: {
        id: parseInt(params.id)
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
        },
        planInstanceDay: {
          include: {
            planDay: true,
            planInstance: {
              include: {
                mesocycle: true,
                plan: true
              }
            }
          }
        }
      }
    });

    if (!workoutInstance) {
      return NextResponse.json(
        { error: 'Workout instance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(workoutInstance);
  } catch (error) {
    console.error('Error fetching workout instance:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching workout instance', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
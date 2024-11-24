import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.$connect();

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
    console.error('Error in workout instance API:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching workout instance', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 
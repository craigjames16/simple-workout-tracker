import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const workoutInstances = await prisma.workoutInstance.findMany({
      include: {
        workout: true,
        sets: {
          include: {
            exercise: true
          }
        },
        planInstanceDay: {
          include: {
            planInstance: {
              include: {
                plan: true,
                mesocycle: true
              }
            }
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    return NextResponse.json(workoutInstances);
  } catch (error) {
    console.error('Error fetching workout instances:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching workout instances', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
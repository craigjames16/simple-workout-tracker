import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { PlanInstanceDayWithRelations } from '@/types/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string; dayId: string } }
) {
  try {
    const planInstanceDay = await prisma.planInstanceDay.findUnique({
      where: {
        id: parseInt(params.dayId)
      },
      include: {
        planDay: {
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
        },
        workoutInstance: {
          include: {
            workout: true,
            sets: {
              include: {
                exercise: true
              }
            }
          }
        },
        planInstance: true
      }
    });

    if (!planInstanceDay) {
      return NextResponse.json(
        { error: 'Plan instance day not found' },
        { status: 404 }
      );
    }

    // Now TypeScript knows all the properties that are available
    const isRestDay = planInstanceDay.planDay.isRestDay;
    
    return NextResponse.json(planInstanceDay);
  } catch (error) {
    console.error('Error fetching plan instance day:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching plan instance day', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
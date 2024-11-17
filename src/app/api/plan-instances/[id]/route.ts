import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const planInstance = await prisma.planInstance.findUnique({
      where: {
        id: parseInt(params.id)
      },
      include: {
        plan: true,
        days: {
          orderBy: {
            planDay: {
              dayNumber: 'asc'
            }
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
            workoutInstance: true
          }
        }
      }
    });

    if (!planInstance) {
      return NextResponse.json(
        { error: 'Plan instance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(planInstance);
  } catch (error) {
    console.error('Error fetching plan instance:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching plan instance', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
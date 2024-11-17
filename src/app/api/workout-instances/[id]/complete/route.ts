import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { WorkoutInstanceWithRelations } from '@/types/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First, complete the workout instance
    const workoutInstance = await prisma.workoutInstance.update({
      where: {
        id: parseInt(params.id)
      },
      data: {
        completedAt: new Date()
      },
      include: {
        planInstanceDay: {
          include: {
            planDay: {
              include: {
                workout: true
              }
            },
            planInstance: true
          }
        },
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

    if (!workoutInstance.planInstanceDay?.[0]) {
      // If this workout isn't part of a plan, just return the completed workout
      return NextResponse.json(workoutInstance);
    }

    // If this workout is part of a plan, mark the day as complete
    const planInstanceDay = await prisma.planInstanceDay.update({
      where: {
        id: workoutInstance.planInstanceDay[0].id
      },
      data: {
        isComplete: true
      },
      include: {
        planDay: {
          include: {
            workout: true
          }
        },
        planInstance: true
      }
    });

    // Check if all days in the plan are complete
    const planInstance = await prisma.planInstance.findUnique({
      where: {
        id: planInstanceDay.planInstanceId
      },
      include: {
        days: {
          include: {
            planDay: {
              include: {
                workout: true
              }
            },
            workoutInstance: true
          }
        }
      }
    });

    if (!planInstance) {
      throw new Error('Plan instance not found');
    }

    const allDaysComplete = planInstance.days.every(day => {
      const { planDay, workoutInstance, isComplete } = day;
      return planDay.isRestDay ? isComplete : workoutInstance?.completedAt != null;
    });

    if (allDaysComplete) {
      // Update plan instance status to complete
      await prisma.planInstance.update({
        where: {
          id: planInstance.id
        },
        data: {
          status: 'COMPLETE',
          completedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      workoutInstance,
      planInstanceDay,
      planInstanceCompleted: allDaysComplete
    });
  } catch (error) {
    console.error('Error completing workout:', error);
    return NextResponse.json(
      { 
        error: 'Error completing workout', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
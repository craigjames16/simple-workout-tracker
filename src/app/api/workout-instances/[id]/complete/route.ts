import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const workoutInstance = await prisma.workoutInstance.findUnique({
      where: {
        id: parseInt(params.id)
      },
      include: {
        planInstanceDay: {
          include: {
            planInstance: true
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

    const updatedWorkoutInstance = await prisma.workoutInstance.update({
      where: {
        id: workoutInstance.id
      },
      data: {
        completedAt: new Date()
      }
    });

    const planInstanceDay = await prisma.planInstanceDay.findFirst({
      where: {
        workoutInstanceId: workoutInstance.id
      }
    });

    if (planInstanceDay) {
      await prisma.planInstanceDay.update({
        where: {
          id: planInstanceDay.id
        },
        data: {
          isComplete: true
        }
      });

      const planInstance = await prisma.planInstance.findUnique({
        where: {
          id: planInstanceDay.planInstanceId
        },
        include: {
          days: {
            include: {
              workoutInstance: true
            }
          }
        }
      });

      if (planInstance) {
        const allDaysComplete = planInstance.days.every(day => {
          if (day.isRestDay) {
            return day.isComplete;
          } else {
            return day.workoutInstance?.completedAt != null;
          }
        });

        if (allDaysComplete) {
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
      }
    }

    return NextResponse.json(updatedWorkoutInstance);
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
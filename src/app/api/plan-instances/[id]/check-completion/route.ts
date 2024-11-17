import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { PlanInstanceWithCompletion } from '@/types/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Checking completion for plan instance:', params.id);

    const planInstance = await prisma.planInstance.findUnique({
      where: {
        id: parseInt(params.id)
      },
      include: {
        plan: true,
        days: {
          include: {
            planDay: {
              include: {
                workout: true
              }
            },
            workoutInstance: {
              include: {
                workout: true
              }
            }
          }
        }
      }
    }) as PlanInstanceWithCompletion | null;

    if (!planInstance) {
      console.log('Plan instance not found');
      return NextResponse.json(
        { error: 'Plan instance not found' },
        { status: 404 }
      );
    }

    console.log('Plan instance days:', planInstance.days);

    // Check if all days are complete
    const allDaysComplete = planInstance.days.every(day => {
      const { planDay, workoutInstance, isComplete } = day;
      const isDayComplete = planDay.isRestDay ? isComplete : workoutInstance?.completedAt != null;
      
      console.log(`Day ${day.id} completion status:`, {
        isRestDay: planDay.isRestDay,
        isComplete: isComplete,
        workoutCompleted: workoutInstance?.completedAt != null,
        finalStatus: isDayComplete
      });
      
      return isDayComplete;
    });

    console.log('All days complete:', allDaysComplete);

    if (allDaysComplete) {
      console.log('Updating plan instance status to COMPLETE');
      const updatedPlanInstance = await prisma.planInstance.update({
        where: {
          id: planInstance.id
        },
        data: {
          status: 'COMPLETE',
          completedAt: new Date()
        },
        include: {
          plan: true,
          days: {
            include: {
              planDay: {
                include: {
                  workout: true
                }
              },
              workoutInstance: {
                include: {
                  workout: true
                }
              }
            }
          }
        }
      }) as PlanInstanceWithCompletion;

      console.log('Plan instance updated:', updatedPlanInstance);
      return NextResponse.json(updatedPlanInstance);
    }

    return NextResponse.json(planInstance);
  } catch (error) {
    console.error('Error checking plan completion:', error);
    return NextResponse.json(
      { 
        error: 'Error checking plan completion', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
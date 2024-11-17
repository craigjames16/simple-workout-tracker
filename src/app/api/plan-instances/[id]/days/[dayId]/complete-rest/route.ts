import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string; dayId: string } }
) {
  try {
    // Mark the day as complete
    const planInstanceDay = await prisma.planInstanceDay.update({
      where: {
        id: parseInt(params.dayId)
      },
      data: {
        isComplete: true
      }
    });

    // Get the plan instance with all its days
    const planInstance = await prisma.planInstance.findUnique({
      where: {
        id: parseInt(params.id)
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
      // Check if all days are complete
      const allDaysComplete = planInstance.days.every(day => {
        if (day.isRestDay) {
          return day.isComplete;
        } else {
          return day.workoutInstance?.completedAt != null;
        }
      });

      if (allDaysComplete) {
        // Update plan instance to complete
        await prisma.planInstance.update({
          where: {
            id: planInstance.id
          },
          data: {
            status: 'COMPLETE',
            completedAt: new Date()
          }
        });

        // Return the updated plan instance day with completion status
        return NextResponse.json({
          planInstanceDay,
          planInstanceCompleted: true
        });
      }
    }

    return NextResponse.json({ planInstanceDay, planInstanceCompleted: false });
  } catch (error) {
    console.error('Error completing rest day:', error);
    return NextResponse.json(
      { 
        error: 'Error completing rest day', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
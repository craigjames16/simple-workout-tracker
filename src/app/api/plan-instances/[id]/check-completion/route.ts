import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route"; 

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const planInstance = await prisma.planInstance.findUnique({
      where: {
        id: parseInt(params.id)
      },
      include: {
        plan: true,
        mesocycle: true,
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
    });

    if (!planInstance) {
      return NextResponse.json(
        { error: 'Plan instance not found' },
        { status: 404 }
      );
    }

    // Check if all days are complete
    const allDaysComplete = planInstance.days.every(day => {
      return day.planDay.isRestDay ? day.isComplete : day.workoutInstance?.completedAt != null;
    });

    if (allDaysComplete) {
      // Update plan instance status to complete
      const updatedPlanInstance = await prisma.planInstance.update({
        where: {
          id: planInstance.id
        },
        data: {
          status: 'COMPLETE',
          completedAt: new Date()
        }
      });

      // If this is part of a mesocycle, check if all instances are complete
      if (planInstance.mesocycleId) {
        const mesocycle = await prisma.mesocycle.findUnique({
          where: { id: planInstance.mesocycleId },
          include: {
            instances: true
          }
        });

        if (mesocycle && mesocycle.instances.every(i => i.status === 'COMPLETE')) {
          // Update mesocycle status to complete
          await prisma.mesocycle.update({
            where: { id: mesocycle.id },
            data: {
              status: 'COMPLETE',
              completedAt: new Date()
            }
          });

          return NextResponse.json({
            planInstance: updatedPlanInstance,
            mesocycleCompleted: true
          });
        }

        // If there are more iterations, start the next one
        const nextInstance = mesocycle?.instances.find(i => !i.status);
        if (nextInstance) {
          await prisma.planInstance.update({
            where: { id: nextInstance.id },
            data: { status: 'IN_PROGRESS' }
          });
        }
      }

      return NextResponse.json({ planInstance: updatedPlanInstance });
    }

    return NextResponse.json({ planInstance });
  } catch (error) {
    console.error('Error checking completion:', error);
    return NextResponse.json(
      { 
        error: 'Error checking completion', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { planId } = json;

    // Check for existing in-progress plan instance
    const existingInstance = await prisma.planInstance.findFirst({
      where: {
        planId: parseInt(planId),
        status: 'IN_PROGRESS'
      },
      include: {
        days: {
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

    if (existingInstance) {
      return NextResponse.json(existingInstance);
    }

    // Get the plan with its days
    const plan = await prisma.plan.findUnique({
      where: { id: parseInt(planId) },
      include: {
        days: {
          orderBy: {
            dayNumber: 'asc'
          },
          include: {
            workout: true
          }
        }
      }
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Create new plan instance with its days
    const planInstance = await prisma.planInstance.create({
      data: {
        planId: plan.id,
        status: 'IN_PROGRESS',
        days: {
          create: plan.days.map(planDay => ({
            planDayId: planDay.id,
            isComplete: false
          }))
        }
      },
      include: {
        days: {
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

    return NextResponse.json(planInstance);
  } catch (error) {
    console.error('Error creating plan instance:', error);
    return NextResponse.json(
      { 
        error: 'Error creating plan instance', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
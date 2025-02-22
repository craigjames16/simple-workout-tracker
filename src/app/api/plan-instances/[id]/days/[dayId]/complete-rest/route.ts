import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  const awaitedParams = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First, get the plan instance day to verify it's a rest day
    const planInstanceDay = await prisma.planInstanceDay.findUnique({
      where: {
        id: parseInt(awaitedParams.dayId),
        planInstance: {
          userId: session.user.id
        }
      },
      include: {
        planDay: {
          include: {
            workout: {
              include: {
                workoutExercises: {
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
            exerciseSets: {
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

    if (!planInstanceDay.planDay.isRestDay) {
      return NextResponse.json(
        { error: 'This is not a rest day' },
        { status: 400 }
      );
    }

    // Update the plan instance day to mark it as complete
    const updatedPlanInstanceDay = await prisma.planInstanceDay.update({
      where: {
        id: planInstanceDay.id
      },
      data: {
        isComplete: true
      },
      include: {
        planDay: {
          include: {
            workout: {
              include: {
                workoutExercises: {
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
            exerciseSets: {
              include: {
                exercise: true
              }
            }
          }
        },
        planInstance: true
      }
    });

    return NextResponse.json(updatedPlanInstanceDay);
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
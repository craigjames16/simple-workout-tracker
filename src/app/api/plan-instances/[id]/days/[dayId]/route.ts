import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  const awaitedParams = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
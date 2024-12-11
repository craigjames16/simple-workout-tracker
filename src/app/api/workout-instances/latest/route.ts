import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const latestWorkout = await prisma.workoutInstance.findFirst({
      where: {
        completedAt: null,
        userId: session.user.id,
      },
      orderBy: {
        startedAt: 'desc',
      },
      include: {
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
      },
    });

    if (latestWorkout) {
      return NextResponse.json(latestWorkout);
    }

    const currentMesocycle = await prisma.mesocycle.findFirst({
      where: {
        userId: session.user.id,
        status: 'IN_PROGRESS',
      },
      include: {
        instances: {
          where: {
            status: 'IN_PROGRESS',
          },
          include: {
            days: {
              where: {
                isComplete: false,
              },
              orderBy: {
                planDay: {
                  dayNumber: 'asc',
                },
              },
              take: 1,
              include: {
                planDay: {
                  include: {
                    workout: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (
      currentMesocycle &&
      currentMesocycle.instances.length > 0 &&
      currentMesocycle.instances[0].days.length > 0
    ) {
      const nextInstance = currentMesocycle.instances[0];
      const nextDay = nextInstance.days[0];

      return NextResponse.json({
        message: 'Next workout or rest day',
        nextDay: {
          ...nextDay,
          planInstanceId: nextInstance.id,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'No upcoming workouts or rest days found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error fetching latest workout or next day:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching latest workout or next day', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
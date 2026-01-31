import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from "@/lib/getAuthUser"

export async function POST(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const name = json?.name || 'Workout';

    // Create a simple workout first (required for WorkoutInstance)
    const workout = await prisma.workout.create({
      data: {
        name,
        userId: userId,
      },
    });

    // Create the workout instance
    const workoutInstance = await prisma.workoutInstance.create({
      data: {
        workout: {
          connect: { id: workout.id }
        },
        user: {
          connect: { id: userId }
        },
      },
      include: {
        workout: {
          include: {
            workoutExercises: {
              include: {
                exercise: true
              }
            }
          }
        },
        workoutExercises: {
          include: {
            exercise: true,
            workout: true
          }
        }
      }
    });

    return NextResponse.json(workoutInstance);
  } catch (error) {
    console.error('Error creating standalone workout:', error);
    return NextResponse.json(
      { 
        error: 'Error creating standalone workout', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workoutInstances = await prisma.workoutInstance.findMany({
      where: {
        userId: userId
      },
      include: {
        workout: true,
        exerciseSets: {
          include: {
            exercise: true
          }
        },
        planInstanceDays: {
          include: {
            planInstance: {
              include: {
                plan: true,
                mesocycle: true
              }
            }
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    return NextResponse.json(workoutInstances);
  } catch (error) {
    console.log('Error fetching workout instances:', JSON.stringify(error));
    return NextResponse.json(
      { 
        error: 'Error fetching workout instances', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const workoutName = body.name || `Workout ${new Date().toLocaleDateString()}`;

    // Create a Workout record
    const workout = await prisma.workout.create({
      data: {
        name: workoutName,
        userId: userId
      }
    });

    // Create a WorkoutInstance linked to the workout (no mesocycleId, no planInstanceDays)
    const workoutInstance = await prisma.workoutInstance.create({
      data: {
        workoutId: workout.id,
        userId: userId
      },
      include: {
        workout: true,
        exerciseSets: {
          include: {
            exercise: true
          }
        },
        planInstanceDays: {
          include: {
            planInstance: {
              include: {
                plan: true,
                mesocycle: true
              }
            }
          }
        },
        workoutExercises: {
          include: {
            exercise: true,
            workout: true
          }
        }
      }
    });

    return NextResponse.json(workoutInstance);
  } catch (error) {
    console.log('Error creating standalone workout:', JSON.stringify(error));
    return NextResponse.json(
      { 
        error: 'Error creating standalone workout', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
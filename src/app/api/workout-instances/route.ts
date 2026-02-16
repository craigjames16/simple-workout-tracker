import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from "@/lib/getAuthUser"

export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const completed = searchParams.get('completed') === 'true';
    const sinceParam = searchParams.get('since');
    
    // Build where clause
    const whereClause: any = {
      userId: userId
    };

    // Filter for completed workouts if requested
    if (completed) {
      whereClause.completedAt = {
        not: null
      };
    }

    // Filter by date if since parameter is provided
    if (sinceParam) {
      const sinceDate = new Date(sinceParam);
      if (!isNaN(sinceDate.getTime())) {
        if (whereClause.completedAt) {
          // If already filtering by completedAt, combine with date filter
          whereClause.completedAt = {
            ...whereClause.completedAt,
            gte: sinceDate
          };
        } else {
          // If not filtering by completed, still filter by date on completedAt
          whereClause.completedAt = {
            gte: sinceDate
          };
        }
      }
    }

    // Determine order by - use completedAt DESC for completed workouts, startedAt DESC otherwise
    const orderBy = completed 
      ? { completedAt: 'desc' as const }
      : { startedAt: 'desc' as const };

    const workoutInstances = await prisma.workoutInstance.findMany({
      where: whereClause,
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
      },
      orderBy
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
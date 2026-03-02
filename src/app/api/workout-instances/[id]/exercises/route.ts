import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from "@/lib/getAuthUser"

/** Reshape workout instance: nest sets under each workoutExercise, omit top-level exerciseSets */
function reshapeWorkoutInstance(workoutInstance: {
  exerciseSets: Array<{ exerciseId: number; setNumber: number; subSetNumber: number | null; [key: string]: unknown }>;
  workoutExercises: Array<{ exerciseId: number; [key: string]: unknown }>;
  [key: string]: unknown;
}) {
  const { exerciseSets, workoutExercises, ...rest } = workoutInstance;
  const setsByExerciseId = new Map<number, typeof exerciseSets>();
  for (const set of exerciseSets) {
    const list = setsByExerciseId.get(set.exerciseId) ?? [];
    list.push(set);
    setsByExerciseId.set(set.exerciseId, list);
  }
  Array.from(setsByExerciseId.values()).forEach((list) => {
    list.sort((a: { setNumber: number; subSetNumber: number | null }, b: { setNumber: number; subSetNumber: number | null }) => {
      if (a.setNumber !== b.setNumber) return a.setNumber - b.setNumber;
      const aSub = a.subSetNumber ?? -1;
      const bSub = b.subSetNumber ?? -1;
      return aSub - bSub;
    });
  });
  const shapedExercises = workoutExercises.map((ex) => {
    const sets = setsByExerciseId.get(ex.exerciseId) ?? [];
    return { ...ex, sets };
  });
  return { ...rest, workoutExercises: shapedExercises };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUser(request);
  const awaitedParams = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    // Support both single exerciseId and array of exerciseIds
    const exerciseIds = Array.isArray(body.exerciseId) 
      ? body.exerciseId 
      : body.exerciseId 
        ? [body.exerciseId] 
        : body.exerciseIds || [];

    if (exerciseIds.length === 0) {
      return NextResponse.json(
        { error: 'Exercise ID is required' },
        { status: 400 }
      );
    }

    // Validate and parse all exercise IDs
    const parsedExerciseIds: number[] = [];
    for (const id of exerciseIds) {
      const parsed = parseInt(String(id));
      if (isNaN(parsed)) {
        return NextResponse.json(
          { error: `Invalid exercise ID: ${id}` },
          { status: 400 }
        );
      }
      parsedExerciseIds.push(parsed);
    }

    if (parsedExerciseIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one exercise ID is required' },
        { status: 400 }
      );
    }

    // Get the workout instance
    const workoutInstance = await prisma.workoutInstance.findUnique({
      where: { id: parseInt(awaitedParams.id), userId: userId },
      include: { workout: true },
    });

    if (!workoutInstance) {
      return NextResponse.json(
        { error: 'Workout instance not found' },
        { status: 404 }
      );
    }

    // Check if any exercises are already in the workout instance
    const existingExercises = await prisma.workoutExercise.findMany({
      where: {
        workoutInstanceId: workoutInstance.id,
        exerciseId: { in: exerciseIds },
      },
      include: {
        exercise: {
          select: {
            name: true,
          },
        },
      },
    });

    if (existingExercises.length > 0) {
      const existingExerciseNames = existingExercises.map(we => we.exercise.name);
      const existingIds = existingExercises.map(we => we.exerciseId);
      
      // If all exercises are already added
      if (existingExercises.length === exerciseIds.length) {
        return NextResponse.json(
          { 
            error: 'Exercise already added',
            message: existingExerciseNames.length === 1
              ? `${existingExerciseNames[0]} is already in this workout`
              : `These exercises are already in this workout: ${existingExerciseNames.join(', ')}`,
            existingExerciseIds: existingIds,
          },
          { status: 409 } // 409 Conflict
        );
      }
      
      // If some exercises are already added
      return NextResponse.json(
        { 
          error: 'Some exercises already added',
          message: `These exercises are already in this workout: ${existingExerciseNames.join(', ')}`,
          existingExerciseIds: existingIds,
        },
        { status: 409 } // 409 Conflict
      );
    }

    // Get the current highest order for exercises in this workout instance
    const highestOrder = await prisma.workoutExercise.findFirst({
      where: {
        workoutInstanceId: workoutInstance.id,
        workoutInstance: {
          userId: userId
        }
      },
      orderBy: {
        order: 'desc',
      },
      select: {
        order: true,
      },
    });

    let nextOrder = (highestOrder?.order ?? -1) + 1;

    // Add all exercises to the workout instance
    // Use createMany for better performance when adding multiple exercises
    await prisma.workoutExercise.createMany({
      data: parsedExerciseIds.map((parsedExerciseId) => ({
        workoutInstanceId: workoutInstance.id,
        exerciseId: parsedExerciseId,
        order: nextOrder++,
      })),
      skipDuplicates: true, // Skip if exercise already exists in workout
    });

    // Fetch the updated workout instance with exercises and sets
    const updatedWorkoutInstance = await prisma.workoutInstance.findUnique({
      where: { id: parseInt(awaitedParams.id), userId: userId },
      include: {
        exerciseSets: {
          orderBy: [
            { setNumber: 'asc' },
            { subSetNumber: { sort: 'asc', nulls: 'first' } }
          ]
        },
        workoutExercises: {
          include: {
            exercise: {
              include: {
                adjustments: {
                  where: {
                    completed: false
                  }
                }
              }
            }
          }
        },
        workout: true,
        planInstanceDays: {
          include: {
            planDay: true,
            planInstance: {
              include: {
                mesocycle: true,
              },
            },
          },
        },
      },
    });

    if (!updatedWorkoutInstance) {
      return NextResponse.json(
        { error: 'Workout instance not found' },
        { status: 404 }
      );
    }

    const response = reshapeWorkoutInstance(updatedWorkoutInstance as Parameters<typeof reshapeWorkoutInstance>[0]);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error adding exercise:', error);
    return NextResponse.json(
      { 
        error: 'Error adding exercise',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUser(request);
  const awaitedParams = await params;
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { exerciseId } = await request.json();

    if (!exerciseId) {
      return NextResponse.json(
        { error: 'Exercise ID is required' },
        { status: 400 }
      );
    }

    const parsedExerciseId = parseInt(String(exerciseId));
    if (isNaN(parsedExerciseId)) {
      return NextResponse.json(
        { error: 'Invalid exercise ID' },
        { status: 400 }
      );
    }

    // First get the workout instance to get its workout ID
    const workoutInstance = await prisma.workoutInstance.findUnique({
      where: {
        id: parseInt(awaitedParams.id),
        userId: userId
      },
      select: {
        workoutId: true,
        id: true,
      },
    });

    if (!workoutInstance) {
      return NextResponse.json(
        { error: 'Workout instance not found' },
        { status: 404 }
      );
    }

    // Delete the exercise from the workout
    await prisma.workoutExercise.deleteMany({
      where: {
        workoutInstanceId: workoutInstance.id,
        exerciseId: parsedExerciseId,
      },
    });

    // Fetch the updated workout instance with sets
    const updatedWorkoutInstance = await prisma.workoutInstance.findUnique({
      where: {
        id: parseInt(awaitedParams.id),
        userId: userId
      },
      include: {
        exerciseSets: {
          orderBy: [
            { setNumber: 'asc' },
            { subSetNumber: { sort: 'asc', nulls: 'first' } }
          ]
        },
        workoutExercises: {
          include: {
            exercise: {
              include: {
                adjustments: {
                  where: {
                    completed: false
                  }
                }
              }
            }
          }
        },
        workout: true,
        planInstanceDays: {
          include: {
            planDay: true,
            planInstance: {
              include: {
                mesocycle: true,
              },
            },
          },
        },
      },
    });

    if (!updatedWorkoutInstance) {
      return NextResponse.json(
        { error: 'Workout instance not found' },
        { status: 404 }
      );
    }

    const response = reshapeWorkoutInstance(updatedWorkoutInstance as Parameters<typeof reshapeWorkoutInstance>[0]);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error removing exercise:', error);
    return NextResponse.json(
      { error: 'Error removing exercise' },
      { status: 500 }
    );
  }
} 
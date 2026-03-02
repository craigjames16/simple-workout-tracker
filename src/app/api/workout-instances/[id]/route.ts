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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const awaitedParams = await params

  try {
    const workoutInstance = await prisma.workoutInstance.findUnique({
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

    if (!workoutInstance) {
      return NextResponse.json(
        { error: 'Workout instance not found' },
        { status: 404 }
      );
    }

    const response = reshapeWorkoutInstance(workoutInstance as Parameters<typeof reshapeWorkoutInstance>[0]);
    return NextResponse.json(response);
  } catch (error) {
    console.log('Error in workout instance API:', JSON.stringify(error));
    return NextResponse.json(
      { 
        error: 'Error fetching workout instance', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
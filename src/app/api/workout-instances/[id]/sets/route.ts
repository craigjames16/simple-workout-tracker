import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from "@/lib/getAuthUser"


interface SetData {
  reps: number;
  weight: number;
  setNumber: number;
  subSetNumber?: number | null;
  setType?: 'REGULAR' | 'DROP_SET' | 'MYO_REP';
}

interface RequestBody {
  exerciseId: number;
  sets: SetData[];
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
    const json = await request.json() as RequestBody;
    const { exerciseId, sets } = json;

    // First, check if there's a pending adjustment for this exercise
    const pendingAdjustment = await prisma.adjustment.findFirst({
      where: {
        exerciseId,
        userId: userId,
        completed: false
      }
    });

    // Create new sets
    const createdSets = await Promise.all(
      sets.map((set, index) => 
        prisma.exerciseSet.create({
          data: {
            exerciseId: exerciseId,
            workoutInstanceId: parseInt(awaitedParams.id),
            setNumber: set.setNumber,
            subSetNumber: set.subSetNumber ?? null,
            setType: set.setType || 'REGULAR',
            weight: set.weight,
            reps: set.reps,
          }
        })
      )
    );

    // If there was a pending adjustment, mark it as completed
    if (pendingAdjustment) {
      await prisma.adjustment.update({
        where: { id: pendingAdjustment.id },
        data: { completed: true }
      });
    }

    return NextResponse.json(createdSets);
  } catch (error) {
    console.error('Error saving exercise sets:', error);
    return NextResponse.json(
      { 
        error: 'Error saving exercise sets', 
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
    const { setIds, cascade } = await request.json();

    // If cascade is true, find main sets being deleted and delete their sub-sets
    if (cascade) {
      const setsToDelete = await prisma.exerciseSet.findMany({
        where: {
          id: { in: setIds },
          workoutInstanceId: parseInt(awaitedParams.id),
          subSetNumber: null // Only main sets
        },
        select: {
          setNumber: true,
          exerciseId: true
        }
      });

      // Delete sub-sets for each main set being deleted
      for (const set of setsToDelete) {
        await prisma.exerciseSet.deleteMany({
          where: {
            workoutInstanceId: parseInt(awaitedParams.id),
            exerciseId: set.exerciseId,
            setNumber: set.setNumber,
            subSetNumber: { not: null }
          }
        });
      }
    }

    // Delete the requested sets
    await prisma.exerciseSet.deleteMany({
      where: {
        id: {
          in: setIds
        },
        workoutInstanceId: parseInt(awaitedParams.id)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sets:', error);
    return NextResponse.json({ error: 'Failed to delete sets' }, { status: 500 });
  }
} 
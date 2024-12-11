import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


interface SetData {
  reps: number;
  weight: number;
  setNumber: number;
}

interface RequestBody {
  exerciseId: number;
  sets: SetData[];
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const json = await request.json() as RequestBody;
    const { exerciseId, sets } = json;

    // Create new sets
    const createdSets = await Promise.all(
      sets.map((set, index) => 
        prisma.exerciseSet.create({
          data: {
            exerciseId: exerciseId,
            workoutInstanceId: parseInt(params.id),
            setNumber: set.setNumber,
            weight: set.weight,
            reps: set.reps,
          }
        })
      )
    );

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
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { setIds } = await request.json();

    await prisma.exerciseSet.deleteMany({
      where: {
        id: {
          in: setIds
        },
        workoutInstanceId: parseInt(params.id)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sets:', error);
    return NextResponse.json({ error: 'Failed to delete sets' }, { status: 500 });
  }
} 
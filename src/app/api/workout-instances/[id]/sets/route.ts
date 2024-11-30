import { NextResponse } from 'next/server';
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
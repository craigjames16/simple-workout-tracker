import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json();
    const { exerciseId, sets } = json;

    // Delete existing sets for this exercise in this workout instance
    await prisma.exerciseSet.deleteMany({
      where: {
        workoutInstanceId: parseInt(params.id),
        exerciseId: exerciseId
      }
    });

    // Create new sets
    const createdSets = await Promise.all(
      sets.map((set: any, index: number) => 
        prisma.exerciseSet.create({
          data: {
            exerciseId: exerciseId,
            workoutInstanceId: parseInt(params.id),
            setNumber: index + 1,
            weight: parseFloat(set.weight) || 0,
            reps: parseInt(set.reps) || 0,
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
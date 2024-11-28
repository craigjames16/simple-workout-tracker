import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExerciseCategory } from '@prisma/client';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const exercise = await prisma.exercise.findUnique({
      where: {
        id: parseInt(params.id)
      }
    });

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Error fetching exercise:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching exercise', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json();
    const { name, category } = json;

    // Validate category
    if (!Object.values(ExerciseCategory).includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const exercise = await prisma.exercise.update({
      where: {
        id: parseInt(params.id)
      },
      data: {
        name,
        category
      }
    });

    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Error updating exercise:', error);
    return NextResponse.json(
      { 
        error: 'Error updating exercise', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.exercise.delete({
      where: {
        id: parseInt(params.id)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return NextResponse.json(
      { 
        error: 'Error deleting exercise', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
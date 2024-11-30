import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExerciseCategory, Exercise } from '@prisma/client';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const exercises = await prisma.exercise.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { userId: null }
        ]
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    // Group exercises by category
    const exercisesByCategory = Object.values(ExerciseCategory).reduce((acc, category) => {
      acc[category] = exercises.filter((exercise: Exercise) => exercise.category === category);
      return acc;
    }, {} as Record<ExerciseCategory, typeof exercises>);

    return NextResponse.json(exercisesByCategory);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching exercises', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    const exercise = await prisma.exercise.create({
      data: {
        name,
        category,
        userId: session.user.id
      }
    });

    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Error creating exercise:', error);
    return NextResponse.json(
      { 
        error: 'Error creating exercise', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
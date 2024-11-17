import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching exercises from database...');
    const exercises = await prisma.exercise.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    console.log('Exercises fetched:', exercises);
    return NextResponse.json(exercises);
  } catch (error) {
    console.error('Error in exercises API:', error);
    return NextResponse.json(
      { error: 'Error fetching exercises', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const exercise = await prisma.exercise.create({
      data: {
        name: json.name,
      },
    });
    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Error creating exercise:', error);
    return NextResponse.json(
      { error: 'Error creating exercise', details: error.message },
      { status: 500 }
    );
  }
} 
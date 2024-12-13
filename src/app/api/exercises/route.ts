import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from "../auth/[...nextauth]/route";
import { ExerciseCategory } from '@prisma/client'

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const exercises = await prisma.exercise.findMany({
      include: {
        sets: {
          where: {
            workoutInstance: {
              userId: session.user.id
            }
          },
          orderBy: {
            createdAt: 'asc'
          },
          select: {
            id: true,
            weight: true,
            reps: true,
            createdAt: true,
            workoutInstanceId: true,
            workoutInstance: {
              select: {
                completedAt: true
              }
            }
          }
        }
      }
    });

    // Group exercises by category
    const exercisesByCategory = exercises.reduce((acc, exercise) => {
      const category = exercise.category;
      if (!acc[category]) {
        acc[category] = [];
      }

      // Calculate highest weight
      const highestWeight = exercise.sets.reduce((max, set) => {
        return Math.max(max, set.weight);
      }, 0);

      // Create a map to sum volumes by workoutInstanceId
      const volumeMap: Record<string, number> = {};
      exercise.sets.forEach(set => {
        const workoutInstanceId = set.workoutInstanceId;
        const volume = set.reps * set.weight;
        if (!volumeMap[workoutInstanceId]) {
          volumeMap[workoutInstanceId] = 0;
        }
        volumeMap[workoutInstanceId] += volume; // Sum the volume
      });

      // Create a map to organize sets by workoutInstanceId
      const setsByWorkout: Record<string, any[]> = {};
      exercise.sets.forEach(set => {
        const workoutInstanceId = set.workoutInstanceId;
        if (!setsByWorkout[workoutInstanceId]) {
          setsByWorkout[workoutInstanceId] = [];
        }
        setsByWorkout[workoutInstanceId].push(set);
      });

      acc[category].push({
        ...exercise,
        workoutInstances: Object.entries(volumeMap).map(([workoutInstanceId, totalVolume]) => ({
          workoutInstanceId,
          volume: totalVolume,
          completedAt: setsByWorkout[workoutInstanceId][0]?.workoutInstance.completedAt,
          sets: setsByWorkout[workoutInstanceId]
        })),
        highestWeight
      });
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(exercisesByCategory);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
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
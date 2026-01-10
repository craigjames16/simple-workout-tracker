import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from "@/lib/getAuthUser"
import { ExerciseCategory } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const exercises = await prisma.exercise.findMany({
      where: {
        OR: [
          { userId: userId },
          { userId: null }
        ]
      },
      include: {
        sets: {
          where: {
            workoutInstance: {
              userId: userId
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
            setNumber: true,
            workoutInstance: {
              select: {
                completedAt: true,
                mesocycleId: true
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

      // Create a map to organize sets by workoutInstanceId
      const setsByWorkout: Record<string, any[]> = {};
      exercise.sets.forEach(set => {
        const workoutInstanceId = set.workoutInstanceId;
        if (!setsByWorkout[workoutInstanceId]) {
          setsByWorkout[workoutInstanceId] = [];
        }
        setsByWorkout[workoutInstanceId].push({
          ...set,
          setNumber: set.setNumber
        });
      });

      // Calculate volume and create workoutInstances array
      const workoutInstances = Object.entries(setsByWorkout).map(([workoutInstanceId, sets]) => {
        const volume = sets.reduce((total, set) => total + (set.reps * set.weight), 0);
        return {
          workoutInstanceId: parseInt(workoutInstanceId),
          volume,
          completedAt: sets[0]?.workoutInstance.completedAt,
          mesocycleId: sets[0]?.workoutInstance.mesocycleId,
          sets: sets.sort((a, b) => a.setNumber - b.setNumber).map(set => ({
            weight: set.weight,
            reps: set.reps,
            setNumber: set.setNumber
          }))
        };
      });

      acc[category].push({
        ...exercise,
        workoutInstances,
        highestWeight
      });
      return acc;
    }, {} as Record<string, any>);


    return NextResponse.json(exercisesByCategory);
  } catch (error) {
    console.log('Error fetching exercises:', JSON.stringify(error, null, 2));
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getAuthUser(request);
  if (!userId) {
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
        userId: userId
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
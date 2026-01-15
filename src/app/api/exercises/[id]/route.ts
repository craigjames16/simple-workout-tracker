import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';
import { ExerciseCategory } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const exerciseId = parseInt(id);
    if (isNaN(exerciseId)) {
      return NextResponse.json({ error: 'Invalid exercise ID' }, { status: 400 });
    }

    // Fetch exercise with all sets
    const exercise = await prisma.exercise.findFirst({
      where: {
        id: exerciseId,
        OR: [
          { userId: userId },
          { userId: null }
        ]
      },
      include: {
        sets: {
          where: {
            workoutInstance: {
              userId: userId,
              completedAt: {
                not: null
              }
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
                id: true,
                completedAt: true,
                mesocycleId: true
              }
            }
          }
        }
      }
    });

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    // Group sets by workout instance
    const setsByInstance = new Map<number, typeof exercise.sets>();
    
    exercise.sets.forEach(set => {
      const instanceId = set.workoutInstance.id;
      if (!setsByInstance.has(instanceId)) {
        setsByInstance.set(instanceId, []);
      }
      setsByInstance.get(instanceId)!.push(set);
    });

    // Calculate metrics
    let totalSets = exercise.sets.length;
    let totalVolume = 0;
    let maxWeight = 0;
    let maxReps = 0;
    let maxVolume = 0;
    let lastPerformedString: string | null = null;
    const volumeProgression: Array<{
      workoutInstanceId: number;
      date: string;
      volume: number;
      sets: number;
    }> = [];

    exercise.sets.forEach(set => {
      const volume = set.weight * set.reps;
      totalVolume += volume;
      maxWeight = Math.max(maxWeight, set.weight);
      maxReps = Math.max(maxReps, set.reps);
    });

    // Calculate volume per workout instance and find max volume
    setsByInstance.forEach((sets, instanceId) => {
      const instanceVolume = sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
      maxVolume = Math.max(maxVolume, instanceVolume);
      
      const instance = sets[0].workoutInstance;
      const completedAt = instance.completedAt;
      
      if (completedAt !== null) {
        const completedDate = completedAt instanceof Date ? completedAt : new Date(completedAt);
        const completedDateString = completedDate.toISOString();
        
        if (!lastPerformedString || completedDateString > lastPerformedString) {
          lastPerformedString = completedDateString;
        }
        
        volumeProgression.push({
          workoutInstanceId: instanceId,
          date: completedDateString,
          volume: instanceVolume,
          sets: sets.length
        });
      }
    });

    // Sort volume progression by date
    volumeProgression.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Build history array (same structure as ExerciseHistoryModal expects)
    const history = Array.from(setsByInstance.entries())
      .map(([instanceId, sets]) => {
        const instance = sets[0].workoutInstance;
        const volume = sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
        return {
          workoutInstanceId: instanceId,
          volume,
          completedAt: instance.completedAt ? (instance.completedAt instanceof Date ? instance.completedAt.toISOString() : instance.completedAt) : null,
          sets: sets.sort((a, b) => a.setNumber - b.setNumber).map(set => ({
            weight: set.weight,
            reps: set.reps,
            setNumber: set.setNumber
          }))
        };
      })
      .filter(item => item.completedAt !== null)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());

    return NextResponse.json({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      prs: {
        maxWeight,
        maxReps,
        maxVolume
      },
      totalSets,
      totalVolume,
      lastPerformed: lastPerformedString || null,
      volumeProgression,
      history
    });
  } catch (error) {
    console.error('Error fetching exercise detail:', error);
    return NextResponse.json(
      { error: 'Error fetching exercise detail' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const exerciseId = parseInt(id);
    if (isNaN(exerciseId)) {
      return NextResponse.json({ error: 'Invalid exercise ID' }, { status: 400 });
    }

    const json = await request.json();
    const { name, category } = json;

    // Validate category if provided
    if (category && !Object.values(ExerciseCategory).includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Check if exercise exists and belongs to user
    const existingExercise = await prisma.exercise.findFirst({
      where: {
        id: exerciseId,
        OR: [
          { userId: userId },
          { userId: null }
        ]
      }
    });

    if (!existingExercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    // Only allow updating user's own exercises (not global ones)
    if (existingExercise.userId === null) {
      return NextResponse.json(
        { error: 'Cannot modify global exercises' },
        { status: 403 }
      );
    }

    // Update exercise
    const updateData: { name?: string; category?: ExerciseCategory } = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;

    const updatedExercise = await prisma.exercise.update({
      where: { id: exerciseId },
      data: updateData
    });

    return NextResponse.json(updatedExercise);
  } catch (error) {
    console.error('Error updating exercise:', error);
    return NextResponse.json(
      { error: 'Error updating exercise' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const exerciseId = parseInt(id);
    if (isNaN(exerciseId)) {
      return NextResponse.json({ error: 'Invalid exercise ID' }, { status: 400 });
    }

    // Check if exercise exists and belongs to user
    const existingExercise = await prisma.exercise.findFirst({
      where: {
        id: exerciseId,
        OR: [
          { userId: userId },
          { userId: null }
        ]
      }
    });

    if (!existingExercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    // Only allow deleting user's own exercises (not global ones)
    if (existingExercise.userId === null) {
      return NextResponse.json(
        { error: 'Cannot delete global exercises' },
        { status: 403 }
      );
    }

    // Delete exercise (sets will be cascade deleted if foreign key constraints allow)
    await prisma.exercise.delete({
      where: { id: exerciseId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return NextResponse.json(
      { error: 'Error deleting exercise' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { exerciseId } = await request.json();

    // First get the workout instance to get its workout ID
    const workoutInstance = await prisma.workoutInstance.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        workout: true,
      },
    });

    if (!workoutInstance) {
      return NextResponse.json(
        { error: 'Workout instance not found' },
        { status: 404 }
      );
    }

    // Get the current highest order for exercises in this workout
    const highestOrder = await prisma.workoutExercise.findFirst({
      where: {
        workoutId: workoutInstance.workoutId,
      },
      orderBy: {
        order: 'desc',
      },
      select: {
        order: true,
      },
    });

    const nextOrder = (highestOrder?.order ?? -1) + 1;

    // Add the exercise to the workout
    const updatedWorkoutInstance = await prisma.workoutInstance.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        workout: {
          update: {
            exercises: {
              create: {
                exercise: {
                  connect: {
                    id: exerciseId,
                  },
                },
                order: nextOrder,
              },
            },
          },
        },
      },
      include: {
        workout: {
          include: {
            exercises: {
              include: {
                exercise: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedWorkoutInstance);
  } catch (error) {
    console.error('Error adding exercise:', error);
    return NextResponse.json(
      { error: 'Error adding exercise' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { exerciseId } = await request.json();

    // First get the workout instance to get its workout ID
    const workoutInstance = await prisma.workoutInstance.findUnique({
      where: {
        id: parseInt(params.id),
      },
      select: {
        workoutId: true,
      },
    });

    if (!workoutInstance) {
      return NextResponse.json(
        { error: 'Workout instance not found' },
        { status: 404 }
      );
    }

    // Delete the exercise from the workout
    await prisma.workoutExercise.deleteMany({
      where: {
        workoutId: workoutInstance.workoutId,
        exerciseId: exerciseId,
      },
    });

    // Fetch the updated workout instance
    const updatedWorkoutInstance = await prisma.workoutInstance.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        workout: {
          include: {
            exercises: {
              include: {
                exercise: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedWorkoutInstance);
  } catch (error) {
    console.error('Error removing exercise:', error);
    return NextResponse.json(
      { error: 'Error removing exercise' },
      { status: 500 }
    );
  }
} 
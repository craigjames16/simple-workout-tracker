import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workoutId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const userId = session.user.id

    const { exerciseId, direction } = await req.json();
    const awaitedParams = await params;
    
    const workoutInstanceId = parseInt(awaitedParams.workoutId);

    // Get current exercise and its order
    const currentExercise = await prisma.workoutExercise.findFirst({
      where: {
        workoutInstanceId,
        exerciseId,
        workoutInstance: {
          userId,
        },
      },
    });

    if (!currentExercise) {
      return new NextResponse("Exercise not found", { status: 404 });
    }

    // Find the exercise to swap with
    const swapExercise = await prisma.workoutExercise.findFirst({
      where: {
        workoutInstanceId,
        order: direction === 'up' 
          ? currentExercise.order - 1 
          : currentExercise.order + 1,
      },
    });

    if (!swapExercise) {
      return new NextResponse("Cannot move exercise further", { status: 400 });
    }

    // Swap orders in transaction
    await prisma.$transaction([
      prisma.workoutExercise.update({
        where: { id: currentExercise.id },
        data: { order: swapExercise.order },
      }),
      prisma.workoutExercise.update({
        where: { id: swapExercise.id },
        data: { order: currentExercise.order },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WORKOUT_EXERCISE_REORDER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 
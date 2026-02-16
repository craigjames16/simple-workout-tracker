import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from "@/lib/getAuthUser"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  const userId = await getAuthUser(request);
  const awaitedParams = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { setType } = await request.json();

    if (!setType || !['REGULAR', 'DROP_SET', 'MYO_REP'].includes(setType)) {
      return NextResponse.json(
        { error: "Invalid setType. Must be REGULAR, DROP_SET, or MYO_REP" },
        { status: 400 }
      );
    }

    // Verify the set belongs to the user's workout instance
    const existingSet = await prisma.exerciseSet.findFirst({
      where: {
        id: parseInt(awaitedParams.setId),
        workoutInstance: {
          id: parseInt(awaitedParams.id),
          userId: userId
        }
      }
    });

    if (!existingSet) {
      return NextResponse.json(
        { error: "Set not found" },
        { status: 404 }
      );
    }

    // Update the set type
    const updatedSet = await prisma.exerciseSet.update({
      where: {
        id: parseInt(awaitedParams.setId)
      },
      data: {
        setType: setType
      }
    });

    return NextResponse.json(updatedSet);
  } catch (error) {
    console.error('Error updating set type:', error);
    return NextResponse.json(
      { 
        error: 'Error updating set type', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}


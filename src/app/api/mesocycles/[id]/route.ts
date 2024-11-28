import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    const mesocycle = await prisma.mesocycle.findUnique({
      where: {
        id: parseInt(params.id)
      },
      include: {
        plan: true,
        instances: {
          include: {
            days: {
              include: {
                planDay: true,
                workoutInstance: true
              }
            },
            plan: true
          },
          orderBy: {
            iterationNumber: 'asc'
          }
        }
      }
    });

    if (!mesocycle) {
      return NextResponse.json(
        { error: 'Mesocycle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(mesocycle);
  } catch (error) {
    console.error('Error fetching mesocycle:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching mesocycle', 
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
    // First, get all plan instances associated with this mesocycle
    const mesocycle = await prisma.mesocycle.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        instances: {
          include: {
            days: {
              include: {
                workoutInstance: true
              }
            }
          }
        }
      }
    });

    if (!mesocycle) {
      return NextResponse.json(
        { error: 'Mesocycle not found' },
        { status: 404 }
      );
    }

    // Delete everything in a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // For each plan instance
      for (const instance of mesocycle.instances) {
        // For each plan instance day
        for (const day of instance.days) {
          if (day.workoutInstance) {
            // Delete exercise sets
            await tx.exerciseSet.deleteMany({
              where: { workoutInstanceId: day.workoutInstance.id }
            });

            // Delete workout instance
            await tx.workoutInstance.delete({
              where: { id: day.workoutInstance.id }
            });
          }

          // Delete plan instance day
          await tx.planInstanceDay.delete({
            where: { id: day.id }
          });
        }

        // Delete plan instance
        await tx.planInstance.delete({
          where: { id: instance.id }
        });
      }

      // Finally, delete the mesocycle
      await tx.mesocycle.delete({
        where: { id: parseInt(params.id) }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mesocycle:', error);
    return NextResponse.json(
      { 
        error: 'Error deleting mesocycle', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
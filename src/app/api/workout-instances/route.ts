import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from "@/lib/getAuthUser"

export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workoutInstances = await prisma.workoutInstance.findMany({
      where: {
        userId: userId
      },
      include: {
        workout: true,
        exerciseSets: {
          include: {
            exercise: true
          }
        },
        planInstanceDays: {
          include: {
            planInstance: {
              include: {
                plan: true,
                mesocycle: true
              }
            }
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    return NextResponse.json(workoutInstances);
  } catch (error) {
    console.log('Error fetching workout instances:', JSON.stringify(error));
    return NextResponse.json(
      { 
        error: 'Error fetching workout instances', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workoutInstances = await prisma.workoutInstance.findMany({
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
    console.error('Error fetching workout instances:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching workout instances', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
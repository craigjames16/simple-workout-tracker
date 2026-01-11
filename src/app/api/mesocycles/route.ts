import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from "@/lib/getAuthUser"
import { Mesocycle, PlanInstance, PlanInstanceDay, PlanDay, WorkoutInstance } from '@prisma/client';

export async function GET(request: Request) {
  const userId = await getAuthUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const mesocycles = await prisma.mesocycle.findMany({
      where: {
        userId: userId
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
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(mesocycles);
  } catch (error) {
    console.error('Error fetching mesocycles:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching mesocycles', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const userId = await getAuthUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { name, planId, iterations } = json;

    // First, get the plan to access its days
    const plan = await prisma.plan.findUnique({
      where: { id: parseInt(planId), userId: userId },
      include: {
        days: true
      }
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Create the mesocycle
    const mesocycle = await prisma.mesocycle.create({
      data: {
        name,
        userId: userId,
        planId: parseInt(planId),
        iterations,
        status: 'NOT_STARTED',
      },
    });

    // Calculate RIR for each iteration (counting down from iterations-1 to 0)
    const planInstances = await Promise.all(
      Array.from({ length: iterations }, async (_, i) => {
        const iterationNumber = i + 1;
        const rir = Math.min(3, iterations - iterationNumber);
        
        // Create plan instance
        const planInstance = await prisma.planInstance.create({
          data: {
            userId: userId,
            planId: parseInt(planId),
            mesocycleId: mesocycle.id,
            iterationNumber,
            rir,
            status: i === 0 ? 'NOT_STARTED' : null,
            // Create plan instance days for each plan day
            days: {
              create: plan.days.map((planDay: PlanDay) => ({
                planDayId: planDay.id,
                isComplete: false
              }))
            }
          },
          include: {
            days: true
          }
        });

        return planInstance;
      })
    );

    // Return the mesocycle with its instances
    const mesocycleWithInstances = await prisma.mesocycle.findFirst({
      where: {
        id: mesocycle.id,
        userId: userId
      },
      include: {
        plan: true,
        instances: {
          include: {
            days: {
              include: {
                planDay: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(mesocycleWithInstances);
  } catch (error) {
    console.error('Error creating mesocycle:', error);
    return NextResponse.json(
      { 
        error: 'Error creating mesocycle', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
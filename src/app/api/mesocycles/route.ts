import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const mesocycles = await prisma.mesocycle.findMany({
      where: {
        userId: session.user.id
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

    // Update the status of each mesocycle based on instance completion
    const updatedMesocycles = mesocycles.map(mesocycle => {
      const allInstancesComplete = mesocycle.instances.every(instance => 
        instance.days.every(day => 
          day.planDay.isRestDay ? day.isComplete : day.workoutInstance?.completedAt != null
        )
      );

      if (allInstancesComplete) {
        return {
          ...mesocycle,
          status: 'COMPLETE'
        };
      }

      return mesocycle;
    });

    return NextResponse.json(updatedMesocycles);
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
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { name, planId, iterations } = json;

    // First, get the plan to access its days
    const plan = await prisma.plan.findUnique({
      where: { id: parseInt(planId) },
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
        userId: session.user.id,
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
            userId: session.user.id,
            planId: parseInt(planId),
            mesocycleId: mesocycle.id,
            iterationNumber,
            rir,
            status: i === 0 ? 'IN_PROGRESS' : null,
            // Create plan instance days for each plan day
            days: {
              create: plan.days.map(planDay => ({
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
        userId: session.user.id
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
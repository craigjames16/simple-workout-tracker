import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createPlan } from '@/services/planService';

export async function GET() {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const plans = await prisma.plan.findMany({
      where: {
        userId: session.user.id // Add user filtering
      },
      include: {
        days: {
          include: {
            workout: {
              include: {
                workoutExercises: {
                  include: {
                    exercise: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching plans', 
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
    const { name, days } = json;
    const userId = session.user.id;

    const plan = await createPlan({ name, userId, days });

    return NextResponse.json({ 
      plan,
      redirect: '/plans'
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { 
        error: 'Error creating plan', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
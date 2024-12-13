import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

    const userId = session.user.id; // Extract userId from session

    // Create the plan with its days in a transaction
    const plan = await prisma.plan.create({
      data: {
        name,
        userId, // Add userId to plan
        days: {
          create: await Promise.all(days.map(async (day: any, index: number) => {
            if (day.isRestDay) {
              return {
                dayNumber: index + 1,
                isRestDay: true,
              };
            }

            // Create a workout for this day
            const workout = await prisma.workout.create({
              data: {
                name: `${name} - Day ${index + 1}`,
                userId, // Use userId from session
                workoutExercises: {
                  create: day.exercises.map((exercise: any, exerciseIndex: number) => ({
                    exercise: {
                      connect: {
                        id: exercise.id
                      }
                    },
                    order: exerciseIndex
                  }))
                }
              }
            });

            return {
              dayNumber: index + 1,
              isRestDay: false,
              workoutId: workout.id
            };
          }))
        }
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
      }
    });

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
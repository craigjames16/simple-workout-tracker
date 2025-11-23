import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"

interface CreatePlanInstanceRequest {
  planId: string | number;
  mesocycleId?: string | number;
  iterationNumber?: number;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let json: CreatePlanInstanceRequest;
    try {
      json = await request.json() as CreatePlanInstanceRequest;
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    
    if (!json || typeof json !== 'object') {
      return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
    }
    
    const planId = Number(json.planId);
    const mesocycleId = json.mesocycleId ? Number(json.mesocycleId) : undefined;
    const iterationNumber = json.iterationNumber;
    
    if (isNaN(planId)) {
      return NextResponse.json({ error: "Invalid planId" }, { status: 400 });
    }
    
    if (mesocycleId !== undefined && isNaN(mesocycleId)) {
      return NextResponse.json({ error: "Invalid mesocycleId" }, { status: 400 });
    }

    // Check for existing in-progress plan instance
    const existingInstance = await prisma.planInstance.findFirst({
      where: {
        planId: planId,
        userId: session.user.id,
        status: 'IN_PROGRESS'
      },
      include: {
        days: {
          include: {
            planDay: {
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
            },
            workoutInstance: true
          }
        }
      }
    });

    if (existingInstance) {
      return NextResponse.json(existingInstance);
    }

    // Get the plan with its days
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        days: {
          orderBy: {
            dayNumber: 'asc'
          },
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

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const userId = session.user.id; // Extract userId from session

    // Create new plan instance with its days and workout instances in a transaction
    const completePlanInstance = await prisma.$transaction(async (tx) => {
      // Create new plan instance with its days (without workout instances first)
      const planInstance = await tx.planInstance.create({
        data: {
          plan: {
            connect: { id: plan.id } // Connect to existing plan using planId
          },
          user: {
            connect: { id: userId } // Connect to user using userId
          },
          ...(mesocycleId && {
            mesocycle: {
              connect: { id: mesocycleId }
            }
          }),
          ...(iterationNumber !== undefined && {
            iterationNumber
          }),
          status: 'IN_PROGRESS',
          days: {
            create: plan.days.map(planDay => ({
              planDayId: planDay.id,
              isComplete: false,
            }))
          }
        },
        include: {
          days: {
            include: {
              planDay: {
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
          }
        }
      });

      // Now create workout instances for days that have workouts
      for (const day of planInstance.days) {
        if (day.planDay.workout) {
          const workoutInstance = await tx.workoutInstance.create({
            data: {
              user: {
                connect: { id: userId }
              },
              workout: {
                connect: { id: day.planDay.workout.id }
              },
              ...(mesocycleId && {
                mesocycle: {
                  connect: { id: mesocycleId }
                }
              }),
              workoutExercises: {
                create: day.planDay.workout.workoutExercises.map(workoutExercise => ({
                  exercise: {
                    connect: { id: workoutExercise.exercise.id }
                  },
                  order: workoutExercise.order
                }))
              }
            }
          });

          // Connect the workout instance to the plan instance day
          await tx.planInstanceDay.update({
            where: { id: day.id },
            data: {
              workoutInstance: {
                connect: { id: workoutInstance.id }
              }
            }
          });
        }
      }

      // Fetch the complete plan instance with all relations
      return await tx.planInstance.findUnique({
        where: { id: planInstance.id },
        include: {
          days: {
            include: {
              planDay: {
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
              },
              workoutInstance: {
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
          }
        }
      });
    });

    return NextResponse.json(completePlanInstance);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 
                        error && typeof error === 'object' ? JSON.stringify(error) : 
                        String(error || 'Unknown error');
    console.error('Error creating plan instance:', errorMessage);
    return NextResponse.json(
      { 
        error: 'Error creating plan instance', 
        details: errorMessage
      },
      { status: 500 }
    );
  }
} 
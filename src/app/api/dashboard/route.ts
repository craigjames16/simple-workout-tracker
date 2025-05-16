import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"
import { ExerciseCategory } from '@prisma/client';

// Define the SetVolume type at the top of the file
type SetVolume = {
  volume: number;
  date: Date;
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const data = searchParams.get('data');

  if (data === 'muscleGroups') {
    try {
      const exercises = await prisma.exercise.findMany({
        where: {
          OR: [
            { userId: session.user.id },
            { userId: null } // Include default exercises
          ]
        },
        include: {
          sets: {
            where: {
              workoutInstance: {
                userId: session.user.id,
                completedAt: {
                  not: null
                }
              }
            },
            include: {
              workoutInstance: {
                select: {
                  id: true,
                  startedAt: true,
                  completedAt: true
                }
              }
            }
          }
        }
      });
      
      // Organize the data by muscle group and instanceId. E.g {Chest: [{id: 1, volume: 100, date: Date}, {id: 2, volume: 200, date: Date}]}
      const volumeByMuscleGroup = exercises.reduce((acc, exercise) => {
        const muscleGroup = exercise.category;
        
        exercise.sets.forEach(set => {
          const instanceId = set.workoutInstance.id;
          
          if (!acc[muscleGroup]) {
            acc[muscleGroup] = {};
          }
          
          if (!acc[muscleGroup][instanceId]) {
            acc[muscleGroup][instanceId] = {
              volume: 0,
              date: set.workoutInstance.startedAt
            };
          }
          
          acc[muscleGroup][instanceId].volume += set.reps * set.weight;
        });
        
        return acc;
      }, {} as Record<string, Record<string, SetVolume>>);

      // Transform the nested object into the desired array format for the chart
      const formattedVolume = Object.entries(volumeByMuscleGroup).reduce((acc, [category, instances]) => {
        acc[category] = Object.entries(instances).map(([instanceId, data]) => ({
          [instanceId]: data
        }));
        return acc;
      }, {} as Record<string, Array<Record<string, SetVolume>>>);

      return NextResponse.json(formattedVolume);
    } catch (error) {
      console.error('Error fetching muscle groups:', error);
      return NextResponse.json({ error: 'Error fetching muscle groups' }, { status: 500 });
    }
  } else if (data === 'currentMesocycle') {
    try {
      // Get the current mesocycle (IN_PROGRESS with latest date)
      const currentMesocycle = await prisma.mesocycle.findFirst({
        where: {
          userId: session.user.id,
          status: 'IN_PROGRESS'
        },
        include: {
          plan: true,
          instances: {
            include: {
              days: {
                include: {
                  planDay: {
                    include: {
                      workout: true
                    }
                  },
                  workoutInstance: {
                    include: {
                      workoutExercises: {
                        include: {
                          exercise: true
                        }
                      },
                      exerciseSets: true
                    }
                  }
                }
              }
            },
            orderBy: {
              iterationNumber: 'asc'
            }
          }
        },
        orderBy: {
          startedAt: 'desc'
        }
      });

      if (!currentMesocycle) {
        return NextResponse.json({ error: 'No active mesocycle found' }, { status: 404 });
      }

      // Process the data to calculate volumes and progress
      const processedData = {
        id: currentMesocycle.id,
        name: currentMesocycle.name,
        plan: currentMesocycle.plan,
        planDays: currentMesocycle.instances[0].days.map(day => ({
          dayNumber: day.planDay.dayNumber,
          isRestDay: day.planDay.isRestDay,
          workout: day.planDay.workout,
          iterations: currentMesocycle.instances.map(instance => {
            const dayInstance = instance.days.find(d => d.planDayId === day.planDayId);
            if (!dayInstance?.workoutInstance) return null;

            const workoutData = {
              iterationNumber: instance.iterationNumber ?? 0,
              completedAt: dayInstance.workoutInstance.completedAt,
              exercises: dayInstance.workoutInstance.workoutExercises.map(we => {
                const sets = dayInstance.workoutInstance!.exerciseSets.filter(
                  es => es.exerciseId === we.exercise.id
                );
                const volume = sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
                
                // Find previous iteration's volume for this exercise
                const previousIteration = currentMesocycle.instances
                  .filter(i => (i.iterationNumber ?? 0) < (instance.iterationNumber ?? 0))
                  .reverse()
                  .find(i => {
                    const prevDay = i.days.find(d => d.planDayId === day.planDayId);
                    return prevDay?.workoutInstance?.completedAt != null;
                  });

                let previousVolume = 0;
                if (previousIteration) {
                  const prevDay = previousIteration.days.find(d => d.planDayId === day.planDayId);
                  if (prevDay?.workoutInstance) {
                    const prevSets = prevDay.workoutInstance.exerciseSets.filter(
                      es => es.exerciseId === we.exercise.id
                    );
                    previousVolume = prevSets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
                  }
                }

                return {
                  id: we.exercise.id,
                  name: we.exercise.name,
                  category: we.exercise.category,
                  volume,
                  volumeChange: previousVolume ? ((volume - previousVolume) / previousVolume) * 100 : 0,
                  sets: sets.map(set => ({
                    weight: set.weight,
                    reps: set.reps,
                    setNumber: set.setNumber
                  }))
                };
              })
            };

            return workoutData;
          }).filter(Boolean)
        }))
      };

      return NextResponse.json(processedData);
    } catch (error) {
      console.error('Error fetching current mesocycle:', error);
      return NextResponse.json({ error: 'Error fetching current mesocycle' }, { status: 500 });
    }
  } else if (data === 'exercises') {
    try {
      const exercises = await prisma.exercise.findMany({
        where: {
          OR: [
            { userId: session.user.id },
            { userId: null } // Include default exercises
          ]
        },
        include: {
          sets: {
            where: {
              workoutInstance: {
                userId: session.user.id
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });
      return NextResponse.json(exercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      return NextResponse.json({ error: 'Error fetching exercises' }, { status: 500 });
    }
  } else if (data === 'mesocycles') {
    try {
      const mesocycles = await prisma.mesocycle.findMany({
        where: {
          userId: session.user.id
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          plan: true,
          instances: {
            include: {
              days: true
            }
          }
        }
      });
      return NextResponse.json(mesocycles);
    } catch (error) {
      console.error('Error fetching mesocycles:', error);
      return NextResponse.json({ error: 'Error fetching mesocycles' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Invalid data parameter' }, { status: 400 });
  }
} 
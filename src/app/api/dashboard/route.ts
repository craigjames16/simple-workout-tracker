import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from "@/lib/getAuthUser";
import { ExerciseCategory } from '@prisma/client';

type MetricValue = {
  value: number;
  date: Date;
};

type MetricKey = 'volume' | 'count';

type MetricSeries = Record<
  string,
  Array<Record<string, { date: Date } & Partial<Record<MetricKey, number>>>>
>;

const fetchExercisesWithCompletedSets = async (userId: string) => {
  return prisma.exercise.findMany({
    where: {
      OR: [
        { userId },
        { userId: null }
      ]
    },
    include: {
      sets: {
        where: {
          workoutInstance: {
            userId,
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
};

const fetchExercisesWithMesocycleSets = async (userId: string) => {
  return prisma.exercise.findMany({
    where: {
      OR: [
        { userId },
        { userId: null }
      ]
    },
    include: {
      sets: {
        where: {
          workoutInstance: {
            userId,
            completedAt: {
              not: null
            }
            // Removed mesocycleId filter to include standalone workouts
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
};

const buildMuscleGroupMetric = (
  exercises: Awaited<ReturnType<typeof fetchExercisesWithCompletedSets>>,
  valueMapper: (set: (typeof exercises)[number]['sets'][number]) => number
) => {
  return exercises.reduce((acc, exercise) => {
    const muscleGroup = exercise.category;

    exercise.sets.forEach(set => {
      const instanceId = set.workoutInstance.id;

      if (!acc[muscleGroup]) {
        acc[muscleGroup] = {};
      }

      if (!acc[muscleGroup][instanceId]) {
        acc[muscleGroup][instanceId] = {
          value: 0,
          date: set.workoutInstance.startedAt
        };
      }

      acc[muscleGroup][instanceId].value += valueMapper(set);
    });

    return acc;
  }, {} as Record<ExerciseCategory, Record<string, MetricValue>>);
};

const formatMetricResponse = (
  metric: ReturnType<typeof buildMuscleGroupMetric>,
  valueKey: MetricKey
) => {
  return Object.entries(metric).reduce((acc, [category, instances]) => {
    acc[category] = Object.entries(instances).map(([instanceId, data]) => ({
      [instanceId]: {
        [valueKey]: data.value,
        date: data.date
      }
    }));
    return acc;
  }, {} as MetricSeries);
};

export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const data = searchParams.get('data');

  if (data === 'muscleGroupVolume' || data === 'muscleGroups') {
    try {
      const exercises = await fetchExercisesWithCompletedSets(userId);
      const volumeMetric = buildMuscleGroupMetric(exercises, (set) => set.reps * set.weight);
      const formattedVolume = formatMetricResponse(volumeMetric, 'volume');
      return NextResponse.json(formattedVolume);
    } catch (error) {
      console.error('Error fetching muscle group volume:', error);
      return NextResponse.json({ error: 'Error fetching muscle group volume' }, { status: 500 });
    }
  } else if (data === 'muscleGroupSets') {
    try {
      const exercises = await fetchExercisesWithCompletedSets(userId);
      const setMetric = buildMuscleGroupMetric(exercises, () => 1);
      const formattedSets = formatMetricResponse(setMetric, 'count');
      return NextResponse.json(formattedSets);
    } catch (error) {
      console.error('Error fetching muscle group sets:', error);
      return NextResponse.json({ error: 'Error fetching muscle group sets' }, { status: 500 });
    }
  } else if (data === 'exercises') {
    try {
      const exercises = await prisma.exercise.findMany({
        where: {
          OR: [
            { userId: userId },
            { userId: null } // Include default exercises
          ]
        },
        include: {
          sets: {
            where: {
              workoutInstance: {
                userId: userId
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
          userId: userId
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
  } else if (data === 'mesocycle') {
    try {
      const id = searchParams.get('id');
      if (!id) {
        return NextResponse.json({ error: 'No mesocycle id provided' }, { status: 400 });
      }
      const mesocycle = await prisma.mesocycle.findFirst({
        where: {
          userId: userId,
          id: Number(id)
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

      if (!mesocycle) {
        return NextResponse.json({ error: 'Mesocycle not found' }, { status: 404 });
      }

      // Process the data to calculate volumes and progress (same as currentMesocycle)
      // Calculate total volume per iteration (sum of all exercises for all days in each iteration)
      const iterationVolumes = mesocycle.instances.map(instance => {
        let totalVolume = 0;
        instance.days.forEach(day => {
          if (day.workoutInstance) {
            totalVolume += day.workoutInstance.exerciseSets.reduce(
              (sum, set) => sum + (set.weight * set.reps),
              0
            );
          }
        });
        return {
          iterationNumber: instance.iterationNumber ?? 0,
          totalVolume
        };
      });

      const processedData = {
        id: mesocycle.id,
        name: mesocycle.name,
        plan: mesocycle.plan,
        planDays: mesocycle.instances[0].days.map(day => ({
          dayNumber: day.planDay.dayNumber,
          isRestDay: day.planDay.isRestDay,
          workout: day.planDay.workout,
          iterations: mesocycle.instances.map(instance => {
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
                const previousIteration = mesocycle.instances
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
                  order: we.order,
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
        })),
        iterationVolumes
      };
      return NextResponse.json(processedData);
    } catch (error) {
      console.error('Error fetching mesocycle by id:', error);
      return NextResponse.json({ error: 'Error fetching mesocycle by id' }, { status: 500 });
    }
  } else if (data === 'mesocycleMuscleGroupVolume') {
    try {
      const mesocycleId = searchParams.get('mesocycleId');
      let exercises;
      
      if (mesocycleId) {
        // Fetch exercises with sets for a specific mesocycle
        exercises = await prisma.exercise.findMany({
          where: {
            OR: [
              { userId: userId },
              { userId: null }
            ]
          },
          include: {
            sets: {
              where: {
                workoutInstance: {
                  userId: userId,
                  completedAt: {
                    not: null
                  },
                  mesocycleId: parseInt(mesocycleId)
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
      } else {
        // Fetch all mesocycle sets
        exercises = await fetchExercisesWithMesocycleSets(userId);
      }
      
      const volumeMetric = buildMuscleGroupMetric(exercises, (set) => set.reps * set.weight);
      const formattedVolume = formatMetricResponse(volumeMetric, 'volume');
      return NextResponse.json(formattedVolume);
    } catch (error) {
      console.error('Error fetching mesocycle muscle group volume:', error);
      return NextResponse.json({ error: 'Error fetching mesocycle muscle group volume' }, { status: 500 });
    }
  } else if (data === 'mesocycleMuscleGroupSets') {
    try {
      const mesocycleId = searchParams.get('mesocycleId');
      let exercises;
      
      if (mesocycleId) {
        // Fetch exercises with sets for a specific mesocycle
        exercises = await prisma.exercise.findMany({
          where: {
            OR: [
              { userId: userId },
              { userId: null }
            ]
          },
          include: {
            sets: {
              where: {
                workoutInstance: {
                  userId: userId,
                  completedAt: {
                    not: null
                  },
                  mesocycleId: parseInt(mesocycleId)
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
      } else {
        // Fetch all mesocycle sets
        exercises = await fetchExercisesWithMesocycleSets(userId);
      }
      
      const setMetric = buildMuscleGroupMetric(exercises, () => 1);
      const formattedSets = formatMetricResponse(setMetric, 'count');
      return NextResponse.json(formattedSets);
    } catch (error) {
      console.error('Error fetching mesocycle muscle group sets:', error);
      return NextResponse.json({ error: 'Error fetching mesocycle muscle group sets' }, { status: 500 });
    }
  } else if (data === 'exerciseStats') {
    try {
      const exercises = await fetchExercisesWithCompletedSets(userId);
      
      // Process exercises to calculate statistics
      const exerciseStats = exercises.map(exercise => {
        // Group sets by workout instance
        const setsByInstance = new Map<number, typeof exercise.sets>();
        
        exercise.sets.forEach(set => {
          const instanceId = set.workoutInstance.id;
          if (!setsByInstance.has(instanceId)) {
            setsByInstance.set(instanceId, []);
          }
          setsByInstance.get(instanceId)!.push(set);
        });

        // Calculate metrics
        let totalSets = exercise.sets.length;
        let totalVolume = 0;
        let maxWeight = 0;
        let maxReps = 0;
        let maxVolume = 0;
        let lastPerformedString: string | null = null;
        const volumeProgression: Array<{
          workoutInstanceId: number;
          date: string;
          volume: number;
          sets: number;
        }> = [];

        exercise.sets.forEach(set => {
          const volume = set.weight * set.reps;
          totalVolume += volume;
          maxWeight = Math.max(maxWeight, set.weight);
          maxReps = Math.max(maxReps, set.reps);
        });

        // Calculate volume per workout instance and find max volume
        setsByInstance.forEach((sets, instanceId) => {
          const instanceVolume = sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
          maxVolume = Math.max(maxVolume, instanceVolume);
          
          const instance = sets[0].workoutInstance;
          const completedAt = instance.completedAt;
          
          // completedAt is guaranteed to be non-null due to query filter
          if (completedAt !== null) {
            const completedDate = completedAt instanceof Date ? completedAt : new Date(completedAt);
            const completedDateString = completedDate.toISOString();
            
            if (!lastPerformedString || completedDateString > lastPerformedString) {
              lastPerformedString = completedDateString;
            }
            
            volumeProgression.push({
              workoutInstanceId: instanceId,
              date: completedDateString,
              volume: instanceVolume,
              sets: sets.length
            });
          }
        });

        // Sort volume progression by date
        volumeProgression.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        return {
          id: exercise.id,
          name: exercise.name,
          category: exercise.category,
          totalSets,
          totalVolume,
          prs: {
            maxWeight,
            maxReps,
            maxVolume
          },
          lastPerformed: lastPerformedString || null,
          volumeProgression
        };
      });

      // Sort by total sets (descending)
      const sortedExercises = exerciseStats.sort((a, b) => b.totalSets - a.totalSets);
      
      // Get top 3 and all exercises
      const topExercises = sortedExercises.slice(0, 3);
      const allExercises = sortedExercises;

      return NextResponse.json({
        topExercises,
        allExercises
      });
    } catch (error) {
      console.error('Error fetching exercise stats:', error);
      return NextResponse.json({ error: 'Error fetching exercise stats' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Invalid data parameter' }, { status: 400 });
  }
} 
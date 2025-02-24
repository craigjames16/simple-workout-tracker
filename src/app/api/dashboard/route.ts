import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"

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

  try {
    // Get the data parameter from the URL
    const searchParams = request.nextUrl.searchParams;
    const dataType = searchParams.get('data');

    // Base query object for user-specific data
    const baseQuery = { userId: session.user.id };

    switch (dataType) {
      case 'muscleGroups':
        const exercises = await prisma.exercise.findMany({
          where: {
            OR: [
              baseQuery,
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
              include: {
                workoutInstance: {
                  select: {
                    id: true,
                    startedAt: true,
                    completedAt: true,
                    workoutId: true,
                    workout: {
                      select: {
                        name: true
                      }
                    }
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

        // Transform the nested object into the desired array format
        const formattedVolume = Object.entries(volumeByMuscleGroup).reduce((acc, [category, instances]) => {
          acc[category] = Object.entries(instances).map(([instanceId, data]) => ({
            [instanceId]: data
          }));
          return acc;
        }, {} as Record<string, Array<Record<string, SetVolume>>>);

        return NextResponse.json(formattedVolume);

    //   case 'exercises':
    //     const exercises = await prisma.exercise.findMany({
    //       where: {
    //         OR: [
    //           baseQuery,
    //           { userId: null } // Include default exercises
    //         ]
    //       },
    //       include: {
    //         sets: {
    //           where: baseQuery,
    //           orderBy: { createdAt: 'desc' },
    //           take: 5
    //         }
    //       }
    //     });
    //     return NextResponse.json(exercises);

    //   case 'mesocycles':
    //     const mesocycles = await prisma.mesocycle.findMany({
    //       where: baseQuery,
    //       orderBy: { createdAt: 'desc' },
    //       take: 5,
    //       include: {
    //         plan: true,
    //         instances: {
    //           include: {
    //             days: true
    //           }
    //         }
    //       }
    //     });
    //     return NextResponse.json(mesocycles);

      default:
        return NextResponse.json(
          { error: 'Invalid data type specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching dashboard data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
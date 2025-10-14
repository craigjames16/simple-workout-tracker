import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Fetch all exercise sets with related data for the user
    const sets = await prisma.exerciseSet.findMany({
      where: {
        workoutInstance: {
          userId: session.user.id
        }
      },
      include: {
        exercise: true,
        workoutInstance: {
          include: {
            workout: true,
            mesocycle: {
              include: {
                plan: true
              }
            },
            planInstanceDays: {
              include: {
                planInstance: true,
                planDay: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Format data for CSV export
    const csvData = sets.map(set => {
      const workoutInstance = set.workoutInstance;
      const mesocycle = workoutInstance.mesocycle;
      const plan = mesocycle?.plan;
      const planInstanceDay = workoutInstance.planInstanceDays[0];
      const planInstance = planInstanceDay?.planInstance;

      return {
        exercise_name: set.exercise.name,
        exercise_category: set.exercise.category,
        workout_name: workoutInstance.workout.name,
        set_number: set.setNumber,
        weight: set.weight,
        reps: set.reps,
        completed_at: workoutInstance.completedAt ? new Date(workoutInstance.completedAt).toISOString() : '',
        mesocycle_name: mesocycle?.name || '',
        plan_name: plan?.name || '',
        iteration_number: planInstance?.iterationNumber || '',
        day_number: planInstanceDay?.planDay?.dayNumber || '',
        created_at: new Date(set.createdAt).toISOString()
      };
    });

    // Convert to CSV format
    const headers = [
      'exercise_name',
      'exercise_category', 
      'workout_name',
      'set_number',
      'weight',
      'reps',
      'completed_at',
      'mesocycle_name',
      'plan_name',
      'iteration_number',
      'day_number',
      'created_at'
    ];

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="workout-data-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error exporting data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

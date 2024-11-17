import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
    console.log("GET PLAN")
  try {
    const plan = await prisma.plan.findUnique({
      where: {
        id: parseInt(params.id)
      },
      include: {
        instances: {
          where: {
            OR: [
              { status: 'IN_PROGRESS' },
              { status: 'COMPLETE' }
            ]
          }
        },
        days: {
          orderBy: {
            dayNumber: 'asc'
          },
          include: {
            workout: {
              include: {
                exercises: {
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

    console.log(plan)

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching plan', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
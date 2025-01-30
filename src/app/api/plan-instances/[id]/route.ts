import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const awaitedParams = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const planInstance = await prisma.planInstance.findUnique({
      where: {
        id: parseInt(awaitedParams.id),
        userId: session.user.id
      },
      include: {
        plan: true,
        mesocycle: true,
        days: {
          include: {
            planDay: {
              include: {
                workout: true
              }
            },
            workoutInstance: {
              include: {
                workout: true
              }
            }
          }
        }
      }
    });

    if (!planInstance) {
      return NextResponse.json(
        { error: 'Plan instance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(planInstance);
  } catch (error) {
    console.error('Error fetching plan instance:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching plan instance', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
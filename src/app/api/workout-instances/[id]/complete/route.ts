import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const workoutInstance = await prisma.workoutInstance.update({
      where: {
        id: parseInt(params.id)
      },
      data: {
        completedAt: new Date()
      },
      include: {
        planInstanceDay: {
          include: {
            planInstance: true
          }
        }
      }
    });

    return NextResponse.json(workoutInstance);
  } catch (error) {
    console.error('Error completing workout:', error);
    return NextResponse.json(
      { 
        error: 'Error completing workout', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
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
    const planInstance = await prisma.planInstance.update({
      where: {
        id: parseInt(params.id)
      },
      data: {
        status: 'IN_PROGRESS'
      }
    });

    return NextResponse.json(planInstance);
  } catch (error) {
    console.error('Error starting plan instance:', error);
    return NextResponse.json(
      { 
        error: 'Error starting plan instance', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
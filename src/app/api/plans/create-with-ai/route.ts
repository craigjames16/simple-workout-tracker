import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/getAuthUser';
import { createPlanWithAI } from '@/services/aiPlanService';

export async function POST(request: Request) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, planId } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await createPlanWithAI(prompt, userId, planId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      plan: result.plan,
      message: 'Plan created successfully'
    });
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : 'Unexpected error';

    console.error('Error in create-with-ai API:', message);
    return NextResponse.json(
      { error: 'Error processing request', details: message },
      { status: 500 }
    );
  }
}


import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { prisma } from '@/lib/prisma';
import { PlanSchema, type Plan } from '@/types/plan-ai';
import { createPlan } from './planService';
import type { DayInput } from './planService';

interface ExercisesByCategory {
  [category: string]: Array<{ name: string; id: number }>;
}

/**
 * Get all exercises for a user and group them by category
 */
export async function getExercisesByCategory(userId: string): Promise<ExercisesByCategory> {
  const exercises = await prisma.exercise.findMany({
    where: {
      OR: [
        { userId: userId },
        { userId: null } // Include default exercises
      ]
    }
  });

  const exercisesByCategory: ExercisesByCategory = {};
  for (const exercise of exercises) {
    const category = exercise.category;
    if (!exercisesByCategory[category]) {
      exercisesByCategory[category] = [];
    }
    exercisesByCategory[category].push({
      name: exercise.name,
      id: exercise.id
    });
  }

  return exercisesByCategory;
}

/**
 * Generate the system prompt for the AI agent
 */
export async function buildSystemPrompt(
  exercisesByCategory: ExercisesByCategory,
  existingPlan?: any
): Promise<string> {
  const exercisesJson = JSON.stringify(exercisesByCategory, null, 2);
  
  const existingPlanSection = existingPlan
    ? `\nHere is the current plan structure that needs to be updated. Make only the changes necessary to match the user's prompt. Change the name to something appropriate (maybe include a version number):\n${JSON.stringify(existingPlan, null, 2)}\n`
    : '';

  const basePrompt = `You are an expert fitness coach specializing in creating personalized workout plans. Your task is to create a comprehensive workout plan that aligns with the user's goals and available exercises.

${existingPlanSection}Create a ${existingPlan ? 'revised' : 'new'} workout plan following these specific guidelines:

1. Exercise Selection and Volume:
   - Each workout should contain 3-6 exercises
   - For focused muscle groups: include 4-7 exercises targeting that area
   - Only use exercises from the provided list:
   ${exercisesJson}

2. Workout Structure:
   - Begin with compound movements, followed by isolation exercises

3. Recovery and Rest:
   - Strategically place rest days to prevent overtraining
   - Ensure adequate recovery between similar muscle groups
   - Consider the intensity and volume of each workout

Your response should be structured as a complete workout plan that matches the user's prompt.`;

  return basePrompt;
}

/**
 * Transform OpenAI Plan response to match createPlan service input format
 */
function transformPlanToCreatePlanInput(plan: Plan): { name: string; days: DayInput[] } {
  const days: DayInput[] = plan.PlanDay.map((day) => {
    if (day.isRestDay) {
      return {
        isRestDay: true
      };
    }

    return {
      isRestDay: false,
      workoutExercises: day.workout.workoutExercises.map((we) => ({
        id: we.exercise.id,
        order: we.order
      }))
    };
  });

  return {
    name: plan.name,
    days
  };
}

/**
 * Creates a structured workout plan using OpenAI
 */
export async function createPlanWithAI(
  userPrompt: string,
  userId: string,
  planId?: string
): Promise<{ success: boolean; plan?: any; error?: string }> {
  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return {
        success: false,
        error: `User with ID ${userId} not found`
      };
    }

    // Get exercises from database
    const exercisesByCategory = await getExercisesByCategory(userId);

    // If plan_id is provided, get the existing plan as reference
    let existingPlan = null;
    if (planId) {
      const plan = await prisma.plan.findUnique({
        where: { id: parseInt(planId) },
        include: {
          days: {
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
        return {
          success: false,
          error: 'Reference plan not found'
        };
      }

      existingPlan = plan;
    }

    // Build system prompt
    const systemPrompt = await buildSystemPrompt(exercisesByCategory, existingPlan);

    // Initialize OpenAI client
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OPENAI_API_KEY is not configured'
      };
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Call OpenAI with structured output
    // @ts-ignore - parse method exists but types may not be fully updated
    const completion = await client.chat.completions.parse({
      model: 'gpt-4o-2024-08-06',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: zodResponseFormat(PlanSchema, 'plan')
    });

    const message = completion.choices[0]?.message;
    
    // Check for refusal
    if (message?.refusal) {
      return {
        success: false,
        error: `Model refused the request: ${message.refusal}`
      };
    }

    // Extract parsed plan
    if (!message?.parsed) {
      return {
        success: false,
        error: 'Failed to parse plan from OpenAI response'
      };
    }

    const parsedPlan = message.parsed;

    // Transform to createPlan input format
    const { name, days } = transformPlanToCreatePlanInput(parsedPlan);

    // Create the plan using existing service
    const createdPlan = await createPlan({
      name,
      userId,
      days
    });

    return {
      success: true,
      plan: createdPlan
    };
  } catch (error: any) {
    // Handle OpenAI-specific errors
    // Check for error type by name since TypeScript types may not be fully updated
    if (error?.constructor?.name === 'LengthFinishReasonError') {
      return {
        success: false,
        error: 'Response truncated due to length. Please try a shorter prompt.'
      };
    }
    
    if (error?.constructor?.name === 'ContentFilterFinishReasonError') {
      return {
        success: false,
        error: 'Content was blocked by content filter. Please try a different prompt.'
      };
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error creating plan with AI:', error);
    
    return {
      success: false,
      error: `Error creating plan: ${errorMessage}`
    };
  }
}


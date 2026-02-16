import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from "@/lib/getAuthUser"

/**
 * History endpoint - DEPRECATED
 * This endpoint is kept for backward compatibility but now redirects to the workout-instances endpoint.
 * The frontend should use GET /api/workout-instances?completed=true&since=YYYY-MM-DD instead.
 */
export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Calculate date one year ago
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const sinceDate = oneYearAgo.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    // Redirect to workout-instances endpoint with appropriate query parameters
    const baseUrl = request.nextUrl.origin;
    const workoutInstancesUrl = new URL(`${baseUrl}/api/workout-instances`);
    workoutInstancesUrl.searchParams.set('completed', 'true');
    workoutInstancesUrl.searchParams.set('since', sinceDate);

    // Fetch from the workout-instances endpoint
    const response = await fetch(workoutInstancesUrl.toString(), {
      headers: {
        'Cookie': request.headers.get('Cookie') || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workout instances: ${response.statusText}`);
    }

    const workoutInstances = await response.json();

    // Return in the old format for backward compatibility
    // Note: This format is deprecated. New code should use workoutInstances directly.
    return NextResponse.json({
      workoutInstances: Array.isArray(workoutInstances) ? workoutInstances : [],
      // Legacy format for backward compatibility (if needed)
      previousDays: []
    });
  } catch (error) {
    console.error('Error fetching workout history:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching workout history', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}


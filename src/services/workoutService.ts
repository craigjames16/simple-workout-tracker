export interface WorkoutInstance {
  id: number;
  workoutId: number;
  startedAt: string;
  completedAt: string | null;
  workout: {
    id: number;
    name: string;
  };
  workoutExercises?: any[];
  exerciseSets?: any[];
  planInstanceDays?: any[];
}

/**
 * Create a standalone workout instance (not attached to a plan or mesocycle)
 * @param name Optional workout name. Defaults to "Workout" + current date
 * @returns The created workout instance
 */
export async function createStandaloneWorkout(name?: string): Promise<WorkoutInstance> {
  const response = await fetch('/api/workout-instances', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(name ? { name } : {}),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create workout' }));
    throw new Error(error.error || 'Failed to create workout');
  }

  return response.json();
}


import { Prisma } from '.prisma/client';
import { ExerciseCategory } from '@prisma/client';

// Plan Instance Day with all relations
export type PlanInstanceDayWithRelations = Prisma.PlanInstanceDayGetPayload<{
  include: {
    planDay: {
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
    workoutInstance: {
      include: {
        workout: true
        exerciseSets: {
          include: {
            exercise: true
          }
        }
      }
    }
    planInstance: true
  }
}>;

// Plan with all relations
export type PlanWithRelations = Prisma.PlanGetPayload<{
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
}>;

// Workout Instance with all relations
export interface WorkoutInstanceWithRelations {
  id: number;
  completedAt: string | null;
  workoutExercises: Array<{
    id: number;
    name: string;
    category: ExerciseCategory;
    sets?: Array<{
      setNumber: number;
      weight: number;
      reps: number;
    }>;
  }>;
  workout: {
    id: number;
    name: string;
    workoutExercises: Array<{
      exercise: {
        id: number;
        name: string;
        category: ExerciseCategory;
        sets?: Array<{
          setNumber: number;
          weight: number;
          reps: number;
        }>;
      };
    }>;
  };
  planInstanceDays?: Array<{
    planDayId: number;
    planDay: {
      dayNumber: number; 
    };
    planInstance: {
      iterationNumber?: number;
      id: number;
      rir?: number;
      mesocycle?: {
        id: number;
        name: string;
      };
    };
  }>;
  mesocycleId: number;
}

// Update the PlanInstanceWithCompletion type to include the plan relation
export type PlanInstanceWithCompletion = Prisma.PlanInstanceGetPayload<{
  include: {
    plan: true,
    mesocycle: true,
    days: {
      include: {
        planDay: {
          include: {
            workout: true
          }
        }
        workoutInstance: {
          include: {
            workout: true
          }
        }
      }
    }
  }
}>;

// For workout creation/fetching
export type WorkoutWithExercises = Prisma.WorkoutGetPayload<{
  include: {
    workoutExercises: {
      include: {
        exercise: true
      }
    }
  }
}>;

// For plan creation/fetching
export type PlanWithDays = Prisma.PlanGetPayload<{
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
    instances: {
      where: {
        OR: [
          { status: 'IN_PROGRESS' },
          { status: 'COMPLETE' }
        ]
      }
    }
  }
}>;

// For exercise sets
export type ExerciseSetWithRelations = Prisma.ExerciseSetGetPayload<{
  include: {
    exercise: true
    workoutInstance: {
      include: {
        workout: true
      }
    }
  }
}>;

// Add new types for Mesocycles
export type MesocycleWithRelations = Prisma.MesocycleGetPayload<{
  include: {
    plan: true
    instances: {
      include: {
        plan: true
      }
    }
  }
}>; 
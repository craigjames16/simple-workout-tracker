import { prisma } from "@/lib/prisma"

/** CSV of all exercise sets for a user (GET /api/export/sets). */
export async function buildSetsCsvForUser(userId: string): Promise<string> {
  const sets = await prisma.exerciseSet.findMany({
    where: {
      workoutInstance: { userId },
    },
    include: {
      exercise: true,
      workoutInstance: {
        include: {
          workout: true,
          mesocycle: {
            include: {
              plan: true,
            },
          },
          planInstanceDays: {
            include: {
              planInstance: true,
              planDay: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  const csvData = sets.map((set) => {
    const workoutInstance = set.workoutInstance
    const mesocycle = workoutInstance.mesocycle
    const plan = mesocycle?.plan
    const planInstanceDay = workoutInstance.planInstanceDays[0]
    const planInstance = planInstanceDay?.planInstance

    return {
      exercise_name: set.exercise.name,
      exercise_category: set.exercise.category,
      workout_name: workoutInstance.workout.name,
      set_number: set.setNumber,
      weight: set.weight,
      reps: set.reps,
      completed_at: workoutInstance.completedAt
        ? new Date(workoutInstance.completedAt).toISOString()
        : "",
      mesocycle_name: mesocycle?.name || "",
      plan_name: plan?.name || "",
      iteration_number: planInstance?.iterationNumber ?? "",
      day_number: planInstanceDay?.planDay?.dayNumber ?? "",
      created_at: new Date(set.createdAt).toISOString(),
    }
  })

  const headers = [
    "exercise_name",
    "exercise_category",
    "workout_name",
    "set_number",
    "weight",
    "reps",
    "completed_at",
    "mesocycle_name",
    "plan_name",
    "iteration_number",
    "day_number",
    "created_at",
  ] as const

  const escapeCell = (value: unknown): string => {
    if (value === null || value === undefined) return ""
    const s = String(value)
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  return [
    headers.join(","),
    ...csvData.map((row) =>
      headers.map((h) => escapeCell(row[h as keyof typeof row])).join(",")
    ),
  ].join("\n")
}

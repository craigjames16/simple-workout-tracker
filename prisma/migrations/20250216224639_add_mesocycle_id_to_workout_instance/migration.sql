-- AlterTable
ALTER TABLE "WorkoutInstance" ADD COLUMN     "mesocycleId" INTEGER;

-- AddForeignKey
ALTER TABLE "WorkoutInstance" ADD CONSTRAINT "WorkoutInstance_mesocycleId_fkey" FOREIGN KEY ("mesocycleId") REFERENCES "Mesocycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update existing WorkoutInstance rows to set mesocycleId
UPDATE "WorkoutInstance" wi
SET "mesocycleId" = (
    SELECT pi."mesocycleId"
    FROM "PlanInstanceDay" pid
    JOIN "PlanInstance" pi ON pid."planInstanceId" = pi.id
    WHERE pid."workoutInstanceId" = wi.id
    AND pi."mesocycleId" IS NOT NULL
    LIMIT 1
)
WHERE "mesocycleId" IS NULL;

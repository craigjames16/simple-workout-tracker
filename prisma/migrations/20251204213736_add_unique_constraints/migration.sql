/*
  Warnings:

  - A unique constraint covering the columns `[workoutInstanceId,exerciseId,setNumber]` on the table `ExerciseSet` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[planId,mesocycleId,iterationNumber]` on the table `PlanInstance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ExerciseSet_workoutInstanceId_exerciseId_setNumber_key" ON "ExerciseSet"("workoutInstanceId", "exerciseId", "setNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PlanInstance_planId_mesocycleId_iterationNumber_key" ON "PlanInstance"("planId", "mesocycleId", "iterationNumber");

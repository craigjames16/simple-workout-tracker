/*
  Warnings:

  - A unique constraint covering the columns `[workoutInstanceId,exerciseId]` on the table `WorkoutExercise` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `workoutInstanceId` to the `WorkoutExercise` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "WorkoutExercise_workoutId_exerciseId_key";

-- AlterTable
ALTER TABLE "WorkoutExercise" ADD COLUMN "workoutInstanceId" INTEGER;

-- Update existing rows with the appropriate workoutInstanceId
UPDATE "WorkoutExercise" 
SET "workoutInstanceId" = (
    SELECT "id" FROM "WorkoutInstance" 
    WHERE "WorkoutInstance"."workoutId" = "WorkoutExercise"."workoutId" 
    LIMIT 1
);

-- Alter the column to set it as NOT NULL now that it has values
ALTER TABLE "WorkoutExercise" ALTER COLUMN "workoutInstanceId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutExercise_workoutInstanceId_exerciseId_key" ON "WorkoutExercise"("workoutInstanceId", "exerciseId");

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_workoutInstanceId_fkey" FOREIGN KEY ("workoutInstanceId") REFERENCES "WorkoutInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

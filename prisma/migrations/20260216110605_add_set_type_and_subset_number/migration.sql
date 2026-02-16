-- CreateEnum
CREATE TYPE "SetType" AS ENUM ('REGULAR', 'DROP_SET', 'MYO_REP');

-- AlterTable
ALTER TABLE "ExerciseSet" ADD COLUMN "setType" "SetType" NOT NULL DEFAULT 'REGULAR';
ALTER TABLE "ExerciseSet" ADD COLUMN "subSetNumber" INTEGER;

-- DropIndex
DROP INDEX IF EXISTS "ExerciseSet_workoutInstanceId_exerciseId_setNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseSet_workoutInstanceId_exerciseId_setNumber_subSetNumber_key" ON "ExerciseSet"("workoutInstanceId", "exerciseId", "setNumber", "subSetNumber");


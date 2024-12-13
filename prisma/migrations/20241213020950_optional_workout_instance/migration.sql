-- DropForeignKey
ALTER TABLE "WorkoutExercise" DROP CONSTRAINT "WorkoutExercise_workoutInstanceId_fkey";

-- AlterTable
ALTER TABLE "WorkoutExercise" ALTER COLUMN "workoutInstanceId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_workoutInstanceId_fkey" FOREIGN KEY ("workoutInstanceId") REFERENCES "WorkoutInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

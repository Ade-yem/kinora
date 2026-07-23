/*
  Warnings:

  - You are about to drop the column `chat_session_id` on the `workout_routines` table. All the data in the column will be lost.
  - You are about to drop the column `finalized_at` on the `workout_routines` table. All the data in the column will be lost.
  - You are about to drop the column `review_notes` on the `workout_routines` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `workout_routines` table. All the data in the column will be lost.
  - You are about to drop the column `total_days` on the `workout_routines` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `workout_routines` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[program_id,day_index]` on the table `workout_routines` will be added. If there are existing duplicate values, this will fail.
  - Made the column `program_id` on table `workout_routines` required. This step will fail if there are existing NULL values in that column.
  - Made the column `day_index` on table `workout_routines` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "workout_routines" DROP CONSTRAINT IF EXISTS "workout_routines_chat_session_id_fkey";

-- DropForeignKey
ALTER TABLE "workout_routines" DROP CONSTRAINT IF EXISTS "workout_routines_user_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "workout_routines_user_id_status_idx";

-- AlterTable
ALTER TABLE "workout_routines" DROP COLUMN IF EXISTS "chat_session_id",
DROP COLUMN IF EXISTS "finalized_at",
DROP COLUMN IF EXISTS "review_notes",
DROP COLUMN IF EXISTS "status",
DROP COLUMN IF EXISTS "total_days",
DROP COLUMN IF EXISTS "user_id",
ALTER COLUMN "program_id" SET NOT NULL,
ALTER COLUMN "day_index" SET NOT NULL;

-- CreateTable
CREATE TABLE "workout_programs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "chat_session_id" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "status" "RoutineStatus" NOT NULL DEFAULT 'PENDING_GENERATION',
    "review_notes" JSONB,
    "finalized_at" TIMESTAMP(3),
    "total_days" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_programs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workout_programs_user_id_status_idx" ON "workout_programs"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "workout_routines_program_id_day_index_key" ON "workout_routines"("program_id", "day_index");

-- AddForeignKey
ALTER TABLE "workout_programs" ADD CONSTRAINT "workout_programs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_programs" ADD CONSTRAINT "workout_programs_chat_session_id_fkey" FOREIGN KEY ("chat_session_id") REFERENCES "chat_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_routines" ADD CONSTRAINT "workout_routines_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "workout_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

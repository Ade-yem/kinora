/*
  Warnings:

  - You are about to drop the column `equipment` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `goal` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `injuries` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `injuries_notes` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `session_duration_minutes` on the `user_profiles` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "InjurySeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE');

-- CreateEnum
CREATE TYPE "InjuryStatus" AS ENUM ('ACTIVE', 'RECOVERING', 'RESOLVED');

-- AlterTable
ALTER TABLE "chat_sessions" ADD COLUMN     "equipment" TEXT[],
ADD COLUMN     "location" "Location",
ADD COLUMN     "session_duration_minutes" INTEGER;

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "equipment",
DROP COLUMN "goal",
DROP COLUMN "injuries",
DROP COLUMN "injuries_notes",
DROP COLUMN "location",
DROP COLUMN "session_duration_minutes",
ADD COLUMN     "biological_sex" TEXT,
ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "experience_level" TEXT,
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "preferred_location" "Location",
ADD COLUMN     "weight" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "user_injuries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "body_part" TEXT NOT NULL,
    "severity" "InjurySeverity" NOT NULL,
    "note" TEXT,
    "onset_date" TIMESTAMP(3),
    "status" "InjuryStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_injuries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_injuries_user_id_status_idx" ON "user_injuries"("user_id", "status");

-- AddForeignKey
ALTER TABLE "user_injuries" ADD CONSTRAINT "user_injuries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- DropForeignKey
ALTER TABLE "workout_routines" DROP CONSTRAINT "workout_routines_chat_session_id_fkey";

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "logo_style" TEXT NOT NULL DEFAULT 'pulse-bubble';

-- AlterTable
ALTER TABLE "workout_routines" ALTER COLUMN "chat_session_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "exercises_primary_equipment_trgm_idx" ON "exercises" USING GIN ("primary_equipment" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "exercises_prime_mover_muscle_trgm_idx" ON "exercises" USING GIN ("prime_mover_muscle" gin_trgm_ops);

-- AddForeignKey
ALTER TABLE "workout_routines" ADD CONSTRAINT "workout_routines_chat_session_id_fkey" FOREIGN KEY ("chat_session_id") REFERENCES "chat_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

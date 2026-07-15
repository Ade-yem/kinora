-- CreateEnum
CREATE TYPE "Goal" AS ENUM ('BUILD_MUSCLE', 'LOSE_FAT', 'GET_STRONGER', 'STAY_ACTIVE');

-- CreateEnum
CREATE TYPE "Location" AS ENUM ('HOME', 'GYM');

-- CreateEnum
CREATE TYPE "EquipmentOption" AS ENUM ('DUMBBELLS', 'BANDS', 'BENCH', 'BODYWEIGHT_ONLY');

-- CreateEnum
CREATE TYPE "RoutineStatus" AS ENUM ('PENDING_GENERATION', 'PENDING_REVIEW', 'REJECTED', 'APPROVED');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('COACH', 'USER');

-- CreateEnum
CREATE TYPE "ChatMessageKind" AS ENUM ('TEXT', 'GUARDRAIL', 'PATCH');

-- CreateEnum
CREATE TYPE "BodyRegion" AS ENUM ('LOWER_BODY', 'UPPER_BODY', 'FULL_BODY', 'CORE');

-- CreateEnum
CREATE TYPE "TargetMuscleGroup" AS ENUM ('QUADRICEPS', 'SHOULDERS', 'ABDOMINALS', 'BACK', 'GLUTES', 'CHEST', 'BICEPS', 'TRICEPS', 'HIP_FLEXORS', 'CALVES', 'HAMSTRINGS', 'FOREARMS', 'ABDUCTORS', 'ADDUCTORS', 'TRAPEZIUS', 'SHINS');

-- CreateEnum
CREATE TYPE "PrimaryExerciseClassification" AS ENUM ('BODYBUILDING', 'CALISTHENICS', 'BALLISTICS', 'BALANCE', 'PLYOMETRIC', 'OLYMPIC_WEIGHTLIFTING', 'MOBILITY', 'GRINDS', 'POSTURAL', 'ANIMAL_FLOW', 'POWERLIFTING', 'UNSORTED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "goal" "Goal",
    "location" "Location",
    "equipment" "EquipmentOption"[],
    "session_duration_minutes" INTEGER,
    "injuries" JSONB,
    "injuries_notes" TEXT,
    "units_preference" TEXT NOT NULL DEFAULT 'lb',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_demo_video_url" TEXT,
    "in_depth_explanation_video_url" TEXT,
    "difficulty_level" TEXT,
    "target_muscle_group" "TargetMuscleGroup",
    "prime_mover_muscle" TEXT,
    "secondary_muscle" TEXT,
    "tertiary_muscle" TEXT,
    "primary_equipment" TEXT,
    "primary_equipment_count" INTEGER,
    "secondary_equipment" TEXT,
    "secondary_equipment_count" INTEGER,
    "posture" TEXT,
    "arm_laterality" TEXT,
    "arm_movement_pattern" TEXT,
    "grip" TEXT,
    "load_position_ending" TEXT,
    "leg_movement_pattern" TEXT,
    "foot_elevation" TEXT,
    "combination_exercises" TEXT,
    "movement_pattern_1" TEXT,
    "movement_pattern_2" TEXT,
    "movement_pattern_3" TEXT,
    "plane_of_motion_1" TEXT,
    "plane_of_motion_2" TEXT,
    "plane_of_motion_3" TEXT,
    "body_region" "BodyRegion",
    "force_type" TEXT,
    "mechanics" TEXT,
    "laterality" TEXT,
    "primary_classification" "PrimaryExerciseClassification",
    "instructions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "chat_session_id" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "kind" "ChatMessageKind" NOT NULL DEFAULT 'TEXT',
    "text" TEXT NOT NULL,
    "chip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_routines" (
    "id" TEXT NOT NULL,
    "chat_session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "status" "RoutineStatus" NOT NULL DEFAULT 'PENDING_GENERATION',
    "review_notes" JSONB,
    "finalized_at" TIMESTAMP(3),
    "program_id" TEXT,
    "day_index" INTEGER,
    "total_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_items" (
    "id" TEXT NOT NULL,
    "routine_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "target_reps" INTEGER,
    "target_seconds" INTEGER,
    "target_side" TEXT,

    CONSTRAINT "routine_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_logs" (
    "id" TEXT NOT NULL,
    "routine_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration_seconds" INTEGER,
    "entries" JSONB NOT NULL,
    "total_volume_kg" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "exercises_name_idx" ON "exercises"("name");

-- CreateIndex
CREATE INDEX "exercises_target_muscle_group_idx" ON "exercises"("target_muscle_group");

-- CreateIndex
CREATE INDEX "exercises_body_region_idx" ON "exercises"("body_region");

-- CreateIndex
CREATE INDEX "exercises_primary_classification_idx" ON "exercises"("primary_classification");

-- CreateIndex
CREATE INDEX "chat_messages_chat_session_id_created_at_idx" ON "chat_messages"("chat_session_id", "created_at");

-- CreateIndex
CREATE INDEX "workout_routines_user_id_status_idx" ON "workout_routines"("user_id", "status");

-- CreateIndex
CREATE INDEX "routine_items_routine_id_idx" ON "routine_items"("routine_id");

-- CreateIndex
CREATE UNIQUE INDEX "routine_items_routine_id_order_key" ON "routine_items"("routine_id", "order");

-- CreateIndex
CREATE INDEX "workout_logs_user_id_performed_at_idx" ON "workout_logs"("user_id", "performed_at");

-- CreateIndex
CREATE INDEX "workout_logs_routine_id_idx" ON "workout_logs"("routine_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_session_id_fkey" FOREIGN KEY ("chat_session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_routines" ADD CONSTRAINT "workout_routines_chat_session_id_fkey" FOREIGN KEY ("chat_session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_routines" ADD CONSTRAINT "workout_routines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_items" ADD CONSTRAINT "routine_items_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "workout_routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_items" ADD CONSTRAINT "routine_items_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "workout_routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

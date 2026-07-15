/*
  Warnings:

  - The `goal` column on the `user_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `equipment` column on the `user_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "goal",
ADD COLUMN     "goal" TEXT,
DROP COLUMN "equipment",
ADD COLUMN     "equipment" TEXT[];

-- DropEnum
DROP TYPE "EquipmentOption";

-- DropEnum
DROP TYPE "Goal";

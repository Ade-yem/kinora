import "dotenv/config";
import { prisma } from "../lib/db";
import fs from "fs";
import path from "path";
import { BodyRegion, TargetMuscleGroup, PrimaryExerciseClassification, Prisma } from "../app/generated/prisma/client";

// Map primary classification to the Prisma enum values
function mapClassification(cls: string): PrimaryExerciseClassification {
  switch (cls) {
    case 'Postural': return 'POSTURAL';
    case 'Bodybuilding': return 'BODYBUILDING';
    case 'Calisthenics': return 'CALISTHENICS';
    case 'Animal Flow': return 'ANIMAL_FLOW';
    case 'Grinds': return 'GRINDS';
    case 'Powerlifting': return 'POWERLIFTING';
    case 'Mobility': return 'MOBILITY';
    case 'Plyometric': return 'PLYOMETRIC';
    case 'Ballistics': return 'BALLISTICS';
    case 'Olympic Weightlifting': return 'OLYMPIC_WEIGHTLIFTING';
    case 'Balance': return 'BALANCE';
    default: return 'UNSORTED'; // Maps Core & Stability, Rehab/Prehab, Conditioning, etc.
  }
}

// Helper to normalize TargetMuscleGroup enum
function mapTargetMuscleGroup(group: string): TargetMuscleGroup | null {
  if (!group) return null;
  const normalized = group.toUpperCase().replace(/\s+/g, '_');
  const validGroups = Object.values(TargetMuscleGroup);
  if (validGroups.includes(normalized as TargetMuscleGroup)) {
    return normalized as TargetMuscleGroup;
  }
  return null;
}

// Helper to normalize BodyRegion enum
function mapBodyRegion(region: string): BodyRegion | null {
  if (!region) return null;
  const normalized = region.toUpperCase().replace(/\s+/g, '_');
  const validRegions = Object.values(BodyRegion);
  if (validRegions.includes(normalized as BodyRegion)) {
    return normalized as BodyRegion;
  }
  return null;
}

async function seedExercises() {
  console.log("Reading fitness_links.json...");
  const filePath = path.join(__dirname, "../fitness_links.json");
  const rawData = fs.readFileSync(filePath, "utf-8");
  const exercisesData = JSON.parse(rawData);

  console.log(`Found ${exercisesData.length} exercises in seed file.`);

  // 1. Fetch all existing exercises to avoid duplicates and partition operations
  console.log("Fetching existing exercises from database...");
  const existingExercises = await prisma.exercise.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const existingMap = new Map<string, string>();
  for (const ex of existingExercises) {
    existingMap.set(ex.name, ex.id);
  }
  console.log(`Found ${existingMap.size} existing exercises in the database.`);

  const toCreate: Prisma.ExerciseCreateManyInput[] = [];
  const toUpdate: { id: string; data: Prisma.ExerciseUpdateInput }[] = [];

  for (const item of exercisesData) {
    const name = item.Exercise;
    if (!name) continue;

    // Parse instructions JSON safely
    let instructionsJson: Prisma.InputJsonValue | null = null;
    if (item["Detailed Instructions"]) {
      try {
        instructionsJson = JSON.parse(item["Detailed Instructions"]);
      } catch {
        console.warn(`Failed to parse Detailed Instructions for: ${name}`);
      }
    }

    const exercisePayload: Prisma.ExerciseCreateManyInput = {
      name: name,
      shortDemoVideoUrl: item["Short YouTube Demonstration"] || null,
      inDepthExplanationVideoUrl: item["In-Depth YouTube Explanation"] || null,
      difficultyLevel: item["Difficulty Level"] || null,
      targetMuscleGroup: mapTargetMuscleGroup(item["Target Muscle Group"]),
      primeMoverMuscle: item["Prime Mover Muscle"] || null,
      secondaryMuscle: item["Secondary Muscle"] || null,
      tertiaryMuscle: item["Tertiary Muscle"] || null,
      primaryEquipment: item["Primary Equipment"] || null,
      primaryEquipmentCount: item["# Primary Items"] !== undefined ? Number(item["# Primary Items"]) : null,
      secondaryEquipment: item["Secondary Equipment"] || null,
      secondaryEquipmentCount: item["# Secondary Items"] !== undefined ? Number(item["# Secondary Items"]) : null,
      posture: item["Posture"] || null,
      armLaterality: item["Single or Double Arm"] || null,
      armMovementPattern: item["Continuous or Alternating Arms"] || null,
      grip: item["Grip"] || null,
      loadPositionEnding: item["Load Position (Ending)"] || null,
      legMovementPattern: item["Continuous or Alternating Legs"] || null,
      footElevation: item["Foot Elevation"] || null,
      combinationExercises: item["Combination Exercises"] || null,
      movementPattern1: item["Movement Pattern #1"] || null,
      movementPattern2: item["Movement Pattern #2"] || null,
      movementPattern3: item["Movement Pattern #3"] || null,
      planeOfMotion1: item["Plane Of Motion #1"] || null,
      planeOfMotion2: item["Plane Of Motion #2"] || null,
      planeOfMotion3: item["Plane Of Motion #3"] || null,
      bodyRegion: mapBodyRegion(item["Body Region"]),
      forceType: item["Force Type"] || null,
      mechanics: item["Mechanics"] || null,
      laterality: item["Laterality"] || null,
      primaryClassification: mapClassification(item["Primary Exercise Classification"]),
      instructions: instructionsJson!,
    };

    const existingId = existingMap.get(name);
    if (existingId) {
      toUpdate.push({ id: existingId, data: exercisePayload });
    } else {
      toCreate.push(exercisePayload);
    }
  }

  // 2. Perform Batch Insert (createMany)
  if (toCreate.length > 0) {
    console.log(`Batch inserting ${toCreate.length} new exercises...`);
    // Chunk size of 500 to stay within query parameter limits in PostgreSQL
    const chunkSize = 500;
    for (let i = 0; i < toCreate.length; i += chunkSize) {
      const chunk = toCreate.slice(i, i + chunkSize);
      await prisma.exercise.createMany({
        data: chunk,
      });
      console.log(`Inserted chunk ${i / chunkSize + 1} (${chunk.length} items)...`);
    }
    console.log("Batch inserts complete.");
  } else {
    console.log("No new exercises to insert.");
  }

  // 3. Perform Updates one-by-one or in controlled concurrent chunks
  if (toUpdate.length > 0) {
    console.log(`Updating ${toUpdate.length} existing exercises...`);
    // For updates, we can update in smaller chunks using Promise.all
    const updateChunkSize = 50;
    for (let i = 0; i < toUpdate.length; i += updateChunkSize) {
      const chunk = toUpdate.slice(i, i + updateChunkSize);
      await Promise.all(
        chunk.map((item) =>
          prisma.exercise.update({
            where: { id: item.id },
            data: item.data,
          })
        )
      );
      console.log(`Updated chunk ${Math.floor(i / updateChunkSize) + 1}/${Math.ceil(toUpdate.length / updateChunkSize)}...`);
    }
    console.log("Updates complete.");
  } else {
    console.log("No existing exercises need updates.");
  }

  console.log("Seeding finished successfully!");
}

seedExercises()
  .catch((e) => {
    console.error("Error seeding exercises:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
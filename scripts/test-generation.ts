import "dotenv/config";
import { prisma } from "../lib/db";
import { runRoutineGenerationLoop } from "../lib/chat/generator";

async function main() {
  console.log("=== Workout AI Routine Generation Loop Test ===");

  // 1. Find or create a test user
  const email = "tester_actor_critic@example.com";
  let user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log(`Creating test user with email: ${email}`);
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: "dummy-hash",
      },
    });
  } else {
    console.log(`Using existing test user: ${user.id}`);
  }

  const userId = user.id;

  // 2. Set up or update the user's fitness profile
  console.log("Configuring user profile parameters...");
  const profile = await prisma.userProfile.upsert({
    where: { userId },
    update: {
      goal: "Build lean muscle and improve chest strength",
      location: "GYM",
      equipment: ["Dumbbell", "Barbell", "Bench", "Pull-up Bar", "Bodyweight"],
      sessionDurationMinutes: 45,
      injuriesNotes: "Mild left shoulder soreness, avoid extremely heavy overhead press.",
    },
    create: {
      userId,
      goal: "Build lean muscle and improve chest strength",
      location: "GYM",
      equipment: ["Dumbbell", "Barbell", "Bench", "Pull-up Bar", "Bodyweight"],
      sessionDurationMinutes: 45,
      injuriesNotes: "Mild left shoulder soreness, avoid extremely heavy overhead press.",
    },
  });

  // 3. Create a mock chat session
  console.log("Creating mock chat session...");
  const chatSession = await prisma.chatSession.create({
    data: {
      userId,
      title: "Test Routine Generation Session",
    },
  });

  // 4. Run the Actor-Critic routine generation loop
  console.log("Starting runRoutineGenerationLoop...");
  try {
    const routine = await runRoutineGenerationLoop({
      userId,
      chatSessionId: chatSession.id,
      onProgress: (text) => {
        // Stream text immediately to stdout
        process.stdout.write(text);
      },
    });

    console.log("\n=================================");
    console.log("Routine Generation COMPLETED!");
    console.log("=================================");
    console.log(`ID:         ${routine.id}`);
    console.log(`Title:      ${routine.title}`);
    console.log(`Subtitle:   ${routine.subtitle}`);
    console.log(`Status:     ${routine.status}`);
    console.log(`Day Index:  ${routine.dayIndex} / ${routine.totalDays}`);
    console.log("reviewNotes:", JSON.stringify(routine.reviewNotes, null, 2));

    // Fetch and print the created exercises/items
    const items = await prisma.routineItem.findMany({
      where: { routineId: routine.id },
      include: { exercise: true },
      orderBy: { order: "asc" },
    });

    console.log("\nGenerated Routine Exercises:");
    for (const item of items) {
      const targetStr = item.targetReps 
        ? `${item.targetReps} reps` 
        : `${item.targetSeconds} seconds`;
      const sideStr = item.targetSide ? ` (${item.targetSide})` : "";
      console.log(
        ` ${item.order}. ${item.exercise.name} - ${item.sets} sets x ${targetStr}${sideStr} (Equipment: ${item.exercise.primaryEquipment}, Muscle: ${item.exercise.targetMuscleGroup})`
      );
    }
  } catch (error) {
    console.error("\nLoop execution failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

import "dotenv/config";
import { prisma } from "../lib/db";
import { createChatStream } from "../lib/chat/stream";

async function main() {
  console.log("=== Workout AI Chat Routine Generation Test ===");

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
  await prisma.userProfile.upsert({
    where: { userId },
    update: {
      experienceLevel: "beginner",
      preferredLocation: "HOME",
    },
    create: {
      userId,
      experienceLevel: "beginner",
      preferredLocation: "HOME",
    },
  });

  // Ensure test injuries exist
  await prisma.injury.deleteMany({ where: { userId } });

  // 3. Create a mock chat session with intake settings
  console.log("Creating mock chat session...");
  const chatSession = await prisma.chatSession.create({
    data: {
      userId,
      title: "Test Routine Generation Session",
      location: "HOME",
      equipment: [],
      sessionDurationMinutes: 20,
    },
  });

  // 4. Run the chat stream to generate the routine
  console.log("\nStarting chat stream simulation...");
  console.log("Prompt: 'Please generate a 7-day workout routine for my back and shoulders, home, bodyweight only, 20 minutes duration.'\n");
  
  try {
    const stream = createChatStream({
      userId,
      chatSessionId: chatSession.id,
      history: [],
      userText: "Please generate a 7-day workout routine for my back and shoulders, home, bodyweight only, 20 minutes duration.",
    });

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const lines = part.split("\n");
        let event = "";
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            event = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            dataStr = line.slice(6).trim();
          }
        }

        if (event && dataStr) {
          try {
            const data = JSON.parse(dataStr) as Record<string, unknown>;
            if (event === "delta") {
              process.stdout.write(String(data.text || ""));
            } else if (event === "thought") {
              console.log(`\n[Stream Thought]: ${data.text}`);
            } else if (event === "done") {
              console.log(`\n\n[Done Message ID]: ${data.messageId}`);
            } else if (event === "error") {
              console.error(`\n[Error]: ${data.message}`);
            }
          } catch {
            // Ignore parse errors for non-json
          }
        }
      }
    }

    console.log("\n=================================");
    console.log("Chat Generation COMPLETED!");
    console.log("=================================");

    // Fetch and check the created workout routines
    const routines = await prisma.workoutRoutine.findMany({
      where: {
        program: {
          chatSessionId: chatSession.id,
          status: "APPROVED",
        },
      },
      include: {
        items: {
          include: { exercise: true },
          orderBy: { order: "asc" },
        },
        program: true,
      },
      orderBy: { dayIndex: "asc" },
    });

    console.log(`\nGenerated ${routines.length} routines in the DB:`);
    for (const routine of routines) {
      console.log(`\n- Day ${routine.dayIndex} / ${routine.program.totalDays}: ${routine.title}`);
      console.log(`  Subtitle: ${routine.subtitle}`);
      console.log("  Exercises:");
      for (const item of routine.items) {
        const targetStr = item.targetReps 
          ? `${item.targetReps} reps` 
          : `${item.targetSeconds} seconds`;
        console.log(`    * ${item.order}. ${item.exercise.name} - ${item.sets} sets x ${targetStr} (Equipment: ${item.exercise.primaryEquipment}, Muscle: ${item.exercise.targetMuscleGroup})`);
      }
    }
  } catch (error) {
    console.error("\nExecution failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();



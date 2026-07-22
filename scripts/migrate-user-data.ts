import "dotenv/config";
import { prisma } from "../lib/db";
import fs from "fs";
import path from "path";

const backupPath = path.join(__dirname, "profiles-backup.json");

async function backup() {
  console.log("Backing up UserProfiles...");
  // Use raw or prisma client to get the old profile records
  // We type cast as any since the client typescript type might be updated
  const profiles = await (prisma.userProfile as any).findMany({});
  console.log(`Found ${profiles.length} profiles.`);
  fs.writeFileSync(backupPath, JSON.stringify(profiles, null, 2), "utf-8");
  console.log(`Successfully backed up profiles to ${backupPath}`);
}

async function restore() {
  console.log("Restoring UserProfiles into new schema structure...");
  if (!fs.existsSync(backupPath)) {
    console.error(`Backup file not found at ${backupPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(backupPath, "utf-8");
  const profiles = JSON.parse(raw);
  console.log(`Read ${profiles.length} profiles from backup.`);

  for (const profile of profiles) {
    const userId = profile.userId;
    console.log(`Processing user ${userId}...`);

    // 1. Find or create a ChatSession to hold the intake session data
    let session = await prisma.chatSession.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Map location enum safely
    let locationEnum: any = null;
    if (profile.location) {
      const locUpper = profile.location.toUpperCase();
      if (locUpper === "HOME" || locUpper === "GYM") {
        locationEnum = locUpper;
      }
    }

    if (session) {
      console.log(`Updating existing ChatSession ${session.id} with intake parameters...`);
      await prisma.chatSession.update({
        where: { id: session.id },
        data: {
          location: locationEnum,
          equipment: profile.equipment || [],
          sessionDurationMinutes: profile.sessionDurationMinutes || null,
        },
      });
    } else {
      console.log(`Creating new ChatSession for intake parameters...`);
      session = await prisma.chatSession.create({
        data: {
          userId,
          title: "Intake Session",
          location: locationEnum,
          equipment: profile.equipment || [],
          sessionDurationMinutes: profile.sessionDurationMinutes || null,
        },
      });
    }

    // 2. Migrate injuries
    let parsedInjuries: any[] = [];
    if (profile.injuries) {
      try {
        if (typeof profile.injuries === "string") {
          parsedInjuries = JSON.parse(profile.injuries);
        } else if (Array.isArray(profile.injuries)) {
          parsedInjuries = profile.injuries;
        }
      } catch (e) {
        console.warn(`Failed to parse injuries JSON for user ${userId}:`, e);
      }
    }

    // Insert structured injuries
    if (parsedInjuries.length > 0) {
      for (const inj of parsedInjuries) {
        let severityVal: any = "MODERATE";
        if (inj.severity) {
          const sevUpper = inj.severity.toUpperCase();
          if (["MILD", "MODERATE", "SEVERE"].includes(sevUpper)) {
            severityVal = sevUpper;
          }
        }
        await prisma.injury.create({
          data: {
            userId,
            bodyPart: inj.bodyPart || "Unspecified",
            severity: severityVal,
            note: inj.note || null,
            status: "ACTIVE",
          },
        });
      }
      console.log(`Migrated ${parsedInjuries.length} structured injuries.`);
    }

    // If injuriesNotes exists but no structured injuries were added, create a general injury
    if (profile.injuriesNotes && profile.injuriesNotes.trim().length > 0 && parsedInjuries.length === 0) {
      await prisma.injury.create({
        data: {
          userId,
          bodyPart: "Unspecified",
          severity: "MODERATE",
          note: profile.injuriesNotes,
          status: "ACTIVE",
        },
      });
      console.log(`Migrated injuriesNotes string as a general injury.`);
    }
  }

  console.log("Restore complete!");
}

const mode = process.argv[2];
if (mode === "--backup") {
  backup()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
} else if (mode === "--restore") {
  restore()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
} else {
  console.log("Usage: tsx scripts/migrate-user-data.ts [--backup|--restore]");
}

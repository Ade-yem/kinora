// @ts-nocheck
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: any;
}

let prisma: any;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    adapter: new PrismaPg(
      new Pool({
        connectionString: process.env.DATABASE_URL,
      })
    ),
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      adapter: new PrismaPg(
        new Pool({
          connectionString: process.env.DATABASE_URL,
        })
      ),
    });
  }
  prisma = global.prisma;
}

export { prisma };

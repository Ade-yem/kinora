// @ts-nocheck
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {PrismaNeon} from "@prisma/adapter-neon";
import { Pool } from "pg";

declare global {
  var prisma: any;
}

let prisma: any;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    adapter: new PrismaNeon({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DB_POOL_MAX ?? 3), idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000
    },
  )
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

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  // Use a placeholder URL during build time if DATABASE_URL is not available
  const effectiveConnectionString =
    connectionString ||
    (process.env.NEXT_PHASE === "phase-production-build"
      ? "postgresql://placeholder:placeholder@localhost:5432/placeholder"
      : null);

  if (!effectiveConnectionString) {
    throw new Error("DATABASE_URL is not set. Please configure it in your environment variables.");
  }

  try {
    // Add connection pooling parameters to the URL if not already present
    const url = new URL(effectiveConnectionString);
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "15");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "15");
    }

    const adapter = new PrismaNeon({ connectionString: url.toString() });

    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["error", "warn"] // Reduced logging for cleaner output
          : ["error"],
    });
  } catch (error) {
    // If URL parsing fails during build, use placeholder
    if (process.env.NEXT_PHASE === "phase-production-build" && !connectionString) {
      const placeholderUrl = "postgresql://placeholder:placeholder@localhost:5432/placeholder";
      const adapter = new PrismaNeon({ connectionString: placeholderUrl });
      return new PrismaClient({
        adapter,
        log: ["error"],
      });
    }
    throw new Error(
      `Invalid DATABASE_URL: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export default db;

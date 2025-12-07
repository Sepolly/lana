/**
 * Utility to ensure a user exists in the database
 * Handles cases where OAuth users exist in session but not in DB
 */

import { db } from "./db";

interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

/**
 * Ensures the user exists in the database.
 * Creates the user if they don't exist (can happen with OAuth).
 * Returns the user record.
 */
export async function ensureUserExists(sessionUser: SessionUser) {
  // Try to find existing user
  let user = await db.user.findUnique({
    where: { id: sessionUser.id },
  });

  // If user doesn't exist, create them
  if (!user) {
    console.log("User not found in database, creating:", sessionUser.id);
    
    // Check if email already exists (might need to link accounts)
    const existingByEmail = await db.user.findUnique({
      where: { email: sessionUser.email },
    });

    if (existingByEmail) {
      // User exists with this email but different ID - return existing
      console.log("User with email exists, using existing:", existingByEmail.id);
      return existingByEmail;
    }

    // Create new user
    user = await db.user.create({
      data: {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        image: sessionUser.image,
        emailVerified: new Date(),
      },
    });
    
    console.log("Created user:", user.id);
  }

  return user;
}

/**
 * Ensures both user and student profile exist.
 * Creates them if they don't exist.
 */
export async function ensureUserAndProfile(sessionUser: SessionUser) {
  const user = await ensureUserExists(sessionUser);

  // Ensure student profile exists
  let profile = await db.studentProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    console.log("Creating student profile for user:", user.id);
    profile = await db.studentProfile.create({
      data: {
        userId: user.id,
      },
    });
  }

  return { user, profile };
}


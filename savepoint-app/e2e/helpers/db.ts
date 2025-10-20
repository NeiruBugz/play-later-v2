import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

/**
 * Database seeding and cleanup utilities for E2E tests
 */

const prisma = new PrismaClient();

/**
 * Test user data interface
 */
export interface TestUser {
  id: string;
  email: string;
  username: string;
  password: string;
}

/**
 * Creates a test user in the database
 *
 * @param data - Partial user data (email, username, password)
 * @returns Created user data including ID
 */
export async function createTestUser(data: {
  email: string;
  username: string;
  password: string;
}): Promise<TestUser> {
  // Hash the password before storing
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      password: hashedPassword,
    },
  });

  return {
    id: user.id,
    email: user.email ?? data.email, // Fallback to input if null
    username: user.username ?? data.username, // Fallback to input if null
    password: data.password, // Return original password for test usage
  };
}

/**
 * Deletes a test user by email
 *
 * @param email - User email address
 */
export async function deleteTestUser(email: string): Promise<void> {
  await prisma.user.delete({
    where: { email },
  });
}

/**
 * Deletes multiple test users by email pattern
 * Useful for cleaning up all test users at once
 *
 * @param emailPattern - Email pattern to match (e.g., "test-")
 */
export async function deleteTestUsersByPattern(
  emailPattern: string
): Promise<void> {
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: emailPattern,
      },
    },
  });
}

/**
 * Clears all test data from the database
 * WARNING: This will delete ALL data matching test patterns
 * Only use in test environments!
 */
export async function clearTestData(): Promise<void> {
  // Delete all users with test email patterns
  await deleteTestUsersByPattern("test-");
  await deleteTestUsersByPattern("e2e-");

  // Add additional cleanup for other entities as needed
  // For example:
  // await prisma.libraryItem.deleteMany({ where: { ... } });
  // await prisma.game.deleteMany({ where: { ... } });
}

/**
 * Seeds the database with a default test user
 * Returns the created user data for use in tests
 */
export async function seedDefaultTestUser(): Promise<TestUser> {
  const defaultUser = {
    email: "test-user@example.com",
    username: "testuser",
    password: "TestPassword123!",
  };

  // Try to delete existing test user first
  try {
    await deleteTestUser(defaultUser.email);
  } catch {
    // User doesn't exist, that's fine
  }

  return createTestUser(defaultUser);
}

/**
 * Disconnects from the database
 * Call this in test teardown to clean up connections
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Verifies database connection is working
 * Useful for setup validation
 */
export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

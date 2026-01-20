import "server-only";

import {
  repositoryError,
  RepositoryErrorCode,
  repositorySuccess,
  type RepositoryResult,
} from "@/data-access-layer/repository/types";
import { Prisma, type User } from "@prisma/client";

import { prisma } from "@/shared/lib/app/db";

import {
  type GetUserBySteamIdInput,
  type GetUserByUsernameInput,
  type UpdateUserDataInput,
  type UpdateUserSteamDataInput,
} from "./types";

export async function getUserBySteamId({
  userId,
  steamId,
}: GetUserBySteamIdInput): Promise<RepositoryResult<User | null>> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        steamId64: steamId,
        id: { not: userId },
      },
    });
    return repositorySuccess(user);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get user by Steam ID: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
export async function updateUserSteamData({
  userId,
  steamId,
  username,
  avatar,
  profileUrl,
  connectedAt,
}: UpdateUserSteamDataInput): Promise<RepositoryResult<User>> {
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        steamId64: steamId,
        steamUsername: username,
        steamAvatar: avatar,
        ...(profileUrl !== undefined && { steamProfileURL: profileUrl }),
        ...(connectedAt !== undefined && { steamConnectedAt: connectedAt }),
      },
    });
    return repositorySuccess(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return repositoryError(RepositoryErrorCode.NOT_FOUND, "User not found");
    }
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to update user Steam data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
export async function getUserByUsername({
  username,
}: GetUserByUsernameInput): Promise<
  RepositoryResult<{ username: string | null }>
> {
  try {
    const user = await prisma.user.findUnique({
      where: { usernameNormalized: username.toLowerCase().trim() },
      select: {
        username: true,
      },
    });
    if (!user) {
      return repositoryError(RepositoryErrorCode.NOT_FOUND, "User not found");
    }
    return repositorySuccess(user);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get user by username: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
export async function getUserSteamData({ userId }: { userId: string }): Promise<
  RepositoryResult<{
    steamId64: string | null;
    steamUsername: string | null;
    steamAvatar: string | null;
    steamProfileURL: string | null;
    steamConnectedAt: Date | null;
  } | null>
> {
  try {
    const data = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        steamId64: true,
        steamUsername: true,
        steamAvatar: true,
        steamProfileURL: true,
        steamConnectedAt: true,
      },
    });
    return repositorySuccess(data);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get user Steam data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
export async function getUserInfo({ userId }: { userId: string }): Promise<
  RepositoryResult<{
    id: string;
    name: string | null;
    username: string | null;
    steamProfileURL: string | null;
    steamConnectedAt: Date | null;
    email: string | null;
  } | null>
> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        steamProfileURL: true,
        steamConnectedAt: true,
        email: true,
      },
    });
    return repositorySuccess(user);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get user info: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
export async function updateUserData({
  userId,
  username,
  steamProfileUrl,
}: UpdateUserDataInput): Promise<RepositoryResult<User>> {
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        steamProfileURL: steamProfileUrl,
      },
    });
    return repositorySuccess(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return repositoryError(RepositoryErrorCode.NOT_FOUND, "User not found");
    }
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to update user data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
export async function getUserSteamId({
  steamUsername,
  userId,
}: {
  steamUsername: string;
  userId: string;
}): Promise<RepositoryResult<{ steamId64: string | null } | null>> {
  try {
    const data = await prisma.user.findUnique({
      where: { steamUsername, id: userId },
      select: { steamId64: true },
    });
    return repositorySuccess(data);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get user Steam ID: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
export async function disconnectSteam({
  userId,
}: {
  userId: string;
}): Promise<RepositoryResult<User>> {
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        steamId64: null,
        steamUsername: null,
        steamProfileURL: null,
        steamAvatar: null,
        steamConnectedAt: null,
      },
    });
    return repositorySuccess(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return repositoryError(RepositoryErrorCode.NOT_FOUND, "User not found");
    }
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to disconnect Steam: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
export async function findUserByEmail(
  email: string
): Promise<RepositoryResult<{ id: string } | null>> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true },
    });
    return repositorySuccess(user);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find user by email: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
export async function createUserWithCredentials(input: {
  email: string;
  password: string;
  name?: string | null;
}): Promise<
  RepositoryResult<{ id: string; email: string | null; name: string | null }>
> {
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        name: input.name ?? null,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    return repositorySuccess(user);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return repositoryError(
        RepositoryErrorCode.ALREADY_EXISTS,
        "User with this email already exists"
      );
    }
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to create user: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
export async function findUserById<T extends Prisma.UserSelect>(
  userId: string,
  options: { select: T }
): Promise<RepositoryResult<Prisma.UserGetPayload<{ select: T }> | null>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: options.select,
    });
    return repositorySuccess(user);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find user by ID: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
export async function findUserByNormalizedUsername(
  usernameNormalized: string
): Promise<RepositoryResult<{ id: string } | null>> {
  try {
    const user = await prisma.user.findUnique({
      where: { usernameNormalized },
      select: { id: true },
    });
    return repositorySuccess(user);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find user by normalized username: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
export async function updateOnboardingDismissed(
  userId: string
): Promise<RepositoryResult<void>> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingDismissedAt: new Date() },
    });
    return repositorySuccess(undefined);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return repositoryError(RepositoryErrorCode.NOT_FOUND, "User not found");
    }
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to update onboarding dismissed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function getOnboardingStatus(userId: string): Promise<
  RepositoryResult<{
    profileSetupCompletedAt: Date | null;
    onboardingDismissedAt: Date | null;
  } | null>
> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profileSetupCompletedAt: true,
        onboardingDismissedAt: true,
      },
    });
    return repositorySuccess(user);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get onboarding status: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function updateUserProfile(
  userId: string,
  data: {
    username?: string;
    usernameNormalized?: string;
    image?: string;
    profileSetupCompletedAt?: Date | null;
  }
): Promise<
  RepositoryResult<{
    id: string;
    username: string | null;
    usernameNormalized: string | null;
    steamProfileURL: string | null;
    image: string | null;
    profileSetupCompletedAt: Date | null;
  }>
> {
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        usernameNormalized: true,
        steamProfileURL: true,
        image: true,
        profileSetupCompletedAt: true,
      },
    });
    return repositorySuccess(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return repositoryError(RepositoryErrorCode.NOT_FOUND, "User not found");
    }
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to update user profile: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

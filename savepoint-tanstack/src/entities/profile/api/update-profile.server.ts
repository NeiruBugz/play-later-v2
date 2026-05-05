import { prisma } from "@/shared/lib/db";
import { ConflictError, NotFoundError } from "@/shared/lib/errors";

import { Prisma } from "../../../../shared/lib/prisma/client.ts";
import type { Profile } from "../model/types";

export interface UpdateProfileInput {
  name?: string;
  username?: string;
  image?: string;
  isPublicProfile?: boolean;
}

const PROFILE_SELECT = {
  id: true,
  name: true,
  username: true,
  image: true,
  isPublicProfile: true,
} as const;

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<Profile> {
  const data: Prisma.userUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name;
  }
  if (input.username !== undefined) {
    const trimmed = input.username.trim();
    data.username = trimmed;
    data.usernameNormalized = trimmed.toLowerCase();
  }
  if (input.image !== undefined) {
    data.image = input.image;
  }
  if (input.isPublicProfile !== undefined) {
    data.isPublicProfile = input.isPublicProfile;
  }

  try {
    return await prisma.user.update({
      where: { id: userId },
      data,
      select: PROFILE_SELECT,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new NotFoundError("User not found while updating profile", {
          userId,
        });
      }
      if (error.code === "P2002" && targetsUsername(error.meta)) {
        throw new ConflictError("Username already taken", {
          userId,
          username: input.username,
        });
      }
    }
    throw error;
  }
}

// Narrow P2002 mapping to the username constraint(s) only. Other unique
// constraints (e.g., a future @unique on email or a new column) must rethrow
// as-is so the failure surfaces honestly instead of being mislabeled as a
// username conflict. See CONTEXT.md rule about single enforcement seams.
//
// Two meta shapes are supported because Prisma exposes different structures
// depending on the engine: legacy `meta.target` (`string | string[]`) and the
// driver-adapter nested `meta.driverAdapterError.cause.constraint.fields`.
function targetsUsername(meta: unknown): boolean {
  if (!meta || typeof meta !== "object") return false;
  const fields = collectConstraintFields(meta as Record<string, unknown>);
  return fields.some(
    (value) =>
      value.includes("usernameNormalized") || value.includes("username")
  );
}

function collectConstraintFields(meta: Record<string, unknown>): string[] {
  const fields: string[] = [];

  const target = meta.target;
  if (typeof target === "string") fields.push(target);
  if (Array.isArray(target))
    fields.push(...target.filter((v): v is string => typeof v === "string"));

  const adapterError = meta.driverAdapterError;
  if (adapterError && typeof adapterError === "object") {
    const cause = (adapterError as Record<string, unknown>).cause;
    if (cause && typeof cause === "object") {
      const constraint = (cause as Record<string, unknown>).constraint;
      if (constraint && typeof constraint === "object") {
        const f = (constraint as Record<string, unknown>).fields;
        if (Array.isArray(f))
          fields.push(...f.filter((v): v is string => typeof v === "string"));
      }
    }
  }

  return fields;
}

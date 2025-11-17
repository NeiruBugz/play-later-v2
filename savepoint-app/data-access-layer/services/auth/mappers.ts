import type { AuthUserData } from "./types";
export function mapToAuthUserData(
  user: {
    id: string;
    email: string | null;
    name: string | null;
  } & Record<string, unknown>
): AuthUserData {
  return {
    id: user.id,
    email: user.email ?? "",
    name: user.name ?? null,
  };
}

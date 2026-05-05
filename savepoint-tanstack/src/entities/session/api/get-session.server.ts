import { auth } from "@/shared/lib/auth/auth.server";

export async function getServerUserId(
  request: Request
): Promise<string | undefined> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id;
}

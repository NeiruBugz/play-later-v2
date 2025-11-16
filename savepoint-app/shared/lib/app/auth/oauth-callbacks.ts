import type { JWT } from "next-auth/jwt";

export async function onSignIn({
  account,
}: {
  account?: { provider?: string } | null;
}): Promise<boolean> {
  if (!account) return true;
  return true;
}

export async function onRedirect({
  url,
  baseUrl,
}: {
  url: string;
  baseUrl: string;
}): Promise<string> {
  try {
    if (url.startsWith("/")) {
      const target = new URL(url, baseUrl);
      if (
        target.pathname === "/profile/setup" ||
        target.pathname === "/dashboard"
      ) {
        const count = Number(target.searchParams.get("r") ?? "0");
        if (count >= 2) return `${baseUrl}/dashboard`;
        target.searchParams.set("r", String(count + 1));
      }
      return target.toString();
    }

    if (url.startsWith(baseUrl)) {
      const target = new URL(url);
      if (
        target.pathname === "/profile/setup" ||
        target.pathname === "/dashboard"
      ) {
        const count = Number(target.searchParams.get("r") ?? "0");
        if (count >= 2) return `${baseUrl}/dashboard`;
        target.searchParams.set("r", String(count + 1));
      }
      return target.toString();
    }

    return baseUrl;
  } catch {
    return baseUrl;
  }
}

export async function onJwt({
  token,
  user,
}: {
  token: JWT;
  user?: { id?: string } | null;
}): Promise<JWT> {
  if (user?.id) {
    (token as Record<string, unknown>).id = user.id;
  }
  return token;
}

export async function onSession({
  session,
  token,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  token: JWT;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): Promise<any> {
  return {
    ...session,
    user: {
      ...session.user,
      id: (token as Record<string, unknown>).id as string,
    },
  };
}

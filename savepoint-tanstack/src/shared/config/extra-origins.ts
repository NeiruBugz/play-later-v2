import { z } from "zod";

export const extraOriginsSchema = z.string().transform((value, ctx) => {
  const origins: string[] = [];
  for (const entry of value.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    try {
      origins.push(new URL(trimmed).origin);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: `BETTER_AUTH_EXTRA_ORIGINS has an invalid origin: ${trimmed}`,
      });
      return z.NEVER;
    }
  }
  return origins;
});

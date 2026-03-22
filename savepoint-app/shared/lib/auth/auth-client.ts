"use client";

import { createAuthClient } from "better-auth/react";
import { genericOAuthClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:6060",
  plugins: [genericOAuthClient()],
});

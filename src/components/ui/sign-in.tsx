"use client";
import { Button } from "@chakra-ui/react";
import { signIn } from "next-auth/react";

export function SignIn() {
  return <Button onClick={() => signIn("google")}>Sign in with Google</Button>;
}

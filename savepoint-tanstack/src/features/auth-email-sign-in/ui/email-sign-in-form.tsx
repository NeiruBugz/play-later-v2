import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/shared/api/auth-client";

const emailSignInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

type EmailSignInValues = z.infer<typeof emailSignInSchema>;

export function EmailSignInForm({ enabled }: { enabled: boolean }) {
  const emailId = useId();
  const passwordId = useId();

  const { register, handleSubmit } = useForm<EmailSignInValues>({
    resolver: zodResolver(emailSignInSchema),
    defaultValues: { email: "", password: "" },
  });

  if (!enabled) {
    return null;
  }

  const onSubmit = handleSubmit((values) => {
    void authClient.signIn.email({
      email: values.email,
      password: values.password,
      callbackURL: "/profile",
    });
  });

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor={emailId}>Email</label>
      <input
        id={emailId}
        type="email"
        autoComplete="email"
        {...register("email")}
      />

      <label htmlFor={passwordId}>Password</label>
      <input
        id={passwordId}
        type="password"
        autoComplete="current-password"
        {...register("password")}
      />

      <button type="submit">Sign in</button>
    </form>
  );
}

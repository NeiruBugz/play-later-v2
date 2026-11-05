import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/shared/api/auth-client";
import { Button } from "@/shared/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { StickyFooter } from "@/shared/ui/sticky-footer";

import type { EmailSignInFormProps } from "./email-sign-in-form.type";

const emailSignInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

type EmailSignInValues = z.infer<typeof emailSignInSchema>;

export function EmailSignInForm({ enabled }: EmailSignInFormProps) {
  const form = useForm<EmailSignInValues>({
    resolver: zodResolver(emailSignInSchema),
    defaultValues: { email: "", password: "" },
  });

  if (!enabled) {
    return null;
  }

  const onSubmit = form.handleSubmit((values) => {
    void authClient.signIn.email({
      email: values.email,
      password: values.password,
      callbackURL: "/profile",
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <StickyFooter className="max-md:-mx-3 max-md:px-3">
          <Button type="submit">Sign in</Button>
        </StickyFooter>
      </form>
    </Form>
  );
}

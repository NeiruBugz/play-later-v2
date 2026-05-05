import { z } from "zod";

import type { Profile } from "@/entities/profile";

export const formSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3).max(25),
  isPublicProfile: z.boolean(),
});

export type FormValues = z.infer<typeof formSchema>;

export type ProfileSettingsFormProps = {
  profile: Profile;
};

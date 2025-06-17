import { z } from "zod";

const UpdateUsernameSchema = z.object({
  id: z.string(),
  username: z.string(),
  steamProfileUrl: z.string(),
});

export const validateUpdateUsername = (data: FormData) => {
  return UpdateUsernameSchema.safeParse({
    id: data.get("userId"),
    username: data.get("username"),
    steamProfileUrl: data.get("steamProfileURL"),
  });
};

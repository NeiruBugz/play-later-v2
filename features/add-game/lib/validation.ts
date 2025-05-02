import { z } from "zod";

const CreateGameActionSchema = z.object({
  backlogStatus: z.string().optional(),
  igdbId: z.number(),
  title: z.string(),
  description: z.string().optional(),
  releaseDate: z.number().optional(),
  coverImage: z.string(),
  hltbId: z.string(),
  platform: z.string().optional(),
  mainStory: z.number().optional().default(0),
  mainExtra: z.number().optional().default(0),
  completionist: z.number().optional().default(0),
  acquisitionType: z.enum(["PHYSICAL", "DIGITAL", "SUBSCRIPTION"]),
});

export const validateCreateGameAction = (formData: FormData) => {
  return CreateGameActionSchema.safeParse({
    backlogStatus: formData.get("backlogStatus"),
    igdbId: Number(formData.get("igdbId")),
    title: formData.get("title"),
    description: formData.get("description"),
    releaseDate: Number(formData.get("releaseDate")),
    coverImage: formData.get("coverImage"),
    hltbId: formData.get("hltbId"),
    mainStory: Number(formData.get("mainStory")),
    mainExtra: Number(formData.get("mainExtra")),
    completionist: Number(formData.get("completionist")),
    acquisitionType: formData.get("acquisitionType"),
    platform: formData.get("platform"),
  });
};

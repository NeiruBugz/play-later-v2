"use server";

import { postFeedback } from "@/src/features/send-feedback/api/post-feedback";
import { z } from "zod";

const PostFeedbackSchema = z.object({
  feedback: z.string(),
  label: z
    .enum(["idea", "issue", "question", "complaint", "featureRequest", "other"])
    .optional()
    .nullable(),
  includeEmailAndName: z.boolean().optional().default(false).nullable(),
});

export async function postFeedbackAction(
  prevState: { message: string },
  payload: FormData
) {
  try {
    console.log(payload.get("label"))
    const parsedPayload = PostFeedbackSchema.safeParse({
      feedback: payload.get("feedback"),
      label: payload.get("label"),
      includeEmailAndName: payload.get("includeEmailAndName") !== null,
    });



    if (!parsedPayload.success) {
      console.log(parsedPayload.error.errors)
      return { message: "Error occurred while posting feedback" };
    }


    await postFeedback(parsedPayload.data);
    return { message: "Success" };
  } catch (e) {
    console.error(e);
    return { message: "Error occurred while posting feedback" };
  }
}

import { auth } from "@/auth";

type PostFeedbackInput = {
  feedback: string;
  includeEmailAndName: boolean | null;
  label?:
    | "idea"
    | "issue"
    | "question"
    | "complaint"
    | "featureRequest"
    | "other"
    | null
    | undefined;
};

export async function postFeedback(input: PostFeedbackInput) {
  try {
    const user = await auth();

    const { feedback, label, includeEmailAndName } = input;
    const body = {
      projectId: "j5784wxtg8a8n6hn71mhcr3sq96vdjh7",
      feedback,
      label: label ? label : "other",
      name: includeEmailAndName ? user?.user?.name : undefined,
      email: includeEmailAndName ? user?.user?.email : undefined,
    };

    await fetch("https://projectplannerai.com/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error(e)
  }
}

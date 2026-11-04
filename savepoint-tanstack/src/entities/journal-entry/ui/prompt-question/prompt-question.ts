export const PROMPT_QUESTION = {
  WHY: "Why do you want to play this?",
  STAYED: "What stayed with you?",
} as const;

export type NotePrompt = keyof typeof PROMPT_QUESTION;

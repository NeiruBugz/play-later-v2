import { useRouter } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { PROMPT_QUESTION, type NotePrompt } from "@/entities/journal-entry";
import { getUserFacingErrorMessage } from "@/shared/lib/user-facing-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { answerPromptFn } from "../../api/answer-prompt-fn";
import { dismissPromptFn } from "../../api/dismiss-prompt-fn";
import type { GamePromptsProps } from "./game-prompts.type";

type PromptRowProps = {
  libraryItemId: number;
  gameTitle: string;
  kind: NotePrompt;
};

function PromptRow({ libraryItemId, gameTitle, kind }: PromptRowProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isGone, setIsGone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const question = PROMPT_QUESTION[kind];
  const inputId = `prompt-${kind}-${libraryItemId}`;

  const run = async (task: () => Promise<unknown>) => {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      await task();
      setIsGone(true);
      void router.invalidate();
    } catch (error) {
      setErrorMessage(getUserFacingErrorMessage(error));
      setIsBusy(false);
    }
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (isBusy || text.trim() === "") return;
    void run(() =>
      answerPromptFn({ data: { id: libraryItemId, kind, text: text.trim() } })
    );
  };

  const dismiss = () =>
    void run(() => dismissPromptFn({ data: { id: libraryItemId, kind } }));

  if (isGone) return null;

  return (
    <form onSubmit={save} className="flex flex-col">
      <div className="flex items-center gap-1">
        <label
          htmlFor={inputId}
          className="shrink-0 text-sm text-muted-foreground"
        >
          {question}
        </label>
        <Input
          id={inputId}
          value={text}
          disabled={isBusy}
          onChange={(event) => setText(event.target.value)}
          className="h-8 min-w-0 flex-1"
        />
        <Button type="submit" size="sm" disabled={isBusy || text.trim() === ""}>
          Save
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={isBusy}
          onClick={dismiss}
          aria-label={`Hide this question for ${gameTitle}`}
        >
          <X aria-hidden="true" />
        </Button>
      </div>
      {errorMessage ? (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}

/**
 * The optional one-line prompts on the game page. The server derives the
 * `prompts` flags; Playing games never show one. Answering saves a note
 * headed by its question, dismissing hides the prompt for good.
 */
export function GamePrompts({
  libraryItemId,
  gameTitle,
  prompts,
  status,
}: GamePromptsProps) {
  if (status === "PLAYING") return null;

  return (
    <div className="flex flex-col gap-1">
      {prompts.why ? (
        <PromptRow
          libraryItemId={libraryItemId}
          gameTitle={gameTitle}
          kind="WHY"
        />
      ) : null}
      {prompts.stayed ? (
        <PromptRow
          libraryItemId={libraryItemId}
          gameTitle={gameTitle}
          kind="STAYED"
        />
      ) : null}
    </div>
  );
}

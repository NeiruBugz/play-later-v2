import { useState } from "react";
import { toast } from "sonner";

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };
type UseFormSubmissionOptions<TInput, TOutput> = {
  action: (input: TInput) => Promise<ActionResult<TOutput>>;
  onSuccess?: (data: TOutput) => void;
  successMessage?: string | ((data: TOutput) => string);
  successDescription?: string | ((data: TOutput) => string);
  errorMessage?: string;
  onError?: (error: string) => void;
};
type UseFormSubmissionReturn<TInput> = {
  isSubmitting: boolean;
  handleSubmit: (data: TInput) => Promise<void>;
};

export function useFormSubmission<TInput, TOutput = unknown>({
  action,
  onSuccess,
  successMessage,
  successDescription,
  errorMessage = "An error occurred",
  onError,
}: UseFormSubmissionOptions<TInput, TOutput>): UseFormSubmissionReturn<TInput> {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (data: TInput) => {
    try {
      setIsSubmitting(true);
      const result = await action(data);
      if (result.success) {
        const message =
          typeof successMessage === "function"
            ? successMessage(result.data)
            : successMessage;
        const description =
          typeof successDescription === "function"
            ? successDescription(result.data)
            : successDescription;
        if (message) {
          toast.success(message, { description });
        }
        onSuccess?.(result.data);
      } else {
        toast.error(errorMessage, { description: result.error });
        onError?.(result.error);
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Please try again later.";
      toast.error("An unexpected error occurred", { description: errorMsg });
      onError?.(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };
  return {
    isSubmitting,
    handleSubmit,
  };
}

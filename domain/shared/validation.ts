import { z } from "zod";
import { ValidationError } from "./errors";
import { failure, Result, success } from "./result";

export const validateWithZod = <T>(
  schema: z.ZodType<T>,
  data: unknown
): Result<T, ValidationError> => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errorMessage = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    return failure(new ValidationError(errorMessage, result.error));
  }

  return success(result.data);
};

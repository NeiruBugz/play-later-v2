type SafeParseResult = {
  success: boolean;
  error?: {
    issues: Array<{ message?: string }>;
  };
};

export function getFirstValidationError(
  result: SafeParseResult,
  fallback = "Invalid input parameters"
): string {
  if (result.success) return "";
  return result.error?.issues[0]?.message ?? fallback;
}

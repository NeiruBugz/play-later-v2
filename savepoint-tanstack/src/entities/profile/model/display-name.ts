type DisplayNameSource = {
  name: string | null;
  username: string | null;
};

export function getDisplayName(
  { name, username }: DisplayNameSource,
  fallback: string
): string {
  const trimmedName = name?.trim();
  const isEmailShaped = trimmedName?.includes("@") ?? false;
  const chosenName = trimmedName && !isEmailShaped ? trimmedName : null;

  return chosenName ?? username ?? fallback;
}

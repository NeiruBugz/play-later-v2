export const MAX_AVATAR_FILE_SIZE = 4 * 1024 * 1024;

export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export function validateAvatarFile(file: File): string | null {
  if (file.size > MAX_AVATAR_FILE_SIZE) {
    return "File size exceeds 4MB. Please upload a smaller image.";
  }

  if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.type)) {
    return "Unsupported file format. Please upload a JPG, PNG, GIF, or WebP image.";
  }

  return null;
}

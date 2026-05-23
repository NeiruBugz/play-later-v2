import { useRouter } from "@tanstack/react-router";
import { useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { getAvatarPresignedUrlFn } from "../../api/get-avatar-presigned-url";
import { setAvatarUrlFn } from "../../api/set-avatar-url";

// Mirrors `AVATAR_MIME_ALLOW_LIST` in `@/shared/api/s3`. Inlined here because
// that module reads server-only env at import time and would crash the client
// bundle / jsdom test if imported from a UI component.
const ACCEPT_ATTR = "image/jpeg,image/png,image/gif,image/webp";

export type AvatarUploadProps = {
  /**
   * Visible/SR label for the trigger. Defaults to "Upload avatar" so existing
   * tests (`getByLabelText("Upload avatar")`) continue to pass. Use
   * `"Change avatar"` when the affordance is rendered as an overlay on an
   * already-displayed avatar (own-profile header).
   */
  label?: string;
};

export function AvatarUpload({
  label = "Upload avatar",
}: AvatarUploadProps = {}) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset value so re-selecting the same file still triggers change.
    event.currentTarget.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const { uploadUrl, publicUrl } = await getAvatarPresignedUrlFn({
        data: { contentType: file.type, contentLength: file.size },
      });

      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!response.ok) {
        throw new Error(`S3 PUT failed with status ${response.status}`);
      }

      await setAvatarUrlFn({ data: { url: publicUrl } });

      router.invalidate();
      toast.success("Avatar updated");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not update avatar";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <span>{label}</span>
      <input
        type="file"
        accept={ACCEPT_ATTR}
        onChange={handleChange}
        disabled={isUploading}
        aria-label={label}
        className="sr-only"
      />
    </label>
  );
}

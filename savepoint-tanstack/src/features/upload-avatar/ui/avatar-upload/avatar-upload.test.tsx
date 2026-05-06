import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAvatarPresignedUrlFn } from "../../api/get-avatar-presigned-url";
import { setAvatarUrlFn } from "../../api/set-avatar-url";
import { AvatarUpload } from "./avatar-upload";

// --- Server fn mocks ---

vi.mock("../../api/get-avatar-presigned-url", () => ({
  getAvatarPresignedUrlFn: vi.fn(),
}));

vi.mock("../../api/set-avatar-url", () => ({
  setAvatarUrlFn: vi.fn(),
}));

// --- Toast mock (mirrors edit-profile precedent) ---

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// --- Router mock (mirrors app-sidebar.test.tsx precedent) ---

const mockRouterInvalidate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: mockRouterInvalidate }),
}));

// --- Stub constants ---

const STUB_UPLOAD_URL = "https://s3.example.com/upload/stub-key";
const STUB_PUBLIC_URL = "https://cdn.example.com/avatars/stub-key.jpg";

// --- Helpers ---

const createMockFile = (
  name: string,
  size: number,
  type: string = "image/jpeg"
): File => {
  const content = "x".repeat(size);
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
};

// --- Element vocabulary ---

const elements = {
  getFileInput: () =>
    screen.getByLabelText("Upload avatar") as HTMLInputElement,
};

// --- Test suite ---

describe("AvatarUpload", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("given a valid image file is uploaded (happy flow)", () => {
    beforeEach(async () => {
      vi.mocked(getAvatarPresignedUrlFn).mockResolvedValue({
        uploadUrl: STUB_UPLOAD_URL,
        publicUrl: STUB_PUBLIC_URL,
      });

      vi.mocked(setAvatarUrlFn).mockResolvedValue({ ok: true });

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
      );

      render(<AvatarUpload />);

      const file = createMockFile("avatar.jpg", 1024);
      await userEvent.upload(elements.getFileInput(), file);
    });

    it("calls getAvatarPresignedUrlFn with the file contentType and contentLength", async () => {
      await waitFor(() => {
        expect(vi.mocked(getAvatarPresignedUrlFn)).toHaveBeenCalledOnce();
      });

      expect(vi.mocked(getAvatarPresignedUrlFn)).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contentType: "image/jpeg",
          contentLength: 1024,
        }),
      });
    });

    it("PUTs the file to the uploadUrl via fetch", async () => {
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        STUB_UPLOAD_URL,
        expect.objectContaining({
          method: "PUT",
          body: expect.any(File),
        })
      );
    });

    it("calls setAvatarUrlFn with the publicUrl", async () => {
      await waitFor(() => {
        expect(vi.mocked(setAvatarUrlFn)).toHaveBeenCalledOnce();
      });

      expect(vi.mocked(setAvatarUrlFn)).toHaveBeenCalledWith({
        data: { url: STUB_PUBLIC_URL },
      });
    });

    it("calls router.invalidate to refresh loaders", async () => {
      await waitFor(() => {
        expect(mockRouterInvalidate).toHaveBeenCalled();
      });
    });

    it("does not render an error UI", async () => {
      // Wait for the full flow to settle before asserting absence of errors
      await waitFor(() => {
        expect(vi.mocked(setAvatarUrlFn)).toHaveBeenCalledOnce();
      });

      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("fires toast.success once with 'Avatar updated' after router.invalidate", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledOnce();
      });

      expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Avatar updated");
      expect(mockRouterInvalidate).toHaveBeenCalled();
      // Success path must not also fire an error toast.
      expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
    });
  });

  describe("given the presign step fails", () => {
    const PRESIGN_ERROR = "File too large (limit: 5MB)";

    beforeEach(async () => {
      vi.mocked(getAvatarPresignedUrlFn).mockRejectedValue(
        new Error(PRESIGN_ERROR)
      );
      vi.stubGlobal("fetch", vi.fn());

      render(<AvatarUpload />);

      const file = createMockFile("avatar.jpg", 1024);
      await userEvent.upload(elements.getFileInput(), file);
    });

    it("fires toast.error with the thrown error message", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
      });

      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(PRESIGN_ERROR);
    });

    it("does not call setAvatarUrlFn or router.invalidate", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
      });

      expect(vi.mocked(setAvatarUrlFn)).not.toHaveBeenCalled();
      expect(mockRouterInvalidate).not.toHaveBeenCalled();
      expect(vi.mocked(toast.success)).not.toHaveBeenCalled();
    });
  });

  describe("given the S3 PUT step fails", () => {
    beforeEach(async () => {
      vi.mocked(getAvatarPresignedUrlFn).mockResolvedValue({
        uploadUrl: STUB_UPLOAD_URL,
        publicUrl: STUB_PUBLIC_URL,
      });

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(null, { status: 500 }))
      );

      render(<AvatarUpload />);

      const file = createMockFile("avatar.jpg", 1024);
      await userEvent.upload(elements.getFileInput(), file);
    });

    it("fires toast.error with the S3 PUT failure message", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
      });

      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        "S3 PUT failed with status 500"
      );
    });

    it("does not call setAvatarUrlFn or router.invalidate", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
      });

      expect(vi.mocked(setAvatarUrlFn)).not.toHaveBeenCalled();
      expect(mockRouterInvalidate).not.toHaveBeenCalled();
      expect(vi.mocked(toast.success)).not.toHaveBeenCalled();
    });
  });

  describe("given the setAvatarUrl persist step fails", () => {
    const PERSIST_ERROR = "Database write failed";

    beforeEach(async () => {
      vi.mocked(getAvatarPresignedUrlFn).mockResolvedValue({
        uploadUrl: STUB_UPLOAD_URL,
        publicUrl: STUB_PUBLIC_URL,
      });

      vi.mocked(setAvatarUrlFn).mockRejectedValue(new Error(PERSIST_ERROR));

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
      );

      render(<AvatarUpload />);

      const file = createMockFile("avatar.jpg", 1024);
      await userEvent.upload(elements.getFileInput(), file);
    });

    it("fires toast.error with the persist failure message", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
      });

      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(PERSIST_ERROR);
    });

    it("does not call router.invalidate or fire success toast", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledOnce();
      });

      expect(mockRouterInvalidate).not.toHaveBeenCalled();
      expect(vi.mocked(toast.success)).not.toHaveBeenCalled();
    });
  });
});

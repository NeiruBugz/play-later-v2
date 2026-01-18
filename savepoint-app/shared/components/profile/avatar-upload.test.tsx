import { VALID_IMAGE_TYPES } from "@fixtures/enum-test-cases";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { uploadAvatar } from "@/shared/server-actions/profile";

import { AvatarUpload } from "./avatar-upload";

vi.mock("@/shared/server-actions/profile", () => ({
  uploadAvatar: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const createMockFile = (name: string, size: number, type: string): File => {
  const content = "x".repeat(size);
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
};

global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

describe("AvatarUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders upload prompt when no avatar", () => {
      render(<AvatarUpload />);

      expect(
        screen.getByText(/Click to upload or drag and drop/i)
      ).toBeVisible();
      expect(
        screen.getByText(/JPG, PNG, GIF, or WebP \(max 4MB\)/i)
      ).toBeVisible();
      expect(screen.getByLabelText(/Upload avatar/i)).toBeVisible();
    });

    it("renders current avatar with change overlay when provided", () => {
      render(<AvatarUpload currentAvatar="https://example.com/avatar.jpg" />);

      const img = screen.getByAltText(/Current avatar/i);
      expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
      expect(screen.getByText(/Change/i)).toBeVisible();
      expect(screen.getByLabelText(/Change avatar/i)).toBeVisible();
    });
  });

  describe("File Selection", () => {
    it("opens file picker on click", async () => {
      render(<AvatarUpload />);

      const uploadArea = screen.getByLabelText(/Upload avatar/i);
      const fileInput = screen.getByLabelText(/File input for avatar upload/i);

      const clickSpy = vi.spyOn(fileInput as HTMLInputElement, "click");

      await userEvent.click(uploadArea);

      expect(clickSpy).toHaveBeenCalled();
    });

    it("shows preview and action buttons after file selection", async () => {
      render(<AvatarUpload />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await userEvent.upload(input, file);

      expect(screen.getByAltText(/Selected avatar preview/i)).toBeVisible();
      expect(
        screen.getByRole("button", { name: /Upload selected avatar/i })
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: /Cancel avatar upload/i })
      ).toBeVisible();
    });

    it.each(["{Enter}", " "])(
      "allows keyboard navigation with %s key",
      async (key) => {
        render(<AvatarUpload />);

        const uploadArea = screen.getByLabelText(/Upload avatar/i);
        const fileInput = screen.getByLabelText(
          /File input for avatar upload/i
        );

        const clickSpy = vi.spyOn(fileInput as HTMLInputElement, "click");

        uploadArea.focus();
        await userEvent.keyboard(key);

        expect(clickSpy).toHaveBeenCalled();
      }
    );
  });

  describe("Drag and Drop", () => {
    it("accepts file via drop and shows preview", async () => {
      render(<AvatarUpload />);

      const dropZone = screen.getByLabelText(/Upload avatar/i);
      const file = createMockFile("test.jpg", 1024, "image/jpeg");

      const dataTransfer = {
        files: [file],
      };

      fireEvent.drop(dropZone, { dataTransfer });

      await waitFor(() => {
        expect(screen.getByText(/Upload/i)).toBeVisible();
        expect(screen.getByAltText(/Selected avatar preview/i)).toBeVisible();
      });
    });
  });

  describe("Validation", () => {
    it("rejects file over 4MB with correct error message", async () => {
      const onUploadError = vi.fn();
      render(<AvatarUpload onUploadError={onUploadError} />);

      const file = createMockFile("large.jpg", 6 * 1024 * 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await userEvent.upload(input, file);

      expect(
        screen.getByText(
          /File size exceeds 4MB. Please upload a smaller image./i
        )
      ).toBeVisible();
      expect(onUploadError).toHaveBeenCalledWith(
        "File size exceeds 4MB. Please upload a smaller image."
      );
    });

    it("rejects unsupported MIME type with correct error", async () => {
      const onUploadError = vi.fn();
      render(<AvatarUpload onUploadError={onUploadError} />);

      const file = createMockFile("document.txt", 1024, "text/plain");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      Object.defineProperty(input, "files", {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      expect(screen.getByRole("alert")).toHaveTextContent(
        /Unsupported file format. Please upload a JPG, PNG, GIF, or WebP image./i
      );
      expect(onUploadError).toHaveBeenCalledWith(
        "Unsupported file format. Please upload a JPG, PNG, GIF, or WebP image."
      );
    });

    it.each(VALID_IMAGE_TYPES)(
      "accepts valid $description file",
      async ({ name, type }) => {
        render(<AvatarUpload />);

        const file = createMockFile(name, 1024, type);
        const input = screen.getByLabelText(
          /File input for avatar upload/i
        ) as HTMLInputElement;

        await userEvent.upload(input, file);

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(screen.getByText(/Upload/i)).toBeVisible();
      }
    );
  });

  describe("Upload", () => {
    it("calls uploadAvatar action with selected file", async () => {
      vi.mocked(uploadAvatar).mockResolvedValue({
        success: true,
        data: { url: "https://s3.example.com/avatar.jpg" },
      });

      render(<AvatarUpload />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await userEvent.upload(input, file);

      const uploadButton = screen.getByRole("button", {
        name: /Upload selected avatar/i,
      });
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(uploadAvatar).toHaveBeenCalledWith({ file });
      });
    });

    it("shows loading state and disables interactions during upload", async () => {
      vi.mocked(uploadAvatar).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: { url: "https://s3.example.com/avatar.jpg" },
                }),
              100
            )
          )
      );

      render(<AvatarUpload />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await userEvent.upload(input, file);

      const uploadButton = screen.getByRole("button", {
        name: /Upload selected avatar/i,
      });
      await userEvent.click(uploadButton);

      expect(uploadButton).toHaveTextContent("Uploading...");
      expect(screen.getByText(/Uploading your avatar.../i)).toBeVisible();
      expect(uploadButton).toBeDisabled();
      expect(
        screen.getByRole("button", { name: /Cancel avatar upload/i })
      ).toBeDisabled();
    });

    it("calls onUploadSuccess callback and clears preview on success", async () => {
      const onUploadSuccess = vi.fn();
      vi.mocked(uploadAvatar).mockResolvedValue({
        success: true,
        data: { url: "https://s3.example.com/avatar.jpg" },
      });

      render(<AvatarUpload onUploadSuccess={onUploadSuccess} />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await userEvent.upload(input, file);

      const uploadButton = screen.getByRole("button", {
        name: /Upload selected avatar/i,
      });
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(onUploadSuccess).toHaveBeenCalledWith(
          "https://s3.example.com/avatar.jpg"
        );
        expect(
          screen.queryByAltText(/Selected avatar preview/i)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: /Upload selected avatar/i })
        ).not.toBeInTheDocument();
      });
    });

    it("calls onUploadError callback and keeps preview on failure for retry", async () => {
      const onUploadError = vi.fn();
      vi.mocked(uploadAvatar).mockResolvedValue({
        success: false,
        error: "Upload failed",
      });

      render(<AvatarUpload onUploadError={onUploadError} />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await userEvent.upload(input, file);

      const uploadButton = screen.getByRole("button", {
        name: /Upload selected avatar/i,
      });
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(onUploadError).toHaveBeenCalledWith("Upload failed");
        expect(screen.getByText(/Upload failed/i)).toBeVisible();
      });

      expect(screen.getByAltText(/Selected avatar preview/i)).toBeVisible();
      expect(uploadButton).toBeVisible();
    });

    it("shows default error message when upload throws exception", async () => {
      vi.mocked(uploadAvatar).mockRejectedValue(new Error("Network error"));

      render(<AvatarUpload />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await userEvent.upload(input, file);

      const uploadButton = screen.getByRole("button", {
        name: /Upload selected avatar/i,
      });
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Image upload failed. Please try again./i)
        ).toBeVisible();
      });
    });
  });

  describe("Cancel", () => {
    it("resets to initial state when Cancel clicked", async () => {
      render(<AvatarUpload />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await userEvent.upload(input, file);

      expect(screen.getByAltText(/Selected avatar preview/i)).toBeVisible();

      const cancelButton = screen.getByRole("button", {
        name: /Cancel avatar upload/i,
      });
      await userEvent.click(cancelButton);

      expect(
        screen.queryByAltText(/Selected avatar preview/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Upload selected avatar/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Cancel avatar upload/i })
      ).not.toBeInTheDocument();
    });

    it("clears validation errors when Cancel clicked", async () => {
      render(<AvatarUpload />);

      const file = createMockFile("large.jpg", 6 * 1024 * 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await userEvent.upload(input, file);

      expect(screen.getByText(/File size exceeds 4MB/i)).toBeVisible();

      const validFile = createMockFile("test.jpg", 1024, "image/jpeg");
      await userEvent.upload(input, validFile);

      const cancelButton = screen.getByRole("button", {
        name: /Cancel avatar upload/i,
      });
      await userEvent.click(cancelButton);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});

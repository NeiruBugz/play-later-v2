import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { uploadAvatar } from "@/features/profile/server-actions";

import { AvatarUpload } from "./avatar-upload";

vi.mock("@/features/profile/server-actions", () => ({
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
    });

    it("renders current avatar when provided", () => {
      render(<AvatarUpload currentAvatar="https://example.com/avatar.jpg" />);

      const img = screen.getByAltText(/Current avatar/i);
      expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
    });

    it("shows Change overlay on hover when current avatar exists", () => {
      render(<AvatarUpload currentAvatar="https://example.com/avatar.jpg" />);

      expect(screen.getByText(/Change/i)).toBeVisible();
    });

    it("renders with aria-label for upload state", () => {
      render(<AvatarUpload />);

      expect(screen.getByLabelText(/Upload avatar/i)).toBeVisible();
    });

    it("renders with aria-label for change state", () => {
      render(<AvatarUpload currentAvatar="https://example.com/avatar.jpg" />);

      expect(screen.getByLabelText(/Change avatar/i)).toBeVisible();
    });
  });

  describe("File Selection", () => {
    it("opens file picker on click", async () => {
      const user = userEvent.setup();
      render(<AvatarUpload />);

      const uploadArea = screen.getByLabelText(/Upload avatar/i);
      const fileInput = screen.getByLabelText(/File input for avatar upload/i);

      const clickSpy = vi.spyOn(fileInput as HTMLInputElement, "click");

      await user.click(uploadArea);

      expect(clickSpy).toHaveBeenCalled();
    });

    it("accepts file via file input", async () => {
      const user = userEvent.setup();
      render(<AvatarUpload />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await user.upload(input, file);

      expect(screen.getByText(/Upload/i)).toBeVisible();
      expect(screen.getByText(/Cancel/i)).toBeVisible();
    });

    it("displays file preview after selection", async () => {
      const user = userEvent.setup();
      render(<AvatarUpload />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await user.upload(input, file);

      expect(screen.getByAltText(/Selected avatar preview/i)).toBeVisible();
    });

    it("shows Upload and Cancel buttons after selection", async () => {
      const user = userEvent.setup();
      render(<AvatarUpload />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await user.upload(input, file);

      expect(
        screen.getByRole("button", { name: /Upload selected avatar/i })
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: /Cancel avatar upload/i })
      ).toBeVisible();
    });

    it("allows keyboard navigation with Enter key", async () => {
      render(<AvatarUpload />);

      const uploadArea = screen.getByLabelText(/Upload avatar/i);
      const fileInput = screen.getByLabelText(/File input for avatar upload/i);

      const clickSpy = vi.spyOn(fileInput as HTMLInputElement, "click");

      uploadArea.focus();
      fireEvent.keyDown(uploadArea, { key: "Enter" });

      expect(clickSpy).toHaveBeenCalled();
    });

    it("allows keyboard navigation with Space key", async () => {
      render(<AvatarUpload />);

      const uploadArea = screen.getByLabelText(/Upload avatar/i);
      const fileInput = screen.getByLabelText(/File input for avatar upload/i);

      const clickSpy = vi.spyOn(fileInput as HTMLInputElement, "click");

      uploadArea.focus();
      fireEvent.keyDown(uploadArea, { key: " " });

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe("Drag and Drop", () => {
    it("highlights drop zone on drag over", () => {
      render(<AvatarUpload />);

      const dropZone = screen.getByLabelText(/Upload avatar/i);

      fireEvent.dragOver(dropZone);

      expect(dropZone).toHaveClass("border-blue-500");
    });

    it("removes highlight on drag leave", () => {
      render(<AvatarUpload />);

      const dropZone = screen.getByLabelText(/Upload avatar/i);

      fireEvent.dragOver(dropZone);
      fireEvent.dragLeave(dropZone);

      expect(dropZone).not.toHaveClass("border-blue-500");
    });

    it("accepts file via drop", async () => {
      render(<AvatarUpload />);

      const dropZone = screen.getByLabelText(/Upload avatar/i);
      const file = createMockFile("test.jpg", 1024, "image/jpeg");

      const dataTransfer = {
        files: [file],
      };

      fireEvent.drop(dropZone, { dataTransfer });

      await waitFor(() => {
        expect(screen.getByText(/Upload/i)).toBeVisible();
      });
    });

    it("shows preview after drop", async () => {
      render(<AvatarUpload />);

      const dropZone = screen.getByLabelText(/Upload avatar/i);
      const file = createMockFile("test.jpg", 1024, "image/jpeg");

      const dataTransfer = {
        files: [file],
      };

      fireEvent.drop(dropZone, { dataTransfer });

      await waitFor(() => {
        expect(screen.getByAltText(/Selected avatar preview/i)).toBeVisible();
      });
    });
  });

  describe("Validation", () => {
    it("rejects file over 4MB with correct error message", async () => {
      const user = userEvent.setup();
      const onUploadError = vi.fn();
      render(<AvatarUpload onUploadError={onUploadError} />);

      const file = createMockFile("large.jpg", 6 * 1024 * 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await user.upload(input, file);

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

    it("accepts valid JPEG file", async () => {
      const user = userEvent.setup();
      render(<AvatarUpload />);

      const file = createMockFile("photo.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await user.upload(input, file);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByText(/Upload/i)).toBeVisible();
    });

    it("accepts valid PNG file", async () => {
      const user = userEvent.setup();
      render(<AvatarUpload />);

      const file = createMockFile("photo.png", 1024, "image/png");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await user.upload(input, file);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByText(/Upload/i)).toBeVisible();
    });

    it("accepts valid GIF file", async () => {
      const user = userEvent.setup();
      render(<AvatarUpload />);

      const file = createMockFile("animation.gif", 1024, "image/gif");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await user.upload(input, file);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByText(/Upload/i)).toBeVisible();
    });

    it("accepts valid WebP file", async () => {
      const user = userEvent.setup();
      render(<AvatarUpload />);

      const file = createMockFile("photo.webp", 1024, "image/webp");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await user.upload(input, file);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByText(/Upload/i)).toBeVisible();
    });
  });

  describe("Upload", () => {
    it("calls uploadAvatar action with selected file", async () => {
      const user = userEvent.setup();
      vi.mocked(uploadAvatar).mockResolvedValue({
        success: true,
        data: { url: "https://s3.example.com/avatar.jpg" },
      });

      render(<AvatarUpload />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await user.upload(input, file);

      const uploadButton = screen.getByRole("button", {
        name: /Upload selected avatar/i,
      });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(uploadAvatar).toHaveBeenCalledWith({ file });
      });
    });

    it("shows loading state during upload", async () => {
      const user = userEvent.setup();
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

      await user.upload(input, file);

      const uploadButton = screen.getByRole("button", {
        name: /Upload selected avatar/i,
      });
      await user.click(uploadButton);

      expect(
        screen.getByRole("button", { name: /Upload selected avatar/i })
      ).toHaveTextContent("Uploading...");
      expect(screen.getByText(/Uploading your avatar.../i)).toBeVisible();
    });

    it("disables interactions during upload", async () => {
      const user = userEvent.setup();
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

      await user.upload(input, file);

      const uploadButton = screen.getByRole("button", {
        name: /Upload selected avatar/i,
      });
      await user.click(uploadButton);

      expect(uploadButton).toBeDisabled();
      expect(
        screen.getByRole("button", { name: /Cancel avatar upload/i })
      ).toBeDisabled();
    });

    it("calls onUploadSuccess callback on success", async () => {
      const user = userEvent.setup();
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

      await user.upload(input, file);

      const uploadButton = screen.getByRole("button", {
        name: /Upload selected avatar/i,
      });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(onUploadSuccess).toHaveBeenCalledWith(
          "https://s3.example.com/avatar.jpg"
        );
      });
    });

    it("clears preview on successful upload", async () => {
      const user = userEvent.setup();
      vi.mocked(uploadAvatar).mockResolvedValue({
        success: true,
        data: { url: "https://s3.example.com/avatar.jpg" },
      });

      render(<AvatarUpload />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await user.upload(input, file);

      const uploadButton = screen.getByRole("button", {
        name: /Upload selected avatar/i,
      });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(
          screen.queryByAltText(/Selected avatar preview/i)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: /Upload selected avatar/i })
        ).not.toBeInTheDocument();
      });
    });

    it("calls onUploadError callback on failure", async () => {
      const user = userEvent.setup();
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

      await user.upload(input, file);

      const uploadButton = screen.getByRole("button", {
        name: /Upload selected avatar/i,
      });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(onUploadError).toHaveBeenCalledWith("Upload failed");
      });
    });

    it("shows error message on upload failure", async () => {
      const user = userEvent.setup();
      vi.mocked(uploadAvatar).mockResolvedValue({
        success: false,
        error: "Network error",
      });

      render(<AvatarUpload />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await user.upload(input, file);

      const uploadButton = screen.getByRole("button", {
        name: /Upload selected avatar/i,
      });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeVisible();
      });
    });

    it("keeps preview on upload failure for retry", async () => {
      const user = userEvent.setup();
      vi.mocked(uploadAvatar).mockResolvedValue({
        success: false,
        error: "Upload failed",
      });

      render(<AvatarUpload />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await user.upload(input, file);

      const uploadButton = screen.getByRole("button", {
        name: /Upload selected avatar/i,
      });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/Upload failed/i)).toBeVisible();
      });

      expect(screen.getByAltText(/Selected avatar preview/i)).toBeVisible();
      expect(uploadButton).toBeVisible();
    });

    it("shows default error message when upload throws exception", async () => {
      const user = userEvent.setup();
      vi.mocked(uploadAvatar).mockRejectedValue(new Error("Network error"));

      render(<AvatarUpload />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await user.upload(input, file);

      const uploadButton = screen.getByRole("button", {
        name: /Upload selected avatar/i,
      });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Image upload failed. Please try again./i)
        ).toBeVisible();
      });
    });
  });

  describe("Cancel", () => {
    it("removes preview when Cancel clicked", async () => {
      const user = userEvent.setup();
      render(<AvatarUpload />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await user.upload(input, file);

      expect(screen.getByAltText(/Selected avatar preview/i)).toBeVisible();

      const cancelButton = screen.getByRole("button", {
        name: /Cancel avatar upload/i,
      });
      await user.click(cancelButton);

      expect(
        screen.queryByAltText(/Selected avatar preview/i)
      ).not.toBeInTheDocument();
    });

    it("clears selected file when Cancel clicked", async () => {
      const user = userEvent.setup();
      render(<AvatarUpload />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await user.upload(input, file);

      const cancelButton = screen.getByRole("button", {
        name: /Cancel avatar upload/i,
      });
      await user.click(cancelButton);

      expect(
        screen.queryByRole("button", { name: /Upload selected avatar/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Cancel avatar upload/i })
      ).not.toBeInTheDocument();
    });

    it("hides Upload and Cancel buttons after cancel", async () => {
      const user = userEvent.setup();
      render(<AvatarUpload />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await user.upload(input, file);

      expect(
        screen.getByRole("button", { name: /Upload selected avatar/i })
      ).toBeVisible();

      const cancelButton = screen.getByRole("button", {
        name: /Cancel avatar upload/i,
      });
      await user.click(cancelButton);

      expect(
        screen.queryByRole("button", { name: /Upload selected avatar/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Cancel avatar upload/i })
      ).not.toBeInTheDocument();
    });

    it("clears validation errors when Cancel clicked", async () => {
      const user = userEvent.setup();
      render(<AvatarUpload />);

      const file = createMockFile("large.jpg", 6 * 1024 * 1024, "image/jpeg");
      const input = screen.getByLabelText(
        /File input for avatar upload/i
      ) as HTMLInputElement;

      await user.upload(input, file);

      expect(screen.getByText(/File size exceeds 4MB/i)).toBeVisible();

      const validFile = createMockFile("test.jpg", 1024, "image/jpeg");
      await user.upload(input, validFile);

      const cancelButton = screen.getByRole("button", {
        name: /Cancel avatar upload/i,
      });
      await user.click(cancelButton);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});

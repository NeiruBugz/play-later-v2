import { render, screen } from "@testing-library/react";

import { GameCoverImage } from "./game-cover-image";

describe("GameCoverImage", () => {
  describe("Placeholder mode", () => {
    it("should display placeholder when imageId is null", () => {
      render(<GameCoverImage imageId={null} gameTitle="Test Game" />);

      expect(screen.getByText("No cover available")).toBeVisible();
      expect(screen.getByLabelText("No cover image available")).toBeVisible();
    });

    it("should display placeholder when imageId is undefined", () => {
      render(<GameCoverImage gameTitle="Test Game" />);

      expect(screen.getByText("No cover available")).toBeVisible();
      expect(screen.getByLabelText("No cover image available")).toBeVisible();
    });

    it("should display placeholder when imageId is empty string", () => {
      render(<GameCoverImage imageId="" gameTitle="Test Game" />);

      expect(screen.getByText("No cover available")).toBeVisible();
    });

    it("should display placeholder when imageId is whitespace only", () => {
      render(<GameCoverImage imageId="   " gameTitle="Test Game" />);

      expect(screen.getByText("No cover available")).toBeVisible();
    });

    it("should display gamepad icon in placeholder", () => {
      render(<GameCoverImage imageId={null} gameTitle="Test Game" />);

      // lucide-react icons render as SVG elements
      const icon = screen.getByTestId("game-cover-icon");
      expect(icon).toBeVisible();
    });
  });

  describe("Image mode", () => {
    it("should render image with correct alt text when cover exists", () => {
      render(<GameCoverImage imageId="abc123" gameTitle="Zelda" />);

      const img = screen.getByRole("img");
      expect(img).toBeVisible();
      expect(img).toHaveAttribute("alt", "Zelda cover");
    });

    it("should build correct IGDB URL from image_id", () => {
      render(<GameCoverImage imageId="abc123" gameTitle="Test Game" />);

      const img = screen.getByRole("img");
      // Next.js Image component transforms the src to use the image optimization API
      // The URL is encoded in the query string
      const src = img.getAttribute("src");
      expect(src).toContain("images.igdb.com");
      expect(src).toContain("abc123");
      // Next.js may optimize the image size, so we just check for the image ID
    });

    it("should apply custom className when provided", () => {
      render(
        <GameCoverImage
          imageId="abc123"
          gameTitle="Test Game"
          className="custom-class"
        />
      );

      const imageContainer = screen.getByTestId("game-cover-image");
      expect(imageContainer).toHaveClass("custom-class");
    });

    it("should not display placeholder text when cover exists", () => {
      render(<GameCoverImage imageId="abc123" gameTitle="Test Game" />);

      expect(screen.queryByText("No cover available")).not.toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have aspect ratio of 3:4 for images", () => {
      render(<GameCoverImage imageId="abc123" gameTitle="Test Game" />);

      const imageContainer = screen.getByTestId("game-cover-image");
      expect(imageContainer).toHaveClass("aspect-[3/4]");
    });

    it("should have aspect ratio of 3:4 for placeholder", () => {
      render(<GameCoverImage imageId={null} gameTitle="Test Game" />);

      const placeholder = screen.getByTestId("game-cover-placeholder");
      expect(placeholder).toHaveClass("aspect-[3/4]");
    });

    it("should have max-width constraint", () => {
      render(<GameCoverImage imageId={null} gameTitle="Test Game" />);

      const element = screen.getByTestId("game-cover-placeholder");
      expect(element).toHaveClass("max-w-sm");
    });
  });
});

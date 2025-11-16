/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GameCoverImage } from "./game-cover-image";

describe("GameCoverImage", () => {
  it("should render image when imageId is provided", () => {
    render(
      <GameCoverImage
        imageId="abc123"
        gameTitle="Test Game"
        size="cover_big"
      />
    );

    const image = screen.getByAltText("Test Game cover");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute(
      "src",
      expect.stringContaining("abc123.jpg")
    );
  });

  it("should render placeholder when imageId is null", () => {
    render(
      <GameCoverImage imageId={null} gameTitle="Test Game" size="cover_big" />
    );

    expect(screen.getByText("No Cover")).toBeInTheDocument();
  });

  it("should render custom placeholder content", () => {
    render(
      <GameCoverImage
        imageId={null}
        gameTitle="Test Game"
        size="cover_big"
        placeholderContent={<div>Custom Placeholder</div>}
      />
    );

    expect(screen.getByText("Custom Placeholder")).toBeInTheDocument();
  });

  it("should not render anything when imageId is null and showPlaceholder is false", () => {
    const { container } = render(
      <GameCoverImage
        imageId={null}
        gameTitle="Test Game"
        size="cover_big"
        showPlaceholder={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should apply custom className to container", () => {
    const { container } = render(
      <GameCoverImage
        imageId="abc123"
        gameTitle="Test Game"
        size="cover_big"
        className="custom-class h-32 w-24"
      />
    );

    const imageContainer = container.querySelector(".custom-class");
    expect(imageContainer).toBeInTheDocument();
    expect(imageContainer).toHaveClass("h-32", "w-24");
  });

  it("should apply hover effect by default", () => {
    render(
      <GameCoverImage imageId="abc123" gameTitle="Test Game" size="cover_big" />
    );

    const image = screen.getByAltText("Test Game cover");
    expect(image).toHaveClass("group-hover:scale-105");
  });

  it("should not apply hover effect when disabled", () => {
    render(
      <GameCoverImage
        imageId="abc123"
        gameTitle="Test Game"
        size="cover_big"
        enableHoverEffect={false}
      />
    );

    const image = screen.getByAltText("Test Game cover");
    expect(image).not.toHaveClass("group-hover:scale-105");
  });

  it("should handle IGDB URL imageId", () => {
    const igdbUrl =
      "https://images.igdb.com/igdb/image/upload/t_cover_big/abc123.jpg";

    render(
      <GameCoverImage
        imageId={igdbUrl}
        gameTitle="Test Game"
        size="cover_big"
      />
    );

    const image = screen.getByAltText("Test Game cover");
    expect(image).toBeInTheDocument();
  });

  it("should render with different sizes", () => {
    const sizes = ["thumbnail", "cover_small", "cover_big", "hd"] as const;

    sizes.forEach((size) => {
      const { unmount } = render(
        <GameCoverImage
          imageId="abc123"
          gameTitle={`Test Game ${size}`}
          size={size}
        />
      );

      const image = screen.getByAltText(`Test Game ${size} cover`);
      expect(image).toBeInTheDocument();
      unmount();
    });
  });

  it("should set priority when specified", () => {
    render(
      <GameCoverImage
        imageId="abc123"
        gameTitle="Test Game"
        size="cover_big"
        priority={true}
      />
    );

    const image = screen.getByAltText("Test Game cover");
    expect(image).toBeInTheDocument();
  });

  it("should use lazy loading by default", () => {
    render(
      <GameCoverImage imageId="abc123" gameTitle="Test Game" size="cover_big" />
    );

    const image = screen.getByAltText("Test Game cover");
    expect(image).toHaveAttribute("loading", "lazy");
  });
});

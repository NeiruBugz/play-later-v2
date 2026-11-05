import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QueueMarker } from "./queue-marker";

describe("QueueMarker", () => {
  it("reads 'Up Next #2' for a queued Want game", () => {
    render(<QueueMarker status="WANT" upNextPosition={2} />);
    expect(screen.getByText("Up Next #2")).toBeDefined();
  });

  it("reads 'Replay' for a queued Done game", () => {
    render(<QueueMarker status="DONE" upNextPosition={4} />);
    expect(screen.getByText("Replay")).toBeDefined();
  });

  it("shows nothing for a game that is not queued", () => {
    const { container } = render(
      <QueueMarker status="WANT" upNextPosition={null} />
    );
    expect(container.textContent).toBe("");
  });

  it("shows nothing for a Playing game", () => {
    const { container } = render(
      <QueueMarker status="PLAYING" upNextPosition={1} />
    );
    expect(container.textContent).toBe("");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { keepOpenOnToastPress } from "./keep-open-on-toast-press";

function pressOn(target: Element, reason: string) {
  const event = new Event("pointerdown");
  Object.defineProperty(event, "target", { value: target });
  return { reason, event, cancel: vi.fn() };
}

function mount(html: string) {
  document.body.innerHTML = html;
  return document.getElementById("target") as Element;
}

describe("keepOpenOnToastPress", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("cancels the close when an outside press lands inside the toaster", () => {
    const target = mount(
      '<section data-sonner-toaster><li data-sonner-toast><button id="target"></button></li></section>'
    );
    const onOpenChange = vi.fn();
    const details = pressOn(target, "outside-press");

    keepOpenOnToastPress(onOpenChange)(false, details);

    expect(details.cancel).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("forwards an outside press that lands elsewhere", () => {
    const target = mount('<div id="target"></div>');
    const onOpenChange = vi.fn();
    const details = pressOn(target, "outside-press");

    keepOpenOnToastPress(onOpenChange)(false, details);

    expect(details.cancel).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false, details);
  });

  it("forwards escape-key closes even when the target is inside the toaster", () => {
    const target = mount(
      '<section data-sonner-toaster><button id="target"></button></section>'
    );
    const onOpenChange = vi.fn();
    const details = pressOn(target, "escape-key");

    keepOpenOnToastPress(onOpenChange)(false, details);

    expect(details.cancel).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false, details);
  });

  it("forwards opening", () => {
    const target = mount(
      '<section data-sonner-toaster><button id="target"></button></section>'
    );
    const onOpenChange = vi.fn();
    const details = pressOn(target, "outside-press");

    keepOpenOnToastPress(onOpenChange)(true, details);

    expect(details.cancel).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(true, details);
  });
});

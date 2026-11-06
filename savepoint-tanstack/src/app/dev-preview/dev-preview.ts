import "./dev-preview.css";

export const PREVIEW_FONT_STYLESHEETS = {
  a: "https://fonts.googleapis.com/css2?family=Fraunces:wght@500;700&display=swap",
  b: "https://fonts.googleapis.com/css2?family=Young+Serif&display=swap",
  c: "https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;700&display=swap",
} as const;

type Option = keyof typeof PREVIEW_FONT_STYLESHEETS;

const OPTION = /^[abc]$/;
const ACCENT_PARAM = /^accent-([abc])$/;

function isOption(value: string | undefined): value is Option {
  return value !== undefined && OPTION.test(value);
}

export function applyPreview(
  search: string,
  root: HTMLElement,
  head: HTMLElement
): void {
  const params = new URLSearchParams(search);

  const accent = ACCENT_PARAM.exec(params.get("preview") ?? "")?.[1];
  if (isOption(accent)) root.dataset.previewAccent = accent;

  const font = params.get("font") ?? undefined;
  if (isOption(font)) {
    root.dataset.previewFont = font;
    const link = head.ownerDocument.createElement("link");
    link.rel = "stylesheet";
    link.href = PREVIEW_FONT_STYLESHEETS[font];
    head.appendChild(link);
  }
}

if (typeof document !== "undefined") {
  applyPreview(window.location.search, document.documentElement, document.head);
}

// Screen-inventory probe for ui-audit.md § Metrics. Paste as the `function` of Playwright MCP `browser_evaluate`.
// Counts only what is rendered and visible; "aboveFold" = top edge inside the current viewport.
() => {
  const isVisible = (el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0;
  };
  const interactiveSelector =
    'a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=link],[role=menuitem],[role=tab],[role=checkbox],[role=switch],[role=combobox],[tabindex]:not([tabindex="-1"])';
  const interactive = [...document.querySelectorAll(interactiveSelector)].filter(isVisible);
  const aboveFold = interactive.filter((el) => el.getBoundingClientRect().top < innerHeight);
  const labelOf = (el) =>
    (el.getAttribute("aria-label") || el.innerText || el.getAttribute("title") || el.getAttribute("placeholder") || "")
      .trim().replace(/\s+/g, " ").toLowerCase().slice(0, 60);
  const distinctActions = new Set(
    interactive.map((el) => (el.tagName === "A" ? `link:${el.getAttribute("href")}` : `control:${labelOf(el)}`)),
  );
  const text = document.body.innerText;
  const domainTerms = [
    "Wishlist", "Shelf", "Up Next", "Playing", "Played", "Replay", "Tried", "Playthrough", "Finished", "Abandoned",
    "Set manually", "Follows your playthroughs", "Quick note", "Reflection", "Best rating", "Rating", "Journal",
    "Log", "Session", "Completed", "Backlog", "Mood",
  ].filter((term) => new RegExp(`\\b${term}\\b`).test(text));
  const blocks = [...document.querySelectorAll("main section, main article, [data-slot=card]")].filter(isVisible).length;
  return {
    url: location.pathname + location.search,
    viewport: `${innerWidth}x${innerHeight}`,
    interactive: interactive.length,
    aboveFold: aboveFold.length,
    distinctActions: distinctActions.size,
    domainTerms,
    words: text.split(/\s+/).filter(Boolean).length,
    blocks,
  };
}

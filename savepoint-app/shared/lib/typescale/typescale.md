# Type Scale

Semantic aliases that compose the existing CSS variable tokens defined in `shared/globals.css`. Each alias produces identical computed styles to its legacy counterpart — they are pure aliases, not new stops on the scale.

## Mapping Table

| Semantic utility | Legacy token | Role |
|---|---|---|
| `text-display` | `display-lg` | Hero surfaces. Use at most once per page. Optional. |
| `text-h1` | `heading-xl` | Page subject heading. Exactly one per page. |
| `text-h2` | `heading-lg` | Section headings. |
| `text-h3` | `heading-md` | Sub-section headings. |
| `text-body` | `body-md` | Default reading text. |
| `text-caption` | `caption` | Labels, eyebrows, metadata, timestamps. |

## Role Rules

- **`text-display`** — hero surfaces only (e.g., game detail title at the top of the page, auth page brand mark). Maximum one occurrence per page. Omit entirely on pages with no hero moment.
- **`text-h1`** — the primary subject of the page (game name, journal entry title, section name). Every page must have exactly one element carrying `text-h1`. Never skip to `text-h2` without a `text-h1` above it.
- **`text-h2`** — section headings that divide the page into major regions. Multiple allowed. Must not appear without a preceding `text-h1` on the same page.
- **`text-h3`** — sub-section headings nested under a `text-h2` region. Multiple allowed.
- **`text-body`** — the default style for all prose content: descriptions, journal bodies, metadata paragraphs.
- **`text-caption`** — small supporting text: mood eyebrows, platform labels, timestamps, tag labels, form hints.

## JSX Examples

```tsx
export default function GameDetailPage({ game }: Props) {
  return (
    <article>
      <h1 className="text-display">{game.title}</h1>
      <p className="text-caption">{game.releaseYear} · {game.platform}</p>

      <section>
        <h2 className="text-h2">About</h2>
        <p className="text-body">{game.description}</p>
      </section>

      <section>
        <h2 className="text-h2">Journal</h2>
        <h3 className="text-h3">Recent entries</h3>
        {entries.map((entry) => (
          <div key={entry.id}>
            <p className="text-caption">{entry.mood} · {entry.date}</p>
            <p className="text-body">{entry.excerpt}</p>
          </div>
        ))}
      </section>
    </article>
  );
}
```

## Migration Note

Legacy utilities (`heading-xl`, `heading-lg`, `heading-md`, `body-md`, `caption`, and all other `display-*`, `heading-*`, `body-*`, `subheading-*` classes) remain available in `shared/globals.css` and are not deprecated by this change. Pages that have not yet been updated by Slices 5–11 continue to use the legacy names without modification. The semantic aliases will replace legacy names page-by-page as each slice lands; the full migration is tracked in the spec tasks file.

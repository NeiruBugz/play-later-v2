import { Star } from "lucide-react";

/**
 * Mini-features strip (left column). Renders three labeled blocks under the
 * hero: Library / Journal / Timeline. Stacks vertically on mobile.
 */
export function LandingFeaturesStrip() {
  const items = [
    { title: "Library", body: "All platforms · Steam import" },
    { title: "Journal", body: "Reflect, don't review" },
    { title: "Timeline", body: "Your gaming, chronologically" },
  ];

  return (
    <div className="border-border/30 border-t pt-6">
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.title} className="space-y-1">
            <p className="text-foreground text-sm font-semibold">
              {item.title}
            </p>
            <p className="text-muted-foreground text-xs">{item.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Decorative right-column preview card. Static only — illustrative content
 * showing what the app looks like (current game, journal entry, up-next).
 * No interactive elements, no data fetching.
 */
export function LandingPreviewCard() {
  return (
    <div className="relative">
      <div className="border-border/40 bg-card/40 relative overflow-hidden rounded-3xl border p-5 shadow-2xl backdrop-blur-sm">
        <div className="from-primary relative h-56 overflow-hidden rounded-2xl bg-gradient-to-br via-fuchsia-500 to-rose-500">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_60%)]" />
          <span className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/20 px-2.5 py-0.5 text-[10px] font-medium tracking-[0.16em] text-white/90 uppercase backdrop-blur-sm">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-white"
            />
            CURRENTLY EXPLORING
          </span>
          <div className="absolute right-4 bottom-4 left-4">
            <p className="text-2xl font-semibold tracking-tight text-white">
              Hollow Knight
            </p>
            <p className="mt-1 text-[11px] tracking-[0.18em] text-white/70 uppercase">
              TEAM CHERRY · 2017
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-muted-foreground text-[11px] tracking-[0.16em] uppercase">
            SESSION 12 · 47H TOTAL
          </p>
          <div
            className="flex items-center gap-0.5"
            aria-label="4 out of 5 stars"
          >
            {[0, 1, 2, 3].map((i) => (
              <Star
                key={i}
                aria-hidden="true"
                className="fill-primary text-primary h-3.5 w-3.5"
              />
            ))}
            <Star
              aria-hidden="true"
              className="text-muted-foreground/40 h-3.5 w-3.5"
            />
          </div>
        </div>

        <div className="border-border/40 bg-background/40 mt-4 rounded-xl border p-4">
          <p className="text-muted-foreground text-[10px] font-medium tracking-[0.18em] uppercase">
            APR 22 · JOURNAL ENTRY
          </p>
          <p className="text-foreground/90 mt-2 text-sm leading-relaxed italic">
            &ldquo;Took five tries on Hornet — finally read the dash pattern.
            The arena lighting in this fight is unreal.&rdquo;
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-muted-foreground text-[11px] font-medium tracking-[0.18em] uppercase">
            UP NEXT
          </p>
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-6 w-6 rounded-md bg-gradient-to-br from-rose-500 to-orange-500" />
            <span className="h-6 w-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600" />
            <span className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-400 to-indigo-400" />
          </div>
        </div>
      </div>

      <div className="border-border/40 bg-background/80 text-muted-foreground absolute right-4 -bottom-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] backdrop-blur-sm">
        <span aria-hidden="true">↳</span>
        <span>218 in your library</span>
      </div>
    </div>
  );
}

/**
 * Composite export — renders both the strip and the preview card in a
 * fragment. For callers that don't need to place them in separate grid cells.
 */
export function LandingFeatures() {
  return (
    <>
      <LandingFeaturesStrip />
      <LandingPreviewCard />
    </>
  );
}

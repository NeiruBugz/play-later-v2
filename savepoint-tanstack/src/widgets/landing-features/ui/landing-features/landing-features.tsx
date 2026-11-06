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
    <div className="border-t border-border/30 pt-6">
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.title} className="space-y-1">
            <p className="text-base font-semibold text-foreground md:text-sm">
              {item.title}
            </p>
            <p className="text-base text-muted-foreground md:text-sm">
              {item.body}
            </p>
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
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/40 p-5 shadow-2xl backdrop-blur-sm">
        <div className="relative h-56 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-fuchsia-500 to-rose-500">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_60%)]" />
          <span className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/20 px-2.5 py-0.5 text-xs font-medium tracking-[0.12em] text-white/90 uppercase backdrop-blur-sm">
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
            <span className="mt-1 block text-xs tracking-[0.14em] text-white/70 uppercase">
              TEAM CHERRY · 2017
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
            SESSION 12 · 47H TOTAL
          </span>
          <div
            className="flex items-center gap-0.5"
            aria-label="4 out of 5 stars"
          >
            {[0, 1, 2, 3].map((i) => (
              <Star
                key={i}
                aria-hidden="true"
                className="h-3.5 w-3.5 fill-primary text-primary"
              />
            ))}
            <Star
              aria-hidden="true"
              className="h-3.5 w-3.5 text-muted-foreground/40"
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border/40 bg-background/40 p-4">
          <span className="block text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            APR 22 · NOTE
          </span>
          <p className="mt-2 text-base leading-relaxed text-foreground/90 italic md:text-sm">
            &ldquo;Took five tries on Hornet — finally read the dash pattern.
            The arena lighting in this fight is unreal.&rdquo;
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            UP NEXT
          </span>
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-6 w-6 rounded-md bg-gradient-to-br from-rose-500 to-orange-500" />
            <span className="h-6 w-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600" />
            <span className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-400 to-indigo-400" />
          </div>
        </div>
      </div>

      <div className="absolute right-4 -bottom-3 inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
        <span aria-hidden="true">↳</span>
        <span>218 in your library</span>
      </div>
    </div>
  );
}

import { Star } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { SectionLabel } from "@/shared/ui/section-label";

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
    <div className="border-t pt-6">
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
      <Card className="gap-4 p-5">
        <div className="relative h-56 overflow-hidden rounded-2xl bg-primary text-primary-foreground">
          <Badge
            variant="secondary"
            className="absolute top-4 left-4 h-auto gap-2 px-2.5 py-0.5 tracking-[0.12em] uppercase"
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-primary"
            />
            CURRENTLY EXPLORING
          </Badge>
          <div className="absolute right-4 bottom-4 left-4">
            <p className="text-2xl font-semibold tracking-tight">
              Hollow Knight
            </p>
            <span className="mt-1 block text-xs tracking-[0.14em] uppercase">
              TEAM CHERRY · 2017
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <SectionLabel
            as="span"
            className="text-xs tracking-[0.12em] uppercase"
          >
            SESSION 12 · 47H TOTAL
          </SectionLabel>
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

        <Card variant="flat" size="sm" className="bg-muted">
          <div className="px-(--card-spacing)">
            <SectionLabel
              as="span"
              className="block text-xs tracking-[0.14em] uppercase"
            >
              APR 22 · NOTE
            </SectionLabel>
            <p className="mt-2 text-base leading-relaxed text-foreground italic md:text-sm">
              &ldquo;Took five tries on Hornet — finally read the dash pattern.
              The arena lighting in this fight is unreal.&rdquo;
            </p>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <SectionLabel
            as="span"
            className="text-xs tracking-[0.14em] uppercase"
          >
            UP NEXT
          </SectionLabel>
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-6 w-6 rounded-md bg-muted" />
            <span className="h-6 w-6 rounded-md bg-muted" />
            <span className="h-6 w-6 rounded-md bg-muted" />
          </div>
        </div>
      </Card>

      <Badge
        variant="outline"
        className="absolute right-4 -bottom-3 h-auto gap-1.5 bg-background px-3 py-1 font-normal"
      >
        <span aria-hidden="true">↳</span>
        <span>218 in your library</span>
      </Badge>
    </div>
  );
}

import { Badge } from "@/shared/ui/badge";
import { Button, buttonVariants } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import { getActiveAnnouncements } from "../../config";
import type { AnnouncementCategory } from "../../model/types";
import { useWhatsNew } from "../../model/use-whats-new";

const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  feature: "New Feature",
  improvement: "Improvement",
  integration: "Integration",
};

// Multi-step pagination (canonical's Next / Dismiss-all flow) is intentionally
// dropped in favour of a single dialog — see DIVERGENCES.md → Slice 20.
export function WhatsNewModal() {
  const { isOpen, dismiss } = useWhatsNew();
  const announcements = getActiveAnnouncements();

  if (announcements.length === 0) return null;

  const primary = announcements[0];
  if (!primary) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Badge variant="secondary">
              {CATEGORY_LABELS[primary.category]}
            </Badge>
          </div>
          <DialogTitle className="flex items-center gap-1.5">
            {primary.icon ? (
              <primary.icon className="h-5 w-5 text-primary" />
            ) : null}
            {primary.title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {primary.description}
          </DialogDescription>
        </DialogHeader>

        {announcements.length > 1 ? (
          <ul className="space-y-2">
            {announcements.slice(1).map((announcement) => (
              <li
                key={announcement.id}
                className="rounded-md border border-border p-2"
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <Badge variant="secondary">
                    {CATEGORY_LABELS[announcement.category]}
                  </Badge>
                </div>
                <p className="text-sm font-semibold">{announcement.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {announcement.description}
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        <DialogFooter className="gap-1.5 sm:gap-1.5">
          <div className="flex gap-1.5">
            {primary.ctaUrl && primary.ctaLabel ? (
              <a
                href={primary.ctaUrl}
                className={buttonVariants({ variant: "secondary" })}
                onClick={dismiss}
              >
                {primary.ctaLabel}
              </a>
            ) : null}
            <Button onClick={dismiss}>Got it</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

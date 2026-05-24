import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
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
          <div className="mb-sm gap-sm flex items-center">
            <Badge variant="secondary">
              {CATEGORY_LABELS[primary.category]}
            </Badge>
          </div>
          <DialogTitle className="gap-sm flex items-center">
            {primary.icon ? (
              <primary.icon className="text-primary h-5 w-5" />
            ) : null}
            {primary.title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {primary.description}
          </DialogDescription>
        </DialogHeader>

        {announcements.length > 1 ? (
          <ul className="space-y-md">
            {announcements.slice(1).map((announcement) => (
              <li
                key={announcement.id}
                className="border-border p-md rounded-md border"
              >
                <div className="mb-xs gap-sm flex items-center">
                  <Badge variant="secondary">
                    {CATEGORY_LABELS[announcement.category]}
                  </Badge>
                </div>
                <p className="text-sm font-semibold">{announcement.title}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {announcement.description}
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        <DialogFooter className="gap-sm sm:gap-sm">
          <div className="gap-sm flex">
            {primary.ctaUrl && primary.ctaLabel ? (
              <Button asChild variant="secondary" onClick={dismiss}>
                <a href={primary.ctaUrl}>{primary.ctaLabel}</a>
              </Button>
            ) : null}
            <Button onClick={dismiss}>Got it</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

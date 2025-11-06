import type { TimesToBeatData } from "@/data-access-layer/services/igdb/types";

interface TimesToBeatSectionProps {
  timesToBeat?: TimesToBeatData;
}

export function TimesToBeatSection({ timesToBeat }: TimesToBeatSectionProps) {
  const mainStory = timesToBeat?.mainStory;
  const completionist = timesToBeat?.completionist;

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Times to Beat</h2>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Main Story:</dt>
          <dd>{mainStory ? `${mainStory} hours` : "—"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">100% Completion:</dt>
          <dd>{completionist ? `${completionist} hours` : "—"}</dd>
        </div>
      </dl>
    </div>
  );
}

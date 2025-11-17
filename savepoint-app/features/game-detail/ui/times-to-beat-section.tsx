import type { TimesToBeatSectionProps } from "./times-to-beat-section.types";

export function TimesToBeatSection({ timesToBeat }: TimesToBeatSectionProps) {
  const mainStory = timesToBeat?.mainStory;
  const completionist = timesToBeat?.completionist;
  return (
    <section className="space-y-2" aria-labelledby="times-to-beat-heading">
      <h2 id="times-to-beat-heading" className="text-lg font-semibold">
        Times to Beat
      </h2>
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
    </section>
  );
}

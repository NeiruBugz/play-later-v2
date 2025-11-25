import type { TimesToBeatSectionProps } from "./times-to-beat-section.types";

export function TimesToBeatSection({ timesToBeat }: TimesToBeatSectionProps) {
  const mainStory = timesToBeat?.mainStory;
  const completionist = timesToBeat?.completionist;
  return (
    <section className="space-y-md" aria-labelledby="times-to-beat-heading">
      <h2 id="times-to-beat-heading" className="heading-md">
        Times to Beat
      </h2>
      <dl className="body-sm space-y-xs">
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

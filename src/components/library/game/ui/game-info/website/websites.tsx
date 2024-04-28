import { Website } from "@/src/components/library/game/ui/game-info/website/website";
import { FullGameInfoResponse } from "@/src/packages/types/igdb";

export const Websites = ({
  sites,
}: {
  sites: FullGameInfoResponse["websites"];
}) => (
  <section className="my-3">
    <div className="grid grid-cols-[180px_minmax(180px,_1fr)] justify-items-start gap-1">
      {sites.map((site) => (
        <Website key={site.id} url={site.url} />
      ))}
    </div>
  </section>
);

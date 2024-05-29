import type { FullGameInfoResponse } from "@/src/packages/types/igdb";

import { Website } from "@/src/components/library/game/game-info/website/website";

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

import { FullGameInfoResponse } from "@/lib/types/igdb";

import { Website } from "@/app/(features)/(protected)/library/components/game/ui/game-info/website";

export const Websites = ({
  sites,
}: {
  sites: FullGameInfoResponse["websites"];
}) => (
  <section className="my-3">
    <div className="grid grid-cols-[180px_minmax(180px,_1fr)] justify-items-start gap-1">
      {sites.map((site) => (
        <Website url={site.url} key={site.id} />
      ))}
    </div>
  </section>
);

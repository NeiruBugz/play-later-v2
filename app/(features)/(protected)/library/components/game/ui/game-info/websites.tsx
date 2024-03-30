import { FullGameInfoResponse } from "@/lib/types/igdb";

import { Website } from "@/app/(features)/(protected)/library/components/game/ui/game-info/website";

export const Websites = ({
  sites,
}: {
  sites: FullGameInfoResponse["websites"];
}) => (
  <section>
    <h4 className="mb-3 scroll-m-20 text-xl font-semibold tracking-tight">
      Websites
    </h4>
    <div className="grid grid-cols-[170px_minmax(170px,_1fr)] justify-items-start gap-1">
      {sites.map((site) => (
        <Website url={site.url} key={site.id} />
      ))}
    </div>
  </section>
);
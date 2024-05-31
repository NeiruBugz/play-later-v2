import type { FullGameInfoResponse } from "@/src/shared/types";

import { Website } from "./website";

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
